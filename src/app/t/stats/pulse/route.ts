import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const cacheKey = 'redis_stats_pulse';
    const cachedStats = await getCachedData<any>(cacheKey);

    if (cachedStats) {
      return apiSuccessSecure(cachedStats);
    }

    const supabase = await createServerSupabaseClient();
    const SPOTLIGHT_COLUMNS = 'id, username, full_name, avatar_url, headline, bio, location, karma_points, streak_count, is_maker';
    const [makersRes, upvotesRes, threadsRes, productsRes, locationsRes, spotlightRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('upvotes').select('id', { count: 'exact', head: true }),
      supabase.from('threads').select('category').limit(100),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('location').not('location', 'is', null).limit(100),
      supabase.from('profiles').select(SPOTLIGHT_COLUMNS).eq('username', 'vikram_singh').maybeSingle(),
    ]);

    const uniqueCats = new Set((threadsRes.data || []).map((t: any) => (t.category || '').toLowerCase()));
    const uniqueCities = new Set(
      (locationsRes.data || [])
        .map((l: any) => (l.location || '').split(',')[0].trim().toLowerCase())
        .filter(Boolean)
    );

    let spotlightMaker = spotlightRes.data;
    if (!spotlightMaker) {
      const fallbackRes = await supabase.from('profiles').select(SPOTLIGHT_COLUMNS).eq('is_maker', true).limit(1).maybeSingle();
      spotlightMaker = fallbackRes.data || null;
    }

    const pCount = productsRes.count || 0;
    const mCount = makersRes.count || 0;
    const uCount = upvotesRes.count || 0;
    const cCount = uniqueCities.size || 0;
    const computedVisitors = Math.max(500000, pCount * 150 + uCount * 45 + mCount * 120);

    const resultStats = {
      activeMakers: mCount,
      upvotesCount: uCount,
      categoriesCount: Math.max(uniqueCats.size, 14),
      productsCount: pCount,
      citiesCount: Math.max(cCount, 12),
      monthlyVisitors: computedVisitors,
      spotlightMaker,
    };

    await setCachedData(cacheKey, resultStats, 600);

    return apiSuccessSecure(resultStats);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch pulse stats', 500);
  }
}
