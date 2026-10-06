import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redis, getCachedData, setCachedData } from '@/lib/redis';
import { cached } from '@/lib/cache';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const DEFAULT_SPONSORED_ADS: any[] = [
  {
    id: "default_sponsored_indihunt",
    user_id: "system",
    product_id: "00000000-0000-0000-0000-000000000000",
    name: "IndiHunt for Startups",
    headline: "Reach 50,000+ active tech builders, makers & early adopters in India",
    destination_url: "/advertise",
    logo_url: "/logo.webp",
    total_budget: 1000,
    daily_limit: 50,
    cpm_rate: 10,
    target_impressions: 100000,
    delivered_impressions: 1200,
    impressions: 1200,
    clicks: 84,
    status: "active",
    placement_product_pages: true,
    placement_search: true,
    placement_category: true,
    placement_forums: true,
    created_at: new Date().toISOString()
  },
  {
    id: "default_sponsored_supabase",
    user_id: "system",
    product_id: "00000000-0000-0000-0000-000000000000",
    name: "Supabase Database & Auth",
    headline: "Build in a weekend, scale to millions — The open source Firebase alternative",
    destination_url: "https://supabase.com",
    logo_url: "/supabase_ad_banner.webp",
    total_budget: 1000,
    daily_limit: 50,
    cpm_rate: 10,
    target_impressions: 100000,
    delivered_impressions: 2100,
    impressions: 2100,
    clicks: 142,
    status: "active",
    placement_product_pages: true,
    placement_search: true,
    placement_category: true,
    placement_forums: true,
    created_at: new Date().toISOString()
  }
];

async function fetchActiveAdPool(): Promise<any[]> {
  try {
    let supabase: any;
    try {
      supabase = createAdminSupabaseClient();
    } catch {
      supabase = await createServerSupabaseClient();
    }

    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*, products:product_id(id, name, tagline, logo_url, website_url), user:profiles!user_id(username, full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.filter((c: any) => {
        if (c.target_impressions && (c.delivered_impressions || 0) >= c.target_impressions) {
          return false;
        }
        return true;
      });
    }
  } catch (e) {
    console.error('Error fetching ad campaigns from DB in /t/ads:', e);
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeProductId = searchParams.get('excludeProductId') || undefined;
    const placement = searchParams.get('placement') || 'product_pages';
    const country = searchParams.get('country');
    const device = searchParams.get('device') as 'mobile' | 'desktop' | null;
    const sessionId = searchParams.get('sessionId');
    const seenRaw = searchParams.get('seenAdIds');

    let dbAds = (await cached<any[]>('active_ad_campaigns', 300, fetchActiveAdPool)) || [];

    if (excludeProductId && dbAds.length > 0) {
      dbAds = dbAds.filter((c: any) => c.product_id !== excludeProductId);
    }

    const pool = dbAds.length > 0 ? dbAds : DEFAULT_SPONSORED_ADS;

    const filteredPool = pool.filter(c => {
      if (placement === 'product_pages' && c.placement_product_pages === false) return false;
      if (placement === 'search' && c.placement_search === false) return false;
      if (placement === 'category' && c.placement_category === false) return false;
      if (placement === 'forums' && c.placement_forums === false) return false;
      if (c.target_device && c.target_device !== 'all' && device && c.target_device !== device) return false;
      if (c.target_country && country && c.target_country.toLowerCase() !== country.toLowerCase()) return false;
      return true;
    });

    const activeList = filteredPool.length > 0 ? filteredPool : pool;
    let selectedAd = activeList[0];

    // Client-side seenAdIds rotation
    if (seenRaw) {
      try {
        const seenArr: string[] = JSON.parse(seenRaw);
        const unviewed = activeList.filter(c => !seenArr.includes(c.id));
        if (unviewed.length > 0) {
          selectedAd = unviewed[Math.floor(Math.random() * unviewed.length)];
        } else {
          selectedAd = activeList[Math.floor(Math.random() * activeList.length)];
        }
      } catch (e) {
        selectedAd = activeList[Math.floor(Math.random() * activeList.length)];
      }
    } else {
      selectedAd = activeList[Math.floor(Math.random() * activeList.length)];
    }

    // Read history if sessionId present
    if (sessionId && redis) {
      try {
        const history = (await redis.get<string[]>(`ad_history:${sessionId}`)) || [];
        const unviewed = activeList.filter(c => !history.includes(c.id));
        if (unviewed.length > 0) {
          selectedAd = unviewed[Math.floor(Math.random() * unviewed.length)];
        }
        const nextHistory = [...history.filter(id => id !== selectedAd.id), selectedAd.id];
        if (nextHistory.length > 10) nextHistory.shift();
        await redis.set(`ad_history:${sessionId}`, nextHistory, { ex: 300 });
      } catch (e) { }
    }

    const adToReturn = { ...selectedAd };
    let destination = selectedAd.products?.website_url || selectedAd.destination_url || "/advertise";
    try {
      if (!destination.startsWith('/') && !destination.startsWith('http://') && !destination.startsWith('https://')) {
        destination = 'https://' + destination;
      }
      if (destination.startsWith('http')) {
        const urlObj = new URL(destination);
        urlObj.searchParams.set('ref', 'indihunt');
        destination = urlObj.toString();
      }
    } catch {
      destination = destination.includes('?') ? `${destination}&ref=indihunt` : `${destination}?ref=indihunt`;
    }
    adToReturn.destination_url = destination;

    return apiSuccessSecure({ ad: adToReturn });
  } catch (err: any) {
    return apiFailure(err?.message || 'Internal Server Error', 500);
  }
}
