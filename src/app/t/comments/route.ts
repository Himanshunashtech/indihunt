import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('product_id');
    const threadId = searchParams.get('threadId') || searchParams.get('thread_id');

    if (!productId && !threadId) {
      return apiFailure('productId or threadId is required', 400);
    }

    const cacheKey = productId ? `comments:product:${productId}` : `comments:thread:${threadId}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) {
      return apiSuccessSecure(cached);
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('comments').select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)');

    if (productId) {
      query = query.eq('product_id', productId);
    } else if (threadId) {
      query = query.eq('thread_id', threadId);
    }

    const { data: comments, error } = await query.order('created_at', { ascending: true });
    if (error) {
      return apiFailure(error.message, 500);
    }

    const list = comments || [];
    await setCachedData(cacheKey, list, 600);

    return apiSuccessSecure(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch comments', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, product_id, userId, user_id, body: commentBody, parentId, parent_id, threadId, thread_id } = body;

    const pId = productId || product_id;
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
      const { data: prod } = await supabase.from('products').select('comments_count').eq('id', pId).single();
      if (prod) {
        await supabase.from('products').update({ comments_count: (prod.comments_count || 0) + 1 }).eq('id', pId);
      }
      await invalidateCache(`comments:product:${pId}`);
    } else if (tId) {
      const { data: thr } = await supabase.from('threads').select('comments_count').eq('id', tId).single();
      if (thr) {
        await supabase.from('threads').update({ comments_count: (thr.comments_count || 0) + 1 }).eq('id', tId);
      }
      await invalidateCache(`comments:thread:${tId}`);
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

