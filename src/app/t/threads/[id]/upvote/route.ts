import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiFailure } from '@/lib/api/response';

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
    const { data: existing } = await supabase
      .from('thread_upvotes')
      .select('id')
      .eq('thread_id', threadId)
      .eq('user_id', uId)
      .maybeSingle();

    let hasUpvoted = false;

    if (existing) {
      await supabase.from('thread_upvotes').delete().eq('id', existing.id);
      hasUpvoted = false;
    } else {
      await supabase.from('thread_upvotes').insert({ thread_id: threadId, user_id: uId });
      hasUpvoted = true;
    }

    const { count } = await supabase
      .from('thread_upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    const updatedCount = count ?? (hasUpvoted ? 1 : 0);

    await supabase
      .from('threads')
      .update({ upvotes_count: updatedCount })
      .eq('id', threadId);

    return apiSuccess({
      has_upvoted: hasUpvoted,
      upvotes_count: updatedCount,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle thread upvote', 500);
  }
}
