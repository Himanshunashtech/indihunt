import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { getProductSlug } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId, user_id } = body;
    const uId = userId || user_id;

    if (!uId || !threadId) {
      return apiFailure('Valid userId and threadId are required', 400);
    }

    const supabase = await createServerSupabaseClient();
    let targetThreadId = threadId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId);

    if (!isUuid) {
      const { data: allThreads } = await supabase
        .from('threads')
        .select('id, title');
      if (allThreads) {
        const decoded = decodeURIComponent(threadId).toLowerCase().trim();
        const matched = allThreads.find(
          (t: any) =>
            getProductSlug(t.title).toLowerCase() === decoded ||
            t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decoded ||
            t.id === threadId
        );
        if (matched) {
          targetThreadId = matched.id;
        }
      }
    }

    const validTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetThreadId);
    if (!validTargetUuid) {
      return apiFailure('Thread not found or invalid UUID', 400);
    }

    const { data: existing } = await supabase
      .from('thread_upvotes')
      .select('id')
      .eq('thread_id', targetThreadId)
      .eq('user_id', uId)
      .maybeSingle();

    let hasUpvoted = false;

    if (existing) {
      await supabase.from('thread_upvotes').delete().eq('id', existing.id);
      hasUpvoted = false;
    } else {
      await supabase.from('thread_upvotes').insert({ thread_id: targetThreadId, user_id: uId });
      hasUpvoted = true;
    }

    const { count } = await supabase
      .from('thread_upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', targetThreadId);

    const updatedCount = count ?? (hasUpvoted ? 1 : 0);

    await supabase
      .from('threads')
      .update({ upvotes_count: updatedCount })
      .eq('id', targetThreadId);

    return apiSuccessSecure({
      has_upvoted: hasUpvoted,
      upvotes_count: updatedCount,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle thread upvote', 500);
  }
}
