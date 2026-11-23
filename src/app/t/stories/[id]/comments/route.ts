import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getSupabaseClient() {
  try {
    return createAdminSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    let comments: any[] = [];
    const res = await supabase
      .from('story_comments')
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
      .eq('story_id', id)
      .order('created_at', { ascending: true });

    if (res.data && res.data.length > 0) {
      comments = res.data;
    } else if (res.error) {
      // Fallback simple query
      const fallback = await supabase
        .from('story_comments')
        .select('*')
        .eq('story_id', id)
        .order('created_at', { ascending: true });

      if (fallback.data && fallback.data.length > 0) {
        comments = fallback.data;
        const uids = Array.from(new Set(comments.map((c: any) => c.user_id).filter(Boolean)));
        if (uids.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, headline, karma_points, is_maker')
            .in('id', uids);

          if (profs && profs.length > 0) {
            const pMap = new Map(profs.map((p: any) => [p.id, p]));
            comments = comments.map((c: any) => ({
              ...c,
              user: pMap.get(c.user_id) || null
            }));
          }
        }
      }
    }

    return apiSuccessSecure(comments);
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

    const supabase = await getSupabaseClient();
    const { data: newComment, error } = await supabase
      .from('story_comments')
      .insert({
        story_id: id,
        user_id: userId,
        body: commentBody,
        parent_id: parentId || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[POST story comment] Error:', error);
      return apiFailure(error.message, 500);
    }

    let userProfile = null;
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, headline, karma_points, is_maker')
        .eq('id', userId)
        .maybeSingle();
      userProfile = prof;
    } catch {}

    const result = {
      ...newComment,
      user: userProfile || {
        id: userId,
        username: 'maker',
        full_name: 'Maker',
        avatar_url: `https://avatar.vercel.sh/${userId}`
      }
    };

    return apiSuccessSecure(result);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to post story comment', 500);
  }
}
