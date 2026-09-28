import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation, getProductSlug } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    const supabase = await createServerSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let thread: any = null;

    if (isUuid) {
      const { data } = await supabase
        .from('threads')
        .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
        .eq('id', id)
        .maybeSingle();
      thread = data;
    }

    if (!thread) {
      const { data: allThreads } = await supabase
        .from('threads')
        .select('id, title');
      if (allThreads) {
        const decoded = decodeURIComponent(id).toLowerCase().trim();
        const matched = allThreads.find(
          (t: any) =>
            getProductSlug(t.title).toLowerCase() === decoded ||
            t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decoded ||
            t.id === id
        );
        if (matched) {
          const { data: fullThread } = await supabase
            .from('threads')
            .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
            .eq('id', matched.id)
            .maybeSingle();
          thread = fullThread;
        }
      }
    }

    if (!thread) {
      return apiFailure('Thread not found', 404);
    }

    let hasUpvoted = false;
    if (userId) {
      const { data: upvote } = await supabase
        .from('thread_upvotes')
        .select('id')
        .eq('thread_id', thread.id)
        .eq('user_id', userId)
        .maybeSingle();
      hasUpvoted = !!upvote;
    }

    return apiSuccessSecure({ ...thread, has_upvoted: hasUpvoted });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch thread', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, title, body: threadBody, category } = body;

    if (!userId) {
      return apiFailure('Missing userId', 400);
    }

    const updates: Record<string, any> = {};

    if (title) {
      const titleViolation = checkContentViolation(title);
      if (titleViolation.hasViolation) {
        return apiFailure(titleViolation.message || 'Content violation in title', 400);
      }
      updates.title = title;
    }

    if (threadBody) {
      const bodyViolation = checkContentViolation(threadBody);
      if (bodyViolation.hasViolation) {
        return apiFailure(bodyViolation.message || 'Content violation in body', 400);
      }
      updates.body = threadBody;
    }

    if (category) {
      updates.category = category;
    }

    const supabase = await createServerSupabaseClient();
    const { data: updatedThread, error } = await supabase
      .from('threads')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(updatedThread);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update thread', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('threads').delete().eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;
    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ deleted: true }, 200);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete thread', 500);
  }
}
