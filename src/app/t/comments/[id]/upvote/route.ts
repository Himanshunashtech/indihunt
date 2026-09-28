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
    const { data: existing } = await supabase
      .from('comment_upvotes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    let hasUpvoted = false;
    if (existing) {
      await supabase.from('comment_upvotes').delete().eq('id', existing.id);
      hasUpvoted = false;
    } else {
      await supabase.from('comment_upvotes').insert({ comment_id: id, user_id: userId });
      hasUpvoted = true;
    }

    const { count } = await supabase
      .from('comment_upvotes')
      .select('id', { count: 'exact', head: true })
      .eq('comment_id', id);

    const upvotesCount = count || 0;

    await supabase
      .from('comments')
      .update({ upvotes_count: upvotesCount })
      .eq('id', id);

    return apiSuccessSecure({
      success: true,
      has_upvoted: hasUpvoted,
      upvotes_count: upvotesCount,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle comment upvote', 500);
  }
}
