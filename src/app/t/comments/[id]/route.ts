import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

import { getCachedData, invalidateCache, invalidateCachePattern } from '@/lib/redis';
import { bumpFeedVersion } from '@/lib/cache';
import { getProductSlug } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, body: newBody } = body;

    if (!userId || !newBody) {
      return apiFailure('Missing userId or comment body', 400);
    }

    const violation = checkContentViolation(newBody);
    if (violation.hasViolation) {
      return apiFailure(violation.message || 'Content violation detected', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: updatedComment, error } = await supabase
      .from('comments')
      .update({ body: newBody, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    if (updatedComment?.product_id) {
      await invalidateCache(`comments:product:${updatedComment.product_id}`);
    } else if (updatedComment?.thread_id) {
      await invalidateCache(`comments:thread:${updatedComment.thread_id}`);
    }

    return apiSuccessSecure(updatedComment);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update comment', 500);
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

    if (!userId) {
      return apiFailure('Missing userId parameter', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: comment } = await supabase
      .from('comments')
      .select('product_id, thread_id, user_id')
      .eq('id', id)
      .single();

    if (!comment || comment.user_id !== userId) {
      return apiFailure('Unauthorized to delete this comment', 403);
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return apiFailure(error.message, 500);
    }

    // Invalidate caches (Postgres triggers handle decrementing comments_count in the DB)
    if (comment.product_id) {
      const { data: prod } = await supabase.from('products').select('id, name').eq('id', comment.product_id).maybeSingle();
      const slug = prod?.name ? getProductSlug(prod.name) : null;
      await Promise.allSettled([
        invalidateCache(`comments:product:${comment.product_id}`),
        slug ? invalidateCache(`comments:product:${slug}`) : Promise.resolve(),
        invalidateCachePattern('redis_products_'),
        invalidateCache('public_products'),
        invalidateCache(`product_detail_${comment.product_id.toLowerCase()}`),
        slug ? invalidateCache(`product_detail_${slug.toLowerCase()}`) : Promise.resolve(),
        bumpFeedVersion(),
      ]);
    } else if (comment.thread_id) {
      await Promise.allSettled([
        invalidateCache(`comments:thread:${comment.thread_id}`),
        invalidateCache(`thread_detail_${comment.thread_id}`),
        invalidateCache('threads_all_50'),
      ]);
    }

    return apiSuccessSecure({ deleted: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete comment', 500);
  }
}
