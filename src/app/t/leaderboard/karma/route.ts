import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '200', 10);

    const cacheKey = `redis_leaderboard_karma_${limit}`;
    const cached = await getCachedData<any[]>(cacheKey);

    if (cached && Array.isArray(cached)) {
      return apiSuccessSecure(cached);
    }

    const supabase = await createServerSupabaseClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, headline, karma_points, followers_count, is_verified, is_maker')
      .order('karma_points', { ascending: false })
      .limit(limit);

    console.log(`[GET /t/leaderboard/karma] limit=${limit} cached=${!!cached} supabaseRows=${profiles?.length ?? 0} error=${error?.message || 'none'}`);

    if (error) {
      return apiFailure(error.message, 500);
    }

    const leaderboard = profiles || [];
    await setCachedData(cacheKey, leaderboard, 300);

    return apiSuccessSecure(leaderboard);
  } catch (error: any) {
    console.error('[GET /t/leaderboard/karma Error]:', error);
    return apiFailure(error?.message || 'Failed to fetch karma leaderboard', 500);
  }
}
