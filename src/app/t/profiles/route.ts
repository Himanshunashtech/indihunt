import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const fresh = searchParams.get('fresh') === 'true';

    // 1. Check Redis Cache
    if (!fresh && userId) {
      const cached = await getCachedData<any>(`profile:id:${userId}`);
      if (cached) return apiSuccess(cached);
    } else if (username) {
      const cached = await getCachedData<any>(`profile:username:${username}`);
      if (cached) return apiSuccess(cached);
    } else if (!userId && !username) {
      const cachedAll = await getCachedData<any[]>('profiles:all');
      if (cachedAll) return apiSuccess(cachedAll);
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('profiles').select('*');

    if (userId) {
      query = query.eq('id', userId);
    } else if (username) {
      const cleanUsername = username.replace(/^@/, '').trim();
      query = query.ilike('username', cleanUsername);
    } else {
      const { data: allProfiles, error } = await query.limit(50);
      if (error) return apiFailure(error.message, 500);
      if (allProfiles) await setCachedData('profiles:all', allProfiles, 300);
      return apiSuccess(allProfiles || [], 200, { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' });
    }

    const { data: profile, error } = await query.maybeSingle();
    if (error) {
      return apiFailure(error.message, 500);
    }

    if (!profile) {
      return apiFailure('Profile not found', 404);
    }

    await setCachedData(`profile:id:${profile.id}`, profile, 3600);
    if (profile.username) {
      await setCachedData(`profile:username:${profile.username}`, profile, 3600);
    }

    const cacheHeader = !fresh ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } : undefined;
    return apiSuccess(profile, 200, cacheHeader);
  } catch (error: any) {
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

    return apiSuccess(updatedProfile);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update profile', 500);
  }
}
