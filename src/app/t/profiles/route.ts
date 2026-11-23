import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure, PUBLIC_CACHE_HEADERS, isValidUUID } from '@/lib/api/response';
import { MOCK_PROFILES } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const PROFILE_COLS = 'id, username, full_name, avatar_url, headline, bio, location, website, github_url, twitter_url, linkedin_url, is_maker, karma_points, streak_count, followers_count, following_count, created_at, indie_page_enabled, indie_page_theme, onboarding_completed, role';

function formatProfile(p: any) {
  if (!p) return p;
  const web = p.website || p.website_url || null;
  return {
    ...p,
    website: web,
    website_url: web,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const username = searchParams.get('username');
    const queryStr = searchParams.get('q') || searchParams.get('search');
    const fresh = searchParams.get('fresh') === 'true';

    // 1. Check Redis Cache
    if (!fresh && !queryStr && userId) {
      const cached = await getCachedData<any>(`profile:id:${userId}`);
      if (cached) return apiSuccessSecure(formatProfile(cached));
    } else if (!fresh && !queryStr && username) {
      const cached = await getCachedData<any>(`profile:username:${username}`);
      if (cached) return apiSuccessSecure(formatProfile(cached), 200, PUBLIC_CACHE_HEADERS);
    } else if (!fresh && !userId && !username && !queryStr) {
      const cachedAll = await getCachedData<any[]>('profiles:all');
      if (cachedAll) return apiSuccessSecure(cachedAll.map(formatProfile), 200, PUBLIC_CACHE_HEADERS);
    }

    try {
      const supabase = await createServerSupabaseClient();

      if (userId) {
        if (isValidUUID(userId)) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select(PROFILE_COLS)
            .eq('id', userId)
            .maybeSingle();

          if (profile && !error) {
            const formatted = formatProfile(profile);
            await setCachedData(`profile:id:${profile.id}`, formatted, 3600);
            return apiSuccessSecure(formatted);
          }
        }
      } else if (username) {
        const cleaned = username.replace(/^@/, '').toLowerCase().trim();
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(PROFILE_COLS)
          .ilike('username', cleaned)
          .maybeSingle();

        if (profile && !error) {
          const formatted = formatProfile(profile);
          await setCachedData(`profile:username:${cleaned}`, formatted, 3600);
          return apiSuccessSecure(formatted, 200, PUBLIC_CACHE_HEADERS);
        }
      } else if (queryStr) {
        const qClean = queryStr.replace(/^@/, '').toLowerCase().trim();
        const { data: searchProfiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, headline, bio, location, website, github_url, twitter_url, linkedin_url, is_maker, karma_points, streak_count, followers_count, following_count, created_at')
          .or(`username.ilike.%${qClean}%,full_name.ilike.%${qClean}%,bio.ilike.%${qClean}%,headline.ilike.%${qClean}%`)
          .limit(50);

        if (!error && searchProfiles) {
          return apiSuccessSecure(searchProfiles.map(formatProfile));
        }
      } else {
        const { data: allProfiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, headline, bio, location, website, github_url, twitter_url, linkedin_url, is_maker, karma_points, streak_count, followers_count, following_count, created_at')
          .limit(50);

        if (!error && allProfiles && allProfiles.length > 0) {
          const formattedList = allProfiles.map(formatProfile);
          await setCachedData('profiles:all', formattedList, 300);
          return apiSuccessSecure(formattedList);
        }
      }
    } catch (dbErr) {
      console.warn('[GET /t/profiles] DB query failed, falling back to mocks:', dbErr);
    }

    // Fallback logic for mock users or local dev
    if (userId) {
      if (MOCK_PROFILES[userId]) {
        return apiSuccessSecure(formatProfile(MOCK_PROFILES[userId]));
      }
      return apiFailure('Profile not found', 404);
    }

    if (username) {
      const cleaned = username.replace(/^@/, '').toLowerCase().trim();
      const mock = Object.values(MOCK_PROFILES).find(
        (p: any) => p.username?.toLowerCase() === cleaned
      );
      if (mock) return apiSuccessSecure(formatProfile(mock));
      return apiFailure('Profile not found', 404);
    }

    return apiSuccessSecure(Object.values(MOCK_PROFILES).map(formatProfile));
  } catch (error: any) {
    console.error('[GET /t/profiles] Fatal error:', error);
    return apiFailure(error?.message || 'Failed to fetch profile', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return apiFailure('userId and updates are required', 400);
    }

    const supabase = await createServerSupabaseClient();
    
    // Normalize updates for DB columns (handle website_url -> website)
    const cleanUpdates = { ...updates };
    if ('website_url' in cleanUpdates) {
      if (!cleanUpdates.website) {
        cleanUpdates.website = cleanUpdates.website_url;
      }
      delete cleanUpdates.website_url;
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...cleanUpdates }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('[PUT /t/profiles] Upsert error:', error);
      return apiFailure(error.message, 500);
    }

    const formatted = formatProfile(updatedProfile);
    invalidateCache(`profile:id:${userId}`);
    if (formatted?.username) {
      invalidateCache(`profile:username:${formatted.username}`);
    }
    invalidateCache('profiles:all');

    return apiSuccessSecure(formatted);
  } catch (error: any) {
    console.error('[PUT /t/profiles] Fatal error:', error);
    return apiFailure(error?.message || 'Failed to update profile', 500);
  }
}
