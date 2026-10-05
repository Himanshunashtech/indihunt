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
    const effectiveUserId = authData?.user?.id || userId;

    // 1. Check if upvote exists
    const { data: existing, error: existingErr } = await dbClient
      .from('comment_upvotes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', effectiveUserId)
      .maybeSingle();

    if (existingErr) {
      console.error('[Comment upvote check error]', existingErr);
      return apiFailure(existingErr.message || 'Failed to check existing comment upvote', 500);
    }

    let hasUpvoted = false;
    let upvotesCount = 0;

    if (existing) {
      const { error: delErr, count: delCount } = await dbClient
        .from('comment_upvotes')
        .delete({ count: 'exact' })
        .eq('id', existing.id);

      if (delErr) {
        console.error('[Comment upvote DELETE error]', delErr);
        return apiFailure(delErr.message || 'Comment unvote blocked by database policy', 500);
      }
      if (delCount === 0) {
        console.warn('[Comment upvote DELETE 0 rows affected]');
        return apiFailure('Comment unvote failed (0 rows deleted, check RLS delete policy)', 500);
      }

      const { data: current } = await dbClient
        .from('comments')
        .select('upvotes_count')
        .eq('id', id)
        .maybeSingle();
      const nextCount = Math.max(0, (current?.upvotes_count ?? 1) - 1);
      await dbClient
        .from('comments')
        .update({ upvotes_count: nextCount })
        .eq('id', id);
      upvotesCount = nextCount;
      hasUpvoted = false;
    } else {
      const { error: insErr } = await dbClient
        .from('comment_upvotes')
        .insert({ comment_id: id, user_id: effectiveUserId });

      if (insErr) {
        console.error('[Comment upvote INSERT error]', insErr);
        return apiFailure(insErr.message || 'Comment upvote blocked by database policy', 500);
      }

      const { data: current } = await dbClient
        .from('comments')
        .select('upvotes_count')
        .eq('id', id)
        .maybeSingle();
      const nextCount = (current?.upvotes_count ?? 0) + 1;
      await dbClient
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
