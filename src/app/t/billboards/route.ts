import { NextRequest } from 'next/server';
import { getBillboardAds, BillboardAd } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const ads = await getBillboardAds(false);

    if (ads.length === 0) {
      return apiSuccess({ ads: [] });
    }

    let recentlyShownIds: string[] = [];
    if (sessionId && redis) {
      try {
        const cached = await redis.get<string[]>(`billboard_history:${sessionId}`);
        if (cached && Array.isArray(cached)) {
          recentlyShownIds = cached;
        }
      } catch (e) {
        console.error('Error reading billboard history from Redis:', e);
      }
    }

    let candidatePool = ads.filter(ad => !recentlyShownIds.includes(ad.id));
    if (candidatePool.length === 0) {
      candidatePool = ads;
      recentlyShownIds = [];
    }

    const scoreAd = (ad: BillboardAd) => {
      const views = ad.views_count || 0;
      const clicks = ad.clicks_count || 0;
      const ctr = views > 0 ? clicks / views : 0.01;
      const createdTime = new Date(ad.created_at).getTime();
      const ageMs = Date.now() - createdTime;
      const freshness = Math.max(0.5, 1 - ageMs / (30 * 24 * 60 * 60 * 1000));

      let rotationPenalty = 1.0;
      if (recentlyShownIds.includes(ad.id)) {
        const index = recentlyShownIds.indexOf(ad.id);
        rotationPenalty = (0.1 * (index + 1)) / Math.max(1, recentlyShownIds.length);
      }

      const score = (ctr * 10 + freshness * 5) * rotationPenalty;
      return { ad, score: Math.max(0.1, score) };
    };

    const selectedAds: BillboardAd[] = [];
    const selectionPool = [...ads];

    while (selectedAds.length < 2 && selectionPool.length > 0) {
      const scored = selectionPool.map(scoreAd);
      const totalScore = scored.reduce((acc, curr) => acc + curr.score, 0);
      let rand = Math.random() * totalScore;
      let chosen = scored[0].ad;

      for (const item of scored) {
        rand -= item.score;
        if (rand <= 0) {
          chosen = item.ad;
          break;
        }
      }

      selectedAds.push(chosen);
      const chosenIdx = selectionPool.findIndex(a => a.id === chosen.id);
      if (chosenIdx > -1) {
        selectionPool.splice(chosenIdx, 1);
      }
    }

    if (sessionId && redis && selectedAds.length > 0) {
      try {
        const updatedHistory = [...recentlyShownIds, ...selectedAds.map(a => a.id)];
        if (updatedHistory.length > 10) updatedHistory.splice(0, updatedHistory.length - 10);
        await redis.set(`billboard_history:${sessionId}`, updatedHistory, { ex: 300 });
      } catch (e) {
        console.error('Error saving billboard history to Redis:', e);
      }
    }

    return apiSuccess({ ads: selectedAds });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to fetch billboards', 500);
  }
}
