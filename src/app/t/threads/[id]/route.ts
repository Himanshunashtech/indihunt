import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure, PUBLIC_CACHE_HEADERS, isValidUUID } from '@/lib/api/response';
import { checkContentViolation, getProductSlug } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function findThreadBySlugOrId(id: string, supabase: any) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    const { data } = await supabase
      .from('threads')
      .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  const decoded = decodeURIComponent(id).toLowerCase().trim();

  // 1. Try targeted search using title keywords
  const words = decoded.split(/[-_]+/).filter((w) => w.length > 2);
  let candidates: any[] = [];

  if (words.length > 0) {
    const keywordPattern = `%${words.slice(0, 3).join('%')}%`;
    const { data } = await supabase
      .from('threads')
      .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .ilike('title', keywordPattern)
      .limit(15);
    candidates = data || [];
  }

  // 2. If not matched, query recent 50 threads
  if (!candidates.length) {
    const { data } = await supabase
      .from('threads')
      .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .order('created_at', { ascending: false })
      .limit(50);
    candidates = data || [];
  }

  const matched = candidates.find(
    (t: any) =>
      getProductSlug(t.title).toLowerCase() === decoded ||
      t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decoded ||
      t.title.toLowerCase().trim() === decoded.replace(/-/g, ' ') ||
      t.id === id
  );

  return matched || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    const cleanId = id.toLowerCase().trim();
    const cacheKey = `thread_detail_${cleanId}`;
    let thread = await getCachedData<any>(cacheKey);

    const supabase = await createServerSupabaseClient();

    if (!thread) {
      thread = await findThreadBySlugOrId(id, supabase);

      if (thread) {
        const slug = getProductSlug(thread.title);
        await Promise.allSettled([
          setCachedData(`thread_detail_${thread.id}`, thread, 300),
          slug ? setCachedData(`thread_detail_${slug.toLowerCase()}`, thread, 300) : Promise.resolve(),
        ]);
      }
    }

    if (!thread) {
      return apiFailure('Thread not found', 404);
    }

    let hasUpvoted = false;
    if (userId && isValidUUID(userId)) {
      const { data: upvote } = await supabase
        .from('thread_upvotes')
        .select('id')
        .eq('thread_id', thread.id)
        .eq('user_id', userId)
        .maybeSingle();
      hasUpvoted = !!upvote;
    }

    return apiSuccessSecure(
      { ...thread, has_upvoted: hasUpvoted },
      200,
      userId ? undefined : PUBLIC_CACHE_HEADERS
    );
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch thread', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, title, body: threadBody, category } = body;

    if (!userId) {
      return apiFailure('Missing userId', 400);
    }

    const updates: Record<string, any> = {};

    if (title) {
      const titleViolation = checkContentViolation(title);
      if (titleViolation.hasViolation) {
        return apiFailure(titleViolation.message || 'Content violation in title', 400);
      }
      updates.title = title;
    }

    if (threadBody) {
      const bodyViolation = checkContentViolation(threadBody);
      if (bodyViolation.hasViolation) {
        return apiFailure(bodyViolation.message || 'Content violation in body', 400);
      }
      updates.body = threadBody;
    }

    if (category) {
      updates.category = category;
    }

    const supabase = await createServerSupabaseClient();
    const { data: updatedThread, error } = await supabase
      .from('threads')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    const slug = getProductSlug(updatedThread.title);
    await Promise.allSettled([
      invalidateCache(`thread_detail_${id}`),
      slug ? invalidateCache(`thread_detail_${slug.toLowerCase()}`) : Promise.resolve(),
      invalidateCache('threads_all_50'),
    ]);

    return apiSuccessSecure(updatedThread);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update thread', 500);
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

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('threads').delete().eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;
    if (error) {
      return apiFailure(error.message, 500);
    }

    await Promise.allSettled([
      invalidateCache(`thread_detail_${id}`),
      invalidateCache('threads_all_50'),
    ]);

    return apiSuccessSecure({ deleted: true }, 200);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete thread', 500);
  }
}

