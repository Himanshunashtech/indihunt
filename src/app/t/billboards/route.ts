import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BillboardAd } from '@/types';
import { getCachedData, setCachedData, redis } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const DEFAULT_BILLBOARDS: BillboardAd[] = [
  {
    id: "bb_supabase_default",
    title: "Supabase — The Open Source Firebase Alternative",
    image_url: "/supabase_ad_banner.webp",
    destination_url: "https://supabase.com",
    is_active: true,
    views_count: 1420,
    clicks_count: 88,
    created_at: new Date().toISOString()
  },
  {
    id: "bb_indihunt_default",
    title: "Launch & Advertise Your Product on IndiHunt",
    image_url: "/indihunt_horizontal_banner.webp",
    destination_url: "/advertise",
    is_active: true,
    views_count: 2310,
    clicks_count: 145,
    created_at: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const lastSeenId = searchParams.get('lastSeenId');
    const adminMode = searchParams.get('admin') === 'true';

    let ads: BillboardAd[] = [];
    const cacheKey = adminMode ? 'billboards_admin' : 'billboards_active';
    const cached = await getCachedData<BillboardAd[]>(cacheKey);

    if (cached && Array.isArray(cached) && cached.length > 0) {
      ads = cached;
    } else {
      try {
        let supabase: any;
        try {
          supabase = createAdminSupabaseClient();
        } catch {
          supabase = await createServerSupabaseClient();
        }
        let query = supabase.from('billboard_ads').select('*').order('created_at', { ascending: false });
        if (!adminMode) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query;
        if (data && data.length > 0) {
          ads = data;
          await setCachedData(cacheKey, ads, 300);
        }
      } catch (e) { }
    }

    if (adminMode) {
      return apiSuccessSecure(ads);
    }

    const pool = ads.length > 0 ? ads : DEFAULT_BILLBOARDS;

    // Guaranteed different ad rotation on refresh when lastSeenId is provided
    if (lastSeenId && pool.length > 1) {
      const unviewed = pool.filter(a => a.id !== lastSeenId);
      const viewed = pool.filter(a => a.id === lastSeenId);
      // High-entropy shuffle on remaining unviewed ads
      for (let i = unviewed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unviewed[i], unviewed[j]] = [unviewed[j], unviewed[i]];
      }
      const rotated = [...unviewed, ...viewed];
      return apiSuccessSecure({ ads: rotated });
    }

    // High-entropy randomized shuffle for fair initial distribution
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (sessionId && redis) {
      try {
        const history = (await redis.get<string[]>(`billboard_history:${sessionId}`)) || [];
        const unviewed = shuffled.filter(a => !history.includes(a.id));
        const viewed = shuffled.filter(a => history.includes(a.id));
        const rotated = [...unviewed, ...viewed];

        if (rotated[0]) {
          const nextHistory = [...history.filter((id: string) => id !== rotated[0].id), rotated[0].id];
          if (nextHistory.length > 10) nextHistory.shift();
          await redis.set(`billboard_history:${sessionId}`, nextHistory, { ex: 300 });
        }
        return apiSuccessSecure({ ads: rotated });
      } catch (e) { }
    }

    return apiSuccessSecure({ ads: shuffled });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to fetch billboards', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let supabase: any;
    try {
      supabase = createAdminSupabaseClient();
    } catch {
      supabase = await createServerSupabaseClient();
    }
    const { data, error } = await supabase.from('billboard_ads').insert(body).select('*').single();
    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(data, 201);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to create billboard', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return apiFailure('Missing billboard id', 400);

    let supabase: any;
    try {
      supabase = createAdminSupabaseClient();
    } catch {
      supabase = await createServerSupabaseClient();
    }
    const { data, error } = await supabase.from('billboard_ads').update(updates).eq('id', id).select('*').single();
    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(data);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to update billboard', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiFailure('Missing billboard id', 400);

    let supabase: any;
    try {
      supabase = createAdminSupabaseClient();
    } catch {
      supabase = await createServerSupabaseClient();
    }
    const { error } = await supabase.from('billboard_ads').delete().eq('id', id);
    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure({ success: true, id });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to delete billboard', 500);
  }
}
