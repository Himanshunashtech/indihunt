import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const authorId = searchParams.get('authorId') || searchParams.get('author_id');
    const category = searchParams.get('category');
    const productId = searchParams.get('productId') || searchParams.get('product_id');
    const queryStr = searchParams.get('q') || searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || (queryStr ? '100' : '50'), 10);

    const cacheKey = productId
      ? `threads_product_${productId}_${limit}`
      : `threads_${category || 'all'}_${limit}`;

    if (!userId && !authorId && !queryStr) {
      const cached = await getCachedData<any[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return apiSuccessSecure(cached);
      }
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('threads')
      .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (authorId) {
      query = query.eq('user_id', authorId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (queryStr) {
      query = query.or(`title.ilike.%${queryStr}%,body.ilike.%${queryStr}%`);
    }

    const { data: threadsData, error } = await query;
    if (error) {
      return apiFailure(error.message, 500);
    }

    let threads = threadsData || [];

    if (!userId && !authorId && !queryStr && threads.length > 0) {
      await setCachedData(cacheKey, threads, 300);
    }

    if (userId && threads.length > 0) {
      const threadIds = threads.map((t: any) => t.id);
      const { data: upvotes } = await supabase
        .from('thread_upvotes')
        .select('thread_id')
        .eq('user_id', userId)
        .in('thread_id', threadIds);

      const upvotedSet = new Set((upvotes || []).map((u: any) => u.thread_id));
      threads = threads.map((t: any) => ({
        ...t,
        has_upvoted: upvotedSet.has(t.id),
      }));
    }

    return apiSuccessSecure(threads);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch threads', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: threadBody, category, user_id, userId, product_id, productId } = body;
    const authorId = user_id || userId;
    const linkedProductId = product_id || productId;

    if (!title || !threadBody || !authorId) {
      return apiFailure('Missing required fields (title, body, userId)', 400);
    }

    const titleViolation = checkContentViolation(title);
    if (titleViolation.hasViolation) {
      return apiFailure(titleViolation.message || 'Content violation in thread title', 400);
    }

    const bodyViolation = checkContentViolation(threadBody);
    if (bodyViolation.hasViolation) {
      return apiFailure(bodyViolation.message || 'Content violation in thread body', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: newThread, error } = await supabase
      .from('threads')
      .insert({
        title,
        body: threadBody,
        category: category || 'General',
        user_id: authorId,
        product_id: linkedProductId || null,
        upvotes_count: 1,
        comments_count: 0,
      })
      .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    await supabase.from('thread_upvotes').insert({
      thread_id: newThread.id,
      user_id: authorId,
    });

    await invalidateCache('threads_all_50');
    if (category) await invalidateCache(`threads_${category}_50`);
    if (linkedProductId) {
      await invalidateCache(`threads_product_${linkedProductId}_50`);
      await invalidateCache(`threads_product_${linkedProductId}_100`);
    }

    return apiSuccessSecure({ ...newThread, has_upvoted: true }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create thread', 500);
  }
}
