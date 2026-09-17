import { NextRequest } from 'next/server';
import { getActiveAdsPool } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeProductId = searchParams.get('excludeProductId') || undefined;
    const placement = searchParams.get('placement') || 'product_pages';
    const country = searchParams.get('country');
    const device = searchParams.get('device') as 'mobile' | 'desktop' | null;
    const sessionId = searchParams.get('sessionId');

    const pool = await getActiveAdsPool(excludeProductId);

    if (pool.length === 0) {
      return apiSuccess({ ad: null });
    }

    const filteredPool = pool.filter(c => {
      if (placement === 'product_pages' && c.placement_product_pages === false) return false;
      if (placement === 'search' && c.placement_search === false) return false;
      if (placement === 'category' && c.placement_category === false) return false;
      if (placement === 'forums' && c.placement_forums === false) return false;
      if (c.target_device && c.target_device !== 'all' && device && c.target_device !== device) return false;
      if (c.target_country && country && c.target_country.toLowerCase() !== country.toLowerCase()) return false;
      return true;
    });

    let selectedAd = filteredPool.length > 0 ? filteredPool[0] : pool[0];

    // Read history if sessionId present
    if (sessionId && redis) {
      try {
        const history = (await redis.get<string[]>(`ad_history:${sessionId}`)) || [];
        const unviewed = filteredPool.filter(c => !history.includes(c.id));
        if (unviewed.length > 0) {
          selectedAd = unviewed[Math.floor(Math.random() * unviewed.length)];
        } else if (filteredPool.length > 0) {
          selectedAd = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        }
        const nextHistory = [...history, selectedAd.id];
        if (nextHistory.length > 10) nextHistory.shift();
        await redis.set(`ad_history:${sessionId}`, nextHistory, { ex: 300 });
      } catch (e) {
        console.error('Error writing ad history to Redis:', e);
      }
    }

    const adToReturn = { ...selectedAd };
    let destination = selectedAd.products?.website_url || selectedAd.destination_url;
    try {
      const urlObj = new URL(destination);
      urlObj.searchParams.set('ref', 'indihunt');
      destination = urlObj.toString();
    } catch {
      destination = destination.includes('?') ? `${destination}&ref=indihunt` : `${destination}?ref=indihunt`;
    }
    adToReturn.destination_url = destination;

    return apiSuccess({ ad: adToReturn });
  } catch (err: any) {
    return apiFailure(err?.message || 'Internal Server Error', 500);
  }
}
