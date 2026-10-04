import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return apiFailure('Missing userId', 400);
    }

    const supabase = await createServerSupabaseClient();

    // 1. Check if upvote exists
    const { data: existing } = await supabase
      .from('comment_upvotes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    let hasUpvoted = false;
    let upvotesCount = 0;

    if (existing) {
      await supabase.from('comment_upvotes').delete().eq('id', existing.id);
      const { data: current } = await supabase
        .from('comments')
        .select('upvotes_count')
        .eq('id', id)
        .maybeSingle();
      const nextCount = Math.max(0, (current?.upvotes_count ?? 1) - 1);
      await supabase
        .from('comments')
        .update({ upvotes_count: nextCount })
        .eq('id', id);
      upvotesCount = nextCount;
      hasUpvoted = false;
    } else {
      await supabase.from('comment_upvotes').insert({ comment_id: id, user_id: userId });
      const { data: current } = await supabase
        .from('comments')
        .select('upvotes_count')
        .eq('id', id)
        .maybeSingle();
      const nextCount = (current?.upvotes_count ?? 0) + 1;
      await supabase
        .from('comments')
        .update({ upvotes_count: nextCount })
        .eq('id', id);
      upvotesCount = nextCount;
      hasUpvoted = true;
    }

    return apiSuccessSecure({
      success: true,
      has_upvoted: hasUpvoted,
      upvotes_count: upvotesCount,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle comment upvote', 500);
  }
}
