import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, invalidateCache } from '@/lib/redis';
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
      const decoded = decodeURIComponent(threadId).toLowerCase().trim();
      const words = decoded.split(/[-_]+/).filter((w) => w.length > 2);
      let candidates: any[] = [];
      if (words.length > 0) {
        const keywordPattern = `%${words.slice(0, 3).join('%')}%`;
        const { data } = await supabase
          .from('threads')
          .select('id, title')
          .ilike('title', keywordPattern)
          .limit(15);
        candidates = data || [];
      }
      if (!candidates.length) {
        const { data } = await supabase
          .from('threads')
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(50);
        candidates = data || [];
      }
      const matched = candidates.find(
        (t: any) =>
          getProductSlug(t.title).toLowerCase() === decoded ||
          t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decoded ||
          t.id === threadId
      );
      if (matched) {
        targetThreadId = matched.id;
      }
    }

    const validTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetThreadId);
    if (!validTargetUuid) {
      return apiFailure('Thread not found or invalid UUID', 400);
    }

    // Use admin client if configured to avoid RLS blockages on server mutations, otherwise use server client
    let dbClient: any = supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');
        dbClient = createAdminSupabaseClient();
      } catch (e) {
        dbClient = supabase;
      }
    }

    // Try reading session user if available, fallback to provided userId
    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const effectiveUserId = authData?.user?.id || uId;

    const { data: existing, error: existingErr } = await dbClient
      .from('thread_upvotes')
      .select('id')
      .eq('thread_id', targetThreadId)
      .eq('user_id', effectiveUserId)
      .maybeSingle();

    if (existingErr) {
      console.error('[Thread upvote check error]', existingErr);
      return apiFailure(existingErr.message || 'Failed to check existing thread upvote', 500);
    }

    let hasUpvoted = false;

    if (existing) {
      const { error: delErr, count: delCount } = await dbClient
        .from('thread_upvotes')
        .delete({ count: 'exact' })
        .eq('id', existing.id);

      if (delErr) {
        console.error('[Thread upvote DELETE error]', delErr);
        return apiFailure(delErr.message || 'Thread unvote blocked by database policy', 500);
      }
      if (delCount === 0) {
        console.warn('[Thread upvote DELETE 0 rows affected]');
        return apiFailure('Thread unvote failed (0 rows deleted, check RLS delete policy)', 500);
      }
      hasUpvoted = false;
    } else {
      const { error: insErr } = await dbClient
        .from('thread_upvotes')
        .insert({ thread_id: targetThreadId, user_id: effectiveUserId });

      if (insErr) {
        console.error('[Thread upvote INSERT error]', insErr);
        return apiFailure(insErr.message || 'Thread upvote blocked by database policy', 500);
      }
      hasUpvoted = true;
    }

    const { count, error: countErr } = await dbClient
      .from('thread_upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', targetThreadId);

    if (countErr) {
      console.warn('[Thread upvote COUNT error]', countErr);
    }

    const updatedCount = typeof count === 'number' ? count : (hasUpvoted ? 1 : 0);

    const { error: updateErr } = await dbClient
      .from('threads')
      .update({ upvotes_count: updatedCount })
      .eq('id', targetThreadId);

    if (updateErr) {
      console.warn('[Thread upvote count update error]', updateErr);
    }

    await Promise.allSettled([
      invalidateCache(`thread_detail_${threadId.toLowerCase()}`),
      invalidateCache(`thread_detail_${targetThreadId}`),
      invalidateCache('threads_all_50'),
    ]);

    return apiSuccessSecure({
      has_upvoted: hasUpvoted,
      upvotes_count: updatedCount,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle thread upvote', 500);
  }
}
