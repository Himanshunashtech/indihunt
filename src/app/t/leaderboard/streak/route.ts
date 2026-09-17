import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const cacheKey = `redis_leaderboard_streak_${limit}`;
    const cached = await getCachedData<any[]>(cacheKey);

    if (cached && Array.isArray(cached)) {
      return apiSuccess(cached);
    }

    const supabase = await createServerSupabaseClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('streak_count', { ascending: false })
      .limit(limit);

    if (error) {
      return apiFailure(error.message, 500);
    }

    const leaderboard = profiles || [];
    setCachedData(cacheKey, leaderboard, 300);

    return apiSuccess(leaderboard);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch leaderboard streaks', 500);
  }
}
