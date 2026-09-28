import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const cacheKey = `stories_${category || 'all'}_${limit}`;

    if (!search) {
      const cached = await getCachedData<any[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return apiSuccessSecure(cached);
      }
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('stories')
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: stories, error } = await query;
    if (error) {
      return apiFailure(error.message, 500);
    }

    const list = stories || [];
    if (!search && list.length > 0) {
      await setCachedData(cacheKey, list, 300);
    }

    return apiSuccessSecure(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch stories', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, image_url, user_id, userId, excerpt } = body;
    const authorId = user_id || userId;

    if (!title || !content || !authorId) {
      return apiFailure('title, content, and userId are required', 400);
    }

    const titleViolation = checkContentViolation(title);
    if (titleViolation.hasViolation) {
      return apiFailure(titleViolation.message || 'Content violation detected in title', 400);
    }

    const contentViolation = checkContentViolation(content);
    if (contentViolation.hasViolation) {
      return apiFailure(contentViolation.message || 'Content violation detected in content', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        title,
        content,
        category: category || 'General',
        image_url: image_url || null,
        user_id: authorId,
        excerpt: excerpt || content.slice(0, 150),
        published_at: new Date().toISOString(),
      })
      .select('*, user:profiles(*)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    await invalidateCache('stories_all_50');
    if (category) await invalidateCache(`stories_${category}_50`);

    return apiSuccessSecure(story, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create story', 500);
  }
}

