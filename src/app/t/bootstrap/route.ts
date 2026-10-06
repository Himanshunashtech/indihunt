import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/bootstrap?userId=xxx
// Returns: { profile, upvoteIds, notifCount }
// Replaces 3 separate API calls on every page load with a single parallel DB fetch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    if (!userId) return apiFailure('userId required', 400);

    const cacheKey = `bootstrap:${userId}`;
    const cached = await getCachedData<{ profile: any; upvoteIds: string[]; notifCount: number }>(cacheKey);
    if (cached) return apiSuccessSecure(cached);

    const supabase = await createServerSupabaseClient();

    // Run all 3 queries in parallel — 1 connection burst instead of 3 sequential roundtrips
    const [profileRes, upvotesRes, notifRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('upvotes').select('product_id').eq('user_id', userId).limit(2000),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false),
    ]);

    const result = {
      profile: profileRes.data || null,
      upvoteIds: (upvotesRes.data || []).map((u: any) => u.product_id),
      notifCount: notifRes.count || 0,
    };

    // Cache user's bootstrap state for 30 seconds
    await setCachedData(cacheKey, result, 30);
    return apiSuccessSecure(result);
  } catch (err: any) {
    return apiFailure(err?.message || 'Bootstrap failed', 500);
  }
}
