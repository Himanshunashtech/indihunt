import { NextRequest, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { getProductSlug } from '@/lib/supabase';
import { getCachedData, invalidateCache, invalidateCachePattern } from '@/lib/redis';
import { bumpFeedVersion } from '@/lib/cache';
import { validateVoteVelocity } from '@/lib/antiFraud';
import { broadcastLiveEvent } from '@/lib/sseBroadcaster';
import { fastToggleUpvote } from '@/lib/upvoteEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    console.log(`[API /upvote] Received request for productId="${productId}", userId="${userId}"`);

    if (!userId || !productId) {
      console.warn('[API /upvote] Missing userId or productId');
      return apiFailure('Valid userId and productId are required', 400);
    }

    const supabase = await createServerSupabaseClient();
    let targetProductId = productId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

    if (!isUuid) {
      const decodedId = decodeURIComponent(productId).toLowerCase().trim();
      const slugMap = await getCachedData<Record<string, string>>('product_slug_map');
      if (slugMap && slugMap[decodedId]) {
        targetProductId = slugMap[decodedId];
      } else {
        const cleanSearch = decodedId.replace(/-/g, ' ');
        const { data: targeted } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', `%${cleanSearch}%`)
          .limit(10);

        if (targeted && targeted.length > 0) {
          const matched = targeted.find(
            (p: any) =>
              getProductSlug(p.name).toLowerCase() === decodedId ||
              p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decodedId ||
              p.name.toLowerCase().trim() === decodedId ||
              p.id === productId
          );
          targetProductId = matched ? matched.id : targeted[0].id;
        }
      }
    }

    const validTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetProductId);
    if (!validTargetUuid) {
      console.warn(`[API /upvote] Product "${productId}" could not be resolved to a valid UUID (resolved: "${targetProductId}")`);
      return apiFailure('Product not found or invalid UUID', 400);
    }

    // Try reading session user if available, fallback to provided userId
    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const effectiveUserId = authData?.user?.id || userId;

    // ── Pillar 4: Anti-Fraud & Velocity Protection ──
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
    const fraudCheck = await validateVoteVelocity(targetProductId, effectiveUserId, clientIp);
    if (!fraudCheck.allowed) {
      return apiFailure(fraudCheck.reason || 'Vote rate limit exceeded. Please wait a moment.', 429);
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

    console.log(`[API /upvote] Resolved targetProductId="${targetProductId}", effectiveUserId="${effectiveUserId}"`);

    let hasUpvoted = false;
    let updatedCount = 0;

    // 1. Try atomic database transaction RPC first
    const { data: rpcData, error: rpcErr } = await dbClient.rpc('toggle_product_upvote', {
      p_product_id: targetProductId,
      p_user_id: effectiveUserId,
    });

    if (!rpcErr && rpcData) {
      const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
      hasUpvoted = Boolean(parsed.has_upvoted);
      updatedCount = typeof parsed.upvotes_count === 'number' ? parsed.upvotes_count : 0;
      console.log(`[API /upvote] Atomic RPC success: hasUpvoted=${hasUpvoted}, count=${updatedCount}`);
    } else {
      if (rpcErr) {
        console.warn('[API /upvote] RPC unavailable or error, falling back to manual toggle:', rpcErr.message);
      }
      // Fallback: Safe manual toggle
      const { data: existing, error: existingErr } = await dbClient
        .from('upvotes')
        .select('id')
        .eq('product_id', targetProductId)
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (existingErr) {
        console.error('[API /upvote] Existing check error:', existingErr);
        return apiFailure(existingErr.message || 'Failed to check existing upvote', 500);
      }

      if (existing) {
        console.log(`[API /upvote] ACTION: UNVOTE (Deleting existing upvote id="${existing.id}")`);
        const { error: delErr } = await dbClient
          .from('upvotes')
          .delete()
          .eq('id', existing.id);

        if (delErr) {
          console.error('[API /upvote] DELETE error:', delErr);
          return apiFailure(delErr.message || 'Unvote blocked by database policy', 500);
        }
        hasUpvoted = false;
      } else {
        console.log(`[API /upvote] ACTION: UPVOTE (Inserting upvote for product="${targetProductId}", user="${effectiveUserId}")`);
        const { error: insErr } = await dbClient
          .from('upvotes')
          .insert({ product_id: targetProductId, user_id: effectiveUserId });

        if (insErr) {
          console.error('[API /upvote] INSERT error:', insErr);
          return apiFailure(insErr.message || 'Upvote blocked by database policy', 500);
        }
        hasUpvoted = true;
      }

      const { count } = await dbClient
        .from('upvotes')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', targetProductId);

      updatedCount = typeof count === 'number' ? count : (hasUpvoted ? 1 : 0);

      await dbClient
        .from('products')
        .update({ upvotes_count: updatedCount })
        .eq('id', targetProductId);
    }

    // ── Pillar 2: Broadcast live update via Server-Sent Events (SSE) ──
    broadcastLiveEvent({
      type: 'upvote',
      productId: targetProductId,
      hasUpvoted,
      upvotesCount: updatedCount,
      userId: effectiveUserId,
    });

    // Invalidate server Redis caches and Next.js ISR caches with fast targeted invalidations
    const decodedKey = decodeURIComponent(productId).toLowerCase().trim();
    try {
      revalidatePath('/');
      revalidatePath('/products');
      revalidatePath(`/products/${decodedKey}`);
      revalidatePath(`/products/${targetProductId}`);
    } catch (e) {}

    await Promise.allSettled([
      invalidateCachePattern('redis_products_'),
      invalidateCache(`product_detail_${targetProductId.toLowerCase()}`),
      invalidateCache(`product_detail_${decodedKey}`),
      invalidateCache('public_products'),
      invalidateCache(`upvotes:user:${effectiveUserId}`),
      invalidateCache(`upvotes_full:user:${effectiveUserId}`),
      ...(userId && userId !== effectiveUserId ? [
        invalidateCache(`upvotes:user:${userId}`),
        invalidateCache(`upvotes_full:user:${userId}`),
        invalidateCache(`bootstrap:${userId}`),
      ] : []),
      invalidateCache(`bootstrap:${effectiveUserId}`),
      bumpFeedVersion(),
    ]);

    // Fire-and-forget safely via after(): notify the product maker when someone upvotes their product
    if (hasUpvoted) {
      after(async () => {
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
      });
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
