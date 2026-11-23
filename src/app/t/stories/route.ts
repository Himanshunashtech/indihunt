import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCachedData, setCachedData, invalidateCache, invalidateCachePattern } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation, DEFAULT_STORIES } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getSupabaseClient() {
  try {
    return createAdminSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

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

    const supabase = await getSupabaseClient();

    let stories: any[] = [];
    let dbErr: any = null;

    // 1. Try relational joined query
    try {
      let query = supabase
        .from('stories')
        .select('*, user:profiles!user_id(id, username, full_name, avatar_url, headline, karma_points)')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const res = await query;
      if (res.data && res.data.length > 0) {
        stories = res.data;
      } else if (res.error) {
        dbErr = res.error;
      }
    } catch (e: any) {
      dbErr = e;
    }

    // 2. If join failed or returned empty due to foreign key syntax mismatch, execute simple select + batch profiles lookup
    if (stories.length === 0) {
      try {
        let fallbackQuery = supabase
          .from('stories')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(limit);

        if (category && category !== 'All') {
          fallbackQuery = fallbackQuery.eq('category', category);
        }
        if (search) {
          fallbackQuery = fallbackQuery.ilike('title', `%${search}%`);
        }

        const fallbackRes = await fallbackQuery;
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          stories = fallbackRes.data;

          // Fetch author profiles in batch
          const userIds = Array.from(new Set(stories.map((s: any) => s.user_id).filter(Boolean)));
          if (userIds.length > 0) {
            try {
              const { data: profs } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, headline, karma_points')
                .in('id', userIds);

              if (profs && profs.length > 0) {
                const profMap = new Map(profs.map((p: any) => [p.id, p]));
                stories = stories.map((s: any) => ({
                  ...s,
                  user: profMap.get(s.user_id) || null
                }));
              }
            } catch (profErr) {
              console.warn('[GET /t/stories] Error fetching author profiles:', profErr);
            }
          }
        }
      } catch (fallbackErr) {
        console.warn('[GET /t/stories] Simple fallback query error:', fallbackErr);
      }
    }

    console.log(`[GET /t/stories] limit=${limit} cached=${false} dbStories=${stories?.length ?? 0}`);
    const dbStories = (stories && stories.length > 0) ? stories : [];

    // Merge: Real DB user stories first + Mock DEFAULT_STORIES
    const mergedMap = new Map<string, any>();
    dbStories.forEach(s => {
      if (s?.id) {
        const userObj = s.user || {
          id: s.user_id,
          username: 'maker',
          full_name: 'Maker',
          avatar_url: `https://avatar.vercel.sh/${s.user_id || 'maker'}`
        };
        mergedMap.set(s.id, { ...s, user: userObj });
      }
    });

    DEFAULT_STORIES.forEach(s => {
      if (s?.id && !mergedMap.has(s.id)) {
        mergedMap.set(s.id, s);
      }
    });

    let list = Array.from(mergedMap.values());

    if (category && category !== 'All') {
      list = list.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.title?.toLowerCase().includes(q) || (s.excerpt ? s.excerpt.toLowerCase().includes(q) : false));
    }

    // Sort by publication date descending (newest user stories first)
    list.sort((a, b) => new Date(b.published_at || b.created_at || 0).getTime() - new Date(a.published_at || a.created_at || 0).getTime());

    if (!search && list.length > 0) {
      await setCachedData(cacheKey, list, 120);
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

    const supabase = await getSupabaseClient();
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
      .select('*')
      .single();

    if (error) {
      console.error('[POST /t/stories] DB insert error:', error);
      return apiFailure(error.message, 500);
    }

    // Attach author profile
    let authorProfile = null;
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, headline, karma_points')
        .eq('id', authorId)
        .maybeSingle();
      authorProfile = prof;
    } catch {}

    const result = {
      ...story,
      user: authorProfile || {
        id: authorId,
        username: 'maker',
        full_name: 'Maker',
        avatar_url: `https://avatar.vercel.sh/${authorId}`
      }
    };

    await invalidateCachePattern('stories_');
    await invalidateCache('stories_all_50');

    return apiSuccessSecure(result, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create story', 500);
  }
}

