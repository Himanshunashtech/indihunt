import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('stories')
      .select('id, title, content, excerpt, image_url, category, user_id, published_at, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
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
      // Fallback query if profiles relation mapping is missing
      let fallback = supabase
        .from('stories')
        .select('id, title, content, excerpt, image_url, category, user_id, published_at, created_at')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (category && category !== 'All') {
        fallback = fallback.eq('category', category);
      }
      if (search) {
        fallback = fallback.ilike('title', `%${search}%`);
      }

      const { data: fallbackStories, error: fallbackError } = await fallback;
      if (fallbackError) {
        return apiFailure(fallbackError.message, 500);
      }
      return apiSuccess(fallbackStories || []);
    }

    return apiSuccess(stories || []);
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
      .select('id, title')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccess({ success: true, id: story.id, title: story.title }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create story', 500);
  }
}
