import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const clickCooldownCache = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { billboardId, eventType, sessionId } = await request.json().catch(() => ({}));

    if (!billboardId || !eventType) {
      return apiFailure('Missing billboardId or eventType', 400);
    }

    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

    if (isBot) {
      return apiFailure('Bot detected', 403, { reason: 'bot_detected' });
    }

    if (eventType === 'click' && sessionId) {
      const cacheKey = `click_cooldown:${sessionId}:${billboardId}`;
      let hasClicked = false;
      try {
        hasClicked = !!(await getCachedData<boolean>(cacheKey));
      } catch {
        const localKey = `${sessionId}_${billboardId}`;
        const lastClick = clickCooldownCache.get(localKey) || 0;
        hasClicked = Date.now() - lastClick < 3000;
      }

      if (hasClicked) {
        return apiFailure('Cooldown abuse', 429, { reason: 'cooldown_abuse' });
      }

      try {
        await setCachedData(cacheKey, true, 3);
      } catch {
        const localKey = `${sessionId}_${billboardId}`;
        clickCooldownCache.set(localKey, Date.now());
      }
    }

    // Non-UUID / mock billboards don't log to Postgres RPC
    if (billboardId.startsWith('bb_')) {
      return apiSuccessSecure({ success: true, mocked: true });
    }

    try {
      const adminSupabase = createAdminSupabaseClient();
      await adminSupabase.rpc('log_billboard_event', {
        billboard_uuid: billboardId,
        is_click: eventType === 'click',
      });
    } catch (e) {}

    return apiSuccessSecure({ success: true });
  } catch (err: any) {
    return apiSuccessSecure({ success: true, fallback: true });
  }
}
