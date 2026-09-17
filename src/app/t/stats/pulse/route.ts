import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const cacheKey = 'redis_stats_pulse';
    const cachedStats = await getCachedData<any>(cacheKey);

    if (cachedStats) {
      return apiSuccess(cachedStats);
    }

    const supabase = await createServerSupabaseClient();
    const [makersRes, upvotesRes, threadsRes, productsRes, locationsRes, spotlightRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('upvotes').select('id', { count: 'exact', head: true }),
      supabase.from('threads').select('category'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('location').not('location', 'is', null),
      supabase.from('profiles').select('*').eq('username', 'vikram_singh').maybeSingle(),
    ]);

    const uniqueCats = new Set((threadsRes.data || []).map((t: any) => (t.category || '').toLowerCase()));
    const uniqueCities = new Set(
      (locationsRes.data || [])
        .map((l: any) => (l.location || '').split(',')[0].trim().toLowerCase())
        .filter(Boolean)
    );

    let spotlightMaker = spotlightRes.data;
    if (!spotlightMaker) {
      const fallbackRes = await supabase.from('profiles').select('*').eq('is_maker', true).limit(1).maybeSingle();
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

    await setCachedData(cacheKey, resultStats, 300);

    return apiSuccess(resultStats);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch pulse stats', 500);
  }
}
