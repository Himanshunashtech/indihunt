import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const clickCooldownCache = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { campaignId, eventType, sessionId, userId } = await request.json().catch(() => ({}));

    if (!campaignId || !eventType) {
      return apiFailure('Missing campaignId or eventType', 400);
    }

    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

    if (isBot) {
      return apiFailure('Bot detected', 403, { reason: 'bot_detected' });
    }

    if (eventType === 'click' && sessionId) {
      const cacheKey = `click_cooldown:${sessionId}:${campaignId}`;
      let hasClicked = false;
      try {
        hasClicked = !!(await getCachedData<boolean>(cacheKey));
      } catch {
        const localKey = `${sessionId}_${campaignId}`;
        const lastClick = clickCooldownCache.get(localKey) || 0;
        hasClicked = Date.now() - lastClick < 3000;
      }

      if (hasClicked) {
        return apiFailure('Cooldown abuse', 429, { reason: 'cooldown_abuse' });
      }

      try {
        await setCachedData(cacheKey, true, 3);
      } catch {
        const localKey = `${sessionId}_${campaignId}`;
        clickCooldownCache.set(localKey, Date.now());
      }
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: campaign } = await adminSupabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaign) {
      if (eventType === 'click' && userId && campaign.user_id === userId) {
        return apiFailure('Self-click ignored', 400, { reason: 'self_click_ignored' });
      }

      const { error: rpcError } = await adminSupabase.rpc('log_ad_event', {
        campaign_uuid: campaignId,
        is_click: eventType === 'click',
      });

      if (rpcError) {
        return apiFailure('Failed to log event', 500);
      }
    }

    return apiSuccessSecure();
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to process ad event', 500);
  }
}
