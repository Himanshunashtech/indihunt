import { NextRequest, NextResponse } from 'next/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  return apiSuccessSecure({ status: 'ok', service: 'dodo-checkout-api' });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function POST(req: NextRequest | Request) {
  try {
    const {
      campaignId,
      amount,
      name,
      userName,
      customerName,
      userEmail,
      productId,
      userId,
      headline,
      description,
      cta_text,
      daily_limit,
      cpm_rate,
      target_impressions,
      destination_url,
    } = await req.json();

    const DODO_CHECKOUT_LINK = process.env.NEXT_PUBLIC_DODO_CHECKOUT_LINK || process.env.DODO_CHECKOUT_LINK;
    const DODO_PAYMENTS_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
    const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID;

    const envSetting = (process.env.DODO_ENVIRONMENT || 'test').trim().toLowerCase();
    const isLive =
      envSetting === 'live' ||
      envSetting === 'live_mode' ||
      envSetting === 'production' ||
      envSetting === 'prod';

    const baseUrl = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://indihunt.in';
    const returnUrl = `${siteUrl}/?payment_status=success&gateway=dodo&campaign_id=${campaignId || ''}&product_id=${productId || ''}&user_id=${userId || ''}&amount=${amount || 1199}`;

    const actualCustomerName = customerName || userName || (userEmail ? userEmail.split('@')[0] : 'IndiHunt Maker');
    const actualCampaignName = name || 'Sponsored Ad Campaign';

    if (DODO_CHECKOUT_LINK) {
      const checkoutUrl = new URL(DODO_CHECKOUT_LINK);
      if (userEmail) checkoutUrl.searchParams.set('email', userEmail);
      if (actualCustomerName) checkoutUrl.searchParams.set('fullName', actualCustomerName);
      if (campaignId) checkoutUrl.searchParams.set('metadata[campaignId]', campaignId);
      if (productId) checkoutUrl.searchParams.set('metadata[productId]', productId);
      if (userId) checkoutUrl.searchParams.set('metadata[userId]', userId);
      checkoutUrl.searchParams.set('redirect_url', returnUrl);

      return apiSuccessSecure({ url: checkoutUrl.toString(), provider: 'dodo', campaignId });
    }

    if (DODO_PAYMENTS_API_KEY) {
      const sessionPayload: any = {
        customer: {
          email: userEmail || 'maker@indihunt.in',
          name: actualCustomerName,
        },
        return_url: returnUrl,
        metadata: {
          campaignId: campaignId || '',
          productId: productId || '',
          userId: userId || '',
          userEmail: userEmail || '',
          name: actualCampaignName,
          headline: headline || '',
          description: description || '',
          cta_text: cta_text || 'Visit Product',
          daily_limit: String(daily_limit || 10),
          cpm_rate: String(cpm_rate || 10.0),
          target_impressions: String(target_impressions || 119900),
          destination_url: destination_url || '',
          amount: String(amount || 1199),
          platform: 'indihunt',
          type: 'ad_campaign_billboard',
        },
      };

      if (DODO_PRODUCT_ID) {
        sessionPayload.product_cart = [
          {
            product_id: DODO_PRODUCT_ID,
            quantity: 1,
            amount: (amount || 1199) * 100,
          },
        ];
      }

      try {
        const checkoutRes = await fetch(`${baseUrl}/checkouts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${DODO_PAYMENTS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionPayload),
        });

        const rawText = await checkoutRes.text();
        let sessionData: any = {};
        try {
          sessionData = JSON.parse(rawText);
        } catch { }

        if (checkoutRes.ok && (sessionData.checkout_url || sessionData.url || sessionData.payment_link)) {
          return apiSuccessSecure({
            url: sessionData.checkout_url || sessionData.url || sessionData.payment_link,
            provider: 'dodo',
            campaignId,
          });
        }
      } catch { }

      try {
        const legacyRes = await fetch(`${baseUrl}/payments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${DODO_PAYMENTS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billing: sessionPayload.customer,
            payment_link: true,
            return_url: returnUrl,
            metadata: sessionPayload.metadata,
            product_cart: sessionPayload.product_cart,
          }),
        });

        const legacyText = await legacyRes.text();
        let legacyData: any = {};
        try {
          legacyData = JSON.parse(legacyText);
        } catch { }

        if (legacyRes.ok && (legacyData.payment_link || legacyData.url || legacyData.checkout_url)) {
          return apiSuccessSecure({
            url: legacyData.payment_link || legacyData.url || legacyData.checkout_url,
            provider: 'dodo',
            campaignId,
          });
        }
      } catch { }
    }

    const fallbackUrl = `${siteUrl}/?payment_status=success&campaign_id=${campaignId || 'test'}&test_paid=true&gateway=dodo`;
    return apiSuccessSecure({
      url: fallbackUrl,
      mode: 'test_sandbox',
      provider: 'dodo',
      campaignId,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create checkout session', 500);
  }
}
