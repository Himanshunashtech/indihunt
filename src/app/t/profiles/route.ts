import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { MOCK_PROFILES } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
      if (cached) return apiSuccessSecure(cached);
    } else if (!fresh && !queryStr && username) {
      const cached = await getCachedData<any>(`profile:username:${username}`);
      if (cached) return apiSuccessSecure(cached);
    } else if (!fresh && !userId && !username && !queryStr) {
      const cachedAll = await getCachedData<any[]>('profiles:all');
      if (cachedAll) return apiSuccessSecure(cachedAll);
    }

    try {
      const supabase = await createServerSupabaseClient();

      if (userId) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile && !error) {
          await setCachedData(`profile:id:${profile.id}`, profile, 3600);
          return apiSuccessSecure(profile);
        }
      } else if (username) {
        const cleaned = username.replace(/^@/, '').toLowerCase().trim();
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', cleaned)
          .maybeSingle();

        if (profile && !error) {
          await setCachedData(`profile:username:${cleaned}`, profile, 3600);
          return apiSuccessSecure(profile);
        }
      } else if (queryStr) {
        const qClean = queryStr.replace(/^@/, '').toLowerCase().trim();
        const { data: searchProfiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, headline, bio, location, is_maker, karma_points, streak_count, followers_count, following_count, created_at')
          .or(`username.ilike.%${qClean}%,full_name.ilike.%${qClean}%,bio.ilike.%${qClean}%,headline.ilike.%${qClean}%`)
          .limit(50);

        if (!error && searchProfiles) {
          return apiSuccessSecure(searchProfiles);
        }
      } else {
        const { data: allProfiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, headline, bio, location, is_maker, karma_points, streak_count, followers_count, following_count, created_at')
          .limit(50);

        if (!error && allProfiles && allProfiles.length > 0) {
          await setCachedData('profiles:all', allProfiles, 300);
          return apiSuccessSecure(allProfiles);
        }
      }
    } catch (dbErr) {
      console.warn('[GET /t/profiles] DB query failed, falling back to mocks:', dbErr);
    }

    // Fallback logic for mock users or local dev
    if (userId) {
      const mock = MOCK_PROFILES[userId] || {
        id: userId,
        username: `maker_${userId.slice(0, 6)}`,
        full_name: 'Indie Maker',
        is_maker: true,
        karma_points: 10,
        streak_count: 1,
        created_at: new Date().toISOString()
      };
      return apiSuccessSecure(mock);
    }

    if (username) {
      const cleaned = username.replace(/^@/, '').toLowerCase().trim();
      const mock = Object.values(MOCK_PROFILES).find(
        (p: any) => p.username?.toLowerCase() === cleaned
      );
      if (mock) return apiSuccessSecure(mock);
      return apiFailure('Profile not found', 404);
    }

    return apiSuccessSecure(Object.values(MOCK_PROFILES));
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
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    invalidateCache(`profile:id:${userId}`);
    if (updatedProfile?.username) {
      invalidateCache(`profile:username:${updatedProfile.username}`);
    }
    invalidateCache('profiles:all');

    return apiSuccessSecure(updatedProfile);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update profile', 500);
  }
}
