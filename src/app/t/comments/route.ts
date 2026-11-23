import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache, invalidateCachePattern } from '@/lib/redis';
import { bumpFeedVersion } from '@/lib/cache';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation, getProductSlug } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

async function resolveCommentProductId(key: string, supabase: any): Promise<string | null> {
  if (!key) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  if (isUUID) return key;

  const decoded = decodeURIComponent(key).trim();
  const cacheKey = `product_slug_id:${decoded.toLowerCase()}`;
  const cachedId = await getCachedData<string>(cacheKey);
  if (cachedId) return cachedId;

  try {
    const cleanSearch = decoded.replace(/[-_]+/g, ' ').trim();
    const { data: matched } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_deleted', false)
      .ilike('name', `%${cleanSearch}%`)
      .limit(10);

    if (matched && matched.length > 0) {
      const exact = matched.find((p: any) => getProductSlug(p.name).toLowerCase() === decoded.toLowerCase());
      const selected = exact || (matched.length === 1 ? matched[0] : null);
      if (selected) {
        await setCachedData(cacheKey, selected.id, 3600);
        return selected.id;
      }
    }
  } catch (err) {
    console.error('[resolveCommentProductId Error]', err);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('product_id');
    const threadId = searchParams.get('threadId') || searchParams.get('thread_id');

    if (!productId && !threadId) {
      return apiFailure('productId or threadId is required', 400);
    }

    let targetProductId = productId;
    const supabase = await createServerSupabaseClient();

    if (productId) {
      targetProductId = await resolveCommentProductId(productId, supabase) || productId;
    }

    const cacheKey = targetProductId ? `comments:product:${targetProductId}` : `comments:thread:${threadId}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) {
      return apiSuccessSecure(cached, 200, NO_CACHE_HEADERS);
    }

    let query = supabase.from('comments').select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)');

    if (targetProductId) {
      query = query.eq('product_id', targetProductId);
    } else if (threadId) {
      query = query.eq('thread_id', threadId);
    }

    const { data: comments, error } = await query.order('created_at', { ascending: true });
    if (error) {
      return apiFailure(error.message, 500);
    }

    const list = comments || [];
    await setCachedData(cacheKey, list, 120);
    if (productId && productId !== targetProductId) {
      await setCachedData(`comments:product:${productId}`, list, 120);
    }

    return apiSuccessSecure(list, 200, NO_CACHE_HEADERS);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch comments', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, product_id, userId, user_id, body: commentBody, parentId, parent_id, threadId, thread_id } = body;

    let pId = productId || product_id;
    const tId = threadId || thread_id;
    const uId = userId || user_id;
    const parId = parentId || parent_id;

    if (!uId || !commentBody) {
      return apiFailure('userId and body are required', 400);
    }

    // Content Moderation check
    const violation = checkContentViolation(commentBody);
    if (violation.hasViolation) {
      return apiFailure(violation.message || 'Content violation detected', 400);
    }

    const supabase = await createServerSupabaseClient();

    // Use admin client if configured to avoid RLS blockages on server mutations
    let dbClient: any = supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');
        dbClient = createAdminSupabaseClient();
      } catch {
        dbClient = supabase;
      }
    }

    if (pId) {
      pId = await resolveCommentProductId(pId, dbClient) || pId;
    }

    const { data: newComment, error } = await dbClient
      .from('comments')
      .insert({
        product_id: pId || null,
        thread_id: tId || null,
        user_id: uId,
        body: commentBody,
        parent_id: parId || null,
      })
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    if (pId) {
      const { data: prod } = await supabase.from('products').select('id, name, comments_count').eq('id', pId).maybeSingle();
      const slug = prod?.name ? getProductSlug(prod.name) : null;
      await Promise.allSettled([
        invalidateCache(`comments:product:${pId}`),
        slug ? invalidateCache(`comments:product:${slug}`) : Promise.resolve(),
        invalidateCachePattern('redis_products_'),
        invalidateCache('public_products'),
        invalidateCache(`product_detail_${pId.toLowerCase()}`),
        slug ? invalidateCache(`product_detail_${slug.toLowerCase()}`) : Promise.resolve(),
        bumpFeedVersion(),
      ]);
      try { if (slug) (revalidateTag as any)(`comments-${slug}`, 'max'); } catch {}
      try { (revalidateTag as any)(`comments-${pId}`, 'max'); } catch {}
    } else if (tId) {
      await Promise.allSettled([
        invalidateCache(`comments:thread:${tId}`),
        invalidateCache(`thread_detail_${tId}`),
        invalidateCache('threads_all_50'),
      ]);
      try { (revalidateTag as any)(`comments-${tId}`, 'max'); } catch {}
    }

    // Fire-and-forget: notify the maker/thread author about the new comment
    (async () => {
      try {
        const { data: commenter } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', uId)
          .single();

        let notifyUserId: string | null = null;
        let entityType = 'product';
        let entityId = pId || tId || '';
        let productName = '';
        let actionUrl = '';

        if (pId) {
          const { data: prod } = await supabase
            .from('products')
            .select('name, maker_id, logo_url')
            .eq('id', pId)
            .single();
          if (prod?.maker_id && prod.maker_id !== uId) {
            notifyUserId = prod.maker_id;
            productName = prod.name;
            actionUrl = `/products/${pId}`;
          }
        } else if (tId) {
          const { data: thread } = await supabase
            .from('threads')
            .select('title, user_id')
            .eq('id', tId)
            .single();
          if (thread?.user_id && thread.user_id !== uId) {
            notifyUserId = thread.user_id;
            entityType = 'thread';
            productName = thread.title;
            actionUrl = `/threads/${tId}`;
          }
        }

        if (notifyUserId) {
          await supabase.from('notifications').insert({
            user_id: notifyUserId,
            actor_id: uId,
            type: 'comment',
            entity_type: entityType,
            entity_id: entityId,
            data: {
              product_name: productName,
              actor_name: commenter?.full_name || commenter?.username || 'Someone',
              actor_avatar: commenter?.avatar_url || '',
              body_text: commentBody?.slice(0, 120),
              action_url: actionUrl,
              action_label: 'View comment',
            },
            read: false,
          });
        }
      } catch {
        // Non-blocking — ignore notification errors
      }
    })();

    return apiSuccessSecure(newComment, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to post comment', 500);
  }
}

