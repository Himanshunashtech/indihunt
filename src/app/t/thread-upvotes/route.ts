import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidateCache } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// POST /t/thread-upvotes — toggle upvote on a thread
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, thread_id, userId, user_id } = body;
    const tId = threadId || thread_id;
    const uId = userId || user_id;

    if (!tId || !uId) return apiFailure('threadId and userId are required', 400);

    const supabase = await createServerSupabaseClient();

    // Check if already upvoted
    const { data: existing } = await supabase
      .from('thread_upvotes')
      .select('id')
      .eq('thread_id', tId)
      .eq('user_id', uId)
      .maybeSingle();

    if (existing) {
      await supabase.from('thread_upvotes').delete().eq('id', existing.id);
    } else {
      await supabase.from('thread_upvotes').insert({ thread_id: tId, user_id: uId });
    }

    // Return updated count from threads table
    const { data: thread } = await supabase
      .from('threads')
      .select('upvotes_count')
      .eq('id', tId)
      .single();

    await invalidateCache(`thread:${tId}`);
    await invalidateCache('threads:all');

    return apiSuccess({
      success: true,
      upvotes_count: thread?.upvotes_count || 0,
      has_upvoted: !existing,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle thread upvote', 500);
  }
}

// GET /t/thread-upvotes?threadId=xxx&userId=xxx — check if user has upvoted
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId') || searchParams.get('thread_id');
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    if (!threadId || !userId) return apiFailure('threadId and userId are required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from('thread_upvotes')
      .select('id')
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .maybeSingle();

    return apiSuccess({ has_upvoted: !!existing });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to check thread upvote', 500);
  }
}
