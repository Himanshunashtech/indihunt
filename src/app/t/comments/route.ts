import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure, PUBLIC_CACHE_HEADERS } from '@/lib/api/response';
import { checkContentViolation, getProductSlug } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

async function resolveCommentProductId(key: string, supabase: any): Promise<string | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  if (isUUID) return key;

  const decoded = decodeURIComponent(key).toLowerCase().trim();
  let slugMap = await getCachedData<Record<string, string>>('product_slug_map');
  if (slugMap && slugMap[decoded]) return slugMap[decoded];

  try {
    const { data } = await supabase.from('products').select('id, name').limit(3000);
    const newMap: Record<string, string> = {};
    (data || []).forEach((p: any) => {
      if (p.name) {
        newMap[getProductSlug(p.name).toLowerCase()] = p.id;
        newMap[p.name.toLowerCase().trim()] = p.id;
        newMap[p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')] = p.id;
        newMap[p.name.toLowerCase().replace(/[^a-z0-9]+/g, '')] = p.id;
      }
      if (p.id) {
        newMap[p.id.toLowerCase()] = p.id;
      }
    });
    await setCachedData('product_slug_map', newMap, 3600);
    return newMap[decoded] || null;
  } catch {
    return null;
  }
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
      return apiSuccessSecure(cached, 200, PUBLIC_CACHE_HEADERS);
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
    await setCachedData(cacheKey, list, 600);
    if (productId && productId !== targetProductId) {
      await setCachedData(`comments:product:${productId}`, list, 600);
    }

    return apiSuccessSecure(list, 200, PUBLIC_CACHE_HEADERS);
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

    if (pId) {
      pId = await resolveCommentProductId(pId, supabase) || pId;
    }

    const { data: newComment, error } = await supabase
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
      if (prod) {
        await supabase.from('products').update({ comments_count: (prod.comments_count || 0) + 1 }).eq('id', pId);
        const slug = getProductSlug(prod.name);
        await Promise.allSettled([
          invalidateCache(`comments:product:${pId}`),
          slug ? invalidateCache(`comments:product:${slug}`) : Promise.resolve(),
        ]);
        try { if (slug) (revalidateTag as any)(`comments-${slug}`, 'max'); } catch {}
        try { (revalidateTag as any)(`comments-${pId}`, 'max'); } catch {}
      } else {
        await invalidateCache(`comments:product:${pId}`);
        try { (revalidateTag as any)(`comments-${pId}`, 'max'); } catch {}
      }
    } else if (tId) {
      const { data: thr } = await supabase.from('threads').select('comments_count').eq('id', tId).maybeSingle();
      if (thr) {
        await supabase.from('threads').update({ comments_count: (thr.comments_count || 0) + 1 }).eq('id', tId);
      }
      await invalidateCache(`comments:thread:${tId}`);
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

