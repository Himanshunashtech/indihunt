import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { getProductSlug } from '@/lib/supabase';
import { invalidateCache, invalidateCachePattern } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || !productId) {
      return apiFailure('Valid userId and productId are required', 400);
    }

    const supabase = await createServerSupabaseClient();
    let targetProductId = productId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

    if (!isUuid) {
      const { data: allProds } = await supabase
        .from('products')
        .select('id, name');
      if (allProds) {
        const decodedId = decodeURIComponent(productId).toLowerCase().trim();
        const matched = allProds.find(
          (p: any) =>
            getProductSlug(p.name).toLowerCase() === decodedId ||
            (p.slug && p.slug.toLowerCase() === decodedId) ||
            p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decodedId ||
            p.id === productId
        );
        if (matched) {
          targetProductId = matched.id;
        }
      }
    }

    const validTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetProductId);
    if (!validTargetUuid) {
      return apiFailure('Product not found or invalid UUID', 400);
    }

    const { data: existing } = await supabase
      .from('upvotes')
      .select('id')
      .eq('product_id', targetProductId)
      .eq('user_id', userId)
      .maybeSingle();

    let hasUpvoted = false;

    if (existing) {
      await supabase.from('upvotes').delete().eq('id', existing.id);
      hasUpvoted = false;
    } else {
      await supabase.from('upvotes').insert({ product_id: targetProductId, user_id: userId });
      hasUpvoted = true;
    }

    const { count } = await supabase
      .from('upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', targetProductId);

    const updatedCount = count ?? (hasUpvoted ? 1 : 0);

    await supabase
      .from('products')
      .update({ upvotes_count: updatedCount })
      .eq('id', targetProductId);

    // Invalidate server Redis caches so subsequent GETs immediately return updated counts & states
    await Promise.allSettled([
      invalidateCachePattern('redis_products_'),
      invalidateCachePattern('product_detail_'),
      invalidateCachePattern('public_product'),
      invalidateCachePattern('public_top_hunters_'),
      invalidateCache('public_products'),
    ]);

    // Fire-and-forget: notify the product maker when someone upvotes their product
    if (hasUpvoted) {
      (async () => {
        try {
          const { data: product } = await supabase
            .from('products')
            .select('name, maker_id, logo_url')
            .eq('id', targetProductId)
            .single();

          const { data: voter } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', userId)
            .single();

          const makerId = product?.maker_id;
          // Don't notify if the voter IS the maker
          if (makerId && makerId !== userId) {
            await supabase.from('notifications').insert({
              user_id: makerId,
              actor_id: userId,
              type: 'upvote',
              entity_type: 'product',
              entity_id: targetProductId,
              data: {
                product_name: product?.name,
                product_logo: product?.logo_url,
                actor_name: voter?.full_name || voter?.username || 'Someone',
                actor_avatar: voter?.avatar_url || '',
                action_url: `/products/${targetProductId}`,
                action_label: 'View product',
              },
              read: false,
            });
          }
        } catch {
          // Non-blocking — ignore notification errors
        }
      })();
    }

    return apiSuccessSecure({
      productId: targetProductId,
      has_upvoted: hasUpvoted,
      upvotes_count: updatedCount,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle upvote', 500);
  }
}
