import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure } from '@/lib/api/response';
import { getCachedData, setCachedData } from '@/lib/redis';
import { MOCK_PROFILES } from '@/lib/supabase';
import { Hunter } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const timeRange = searchParams.get('timeRange') || 'all';

    const cacheKey = `redis_leaderboard_hunters_${timeRange}_${limit}`;
    const cached = await getCachedData<Hunter[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return apiSuccessSecure(cached);
    }

    const now = Date.now();
    let timeLimitMs = 0;
    if (timeRange === 'week' || timeRange === 'weekly' || timeRange === 'last_week') {
      timeLimitMs = 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === 'month' || timeRange === 'monthly' || timeRange === 'last_month') {
      timeLimitMs = 30 * 24 * 60 * 60 * 1000;
    } else if (timeRange === 'year' || timeRange === 'yearly' || timeRange === 'last_year') {
      timeLimitMs = 365 * 24 * 60 * 60 * 1000;
    }

    const hunterMap = new Map<string, Hunter>();

    try {
      const supabase = await createServerSupabaseClient();

      // 1. Fetch top active products with index-backed filter and ordering
      let prodQuery = supabase
        .from('products')
        .select('id, name, maker_id, upvotes_count, comments_count, featured, quality_score, created_at, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, karma_points, is_verified)')
        .eq('is_deleted', false)
        .order('upvotes_count', { ascending: false })
        .limit(200);

      if (timeLimitMs > 0) {
        prodQuery = prodQuery.gte('created_at', new Date(now - timeLimitMs).toISOString());
      }

      const { data: dbProducts, error: prodErr } = await prodQuery;

      if (!prodErr && dbProducts && dbProducts.length > 0) {
        dbProducts.forEach((p: any) => {
          if (timeLimitMs > 0 && p.created_at) {
            const productAge = now - new Date(p.created_at).getTime();
            if (productAge > timeLimitMs) return;
          }

          const maker = p.maker || (p.maker_id ? { id: p.maker_id } : null);
          if (maker) {
            const key = (maker.username || maker.id || p.maker_id || '').toLowerCase();
            if (key && key !== 'user-1' && key !== 'user-2' && key !== 'john_doe' && key !== 'jane_smith') {
              const existing = hunterMap.get(key) || {
                id: maker.id || p.maker_id || key,
                name: maker.full_name || maker.username || 'Indie Maker',
                username: maker.username || key,
                avatar_url: maker.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                bio: maker.bio || maker.headline || 'IndiHunt Hunter & Builder',
                hunts_count: 0,
                upvotes_count: 0,
                comments_count: 0,
                first_places_count: 0,
                avg_upvotes: 0,
                avg_comments: 0,
                is_verified: !!maker.is_verified,
                created_at: p.created_at || maker.created_at
              };
              existing.hunts_count += 1;
              existing.upvotes_count += (p.upvotes_count || 0);
              existing.comments_count += (p.comments_count || 0);
              if (p.featured || (p.quality_score && p.quality_score >= 75)) {
                existing.first_places_count += 1;
              }
              hunterMap.set(key, existing);
            }
          }
        });
      }

      // 2. Fetch top profiles from profiles table to include makers or active members
      const { data: dbProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('karma_points', { ascending: false })
        .limit(200);

      if (!profErr && dbProfiles && dbProfiles.length > 0) {
        dbProfiles.forEach((p: any) => {
          if (!p.username || p.username === 'anon' || p.full_name === 'Anonymous Hunter') return;
          if (p.id === 'user-1' || p.id === 'user-2' || p.username === 'john_doe' || p.username === 'jane_smith') return;
          const key = (p.username || p.id || '').toLowerCase();
          if (!key || key === 'user-1' || key === 'user-2' || key === 'john_doe' || key === 'jane_smith') return;

          const existing = hunterMap.get(key);
          if (existing) {
            if (p.full_name && existing.name === 'Indie Maker') existing.name = p.full_name;
            if (p.avatar_url) existing.avatar_url = p.avatar_url;
            if (p.bio || p.headline) existing.bio = p.bio || p.headline;
            if (p.is_verified) existing.is_verified = true;
          } else if (timeLimitMs === 0 || !p.created_at || (now - new Date(p.created_at).getTime() <= timeLimitMs)) {
            const karma = p.karma_points || 0;
            const hunts = p.hunts_count || (karma > 50 ? Math.min(10, Math.floor(karma / 20)) : 1);
            const upvotes = p.upvotes_count || (karma > 0 ? karma * 10 : 15);
            const comments = p.comments_count || Math.max(1, Math.floor(upvotes / 10));
            hunterMap.set(key, {
              id: p.id,
              name: p.full_name || p.username || 'Indie Maker',
              username: p.username || 'maker',
              avatar_url: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              bio: p.bio || p.headline || 'IndiHunt Hunter & Builder',
              hunts_count: hunts,
              upvotes_count: upvotes,
              comments_count: comments,
              first_places_count: p.first_places_count || (hunts > 2 ? 1 : 0),
              avg_upvotes: Math.round(upvotes / Math.max(1, hunts)),
              avg_comments: Math.round(comments / Math.max(1, hunts)),
              is_verified: !!p.is_verified,
              created_at: p.created_at
            });
          }
        });
      }
    } catch (dbErr: any) {
      console.warn('[GET /t/leaderboard/top-hunters] Supabase query error:', dbErr?.message);
    }

    const huntersList = Array.from(hunterMap.values());
    huntersList.forEach(h => {
      h.avg_upvotes = h.hunts_count > 0 ? Math.round(h.upvotes_count / h.hunts_count) : h.upvotes_count;
      h.avg_comments = h.hunts_count > 0 ? Math.round(h.comments_count / h.hunts_count) : h.comments_count;
    });

    huntersList.sort((a, b) => b.hunts_count - a.hunts_count || b.upvotes_count - a.upvotes_count || b.comments_count - a.comments_count);

    const result = huntersList.slice(0, limit);
    if (result.length > 0) {
      await setCachedData(cacheKey, result, 300);
    }

    return apiSuccessSecure(result);
  } catch (error: any) {
    console.error('[GET /t/leaderboard/top-hunters] Fatal error:', error);
    return apiSuccessSecure([]);
  }
}
