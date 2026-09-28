import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: comments, error } = await supabase
      .from('story_comments')
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
      .eq('story_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(comments || []);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch story comments', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, body: commentBody, parentId } = body;

    if (!userId || !commentBody) {
      return apiFailure('Missing userId or comment body', 400);
    }

    const violation = checkContentViolation(commentBody);
    if (violation.hasViolation) {
      return apiFailure(violation.message || 'Content violation detected', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: newComment, error } = await supabase
      .from('story_comments')
      .insert({
        story_id: id,
        user_id: userId,
        body: commentBody,
        parent_id: parentId || null,
      })
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(newComment);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to post story comment', 500);
  }
}
