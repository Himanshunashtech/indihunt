import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return handleVerification(params);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleVerification(body);
  } catch {
    return apiFailure('Invalid JSON body', 400);
  }
}

async function handleVerification(data: Record<string, any>) {
  try {
    const paymentId = data.paymentId || data.payment_id || data.id || `dodo_${Date.now()}`;
    const checkoutId = data.checkoutId || data.checkout_id;
    const campaignId = data.campaignId || data.campaign_id;
    const productId = data.productId || data.product_id;
    const userId = data.userId || data.user_id;
    const rawAmount = data.amount || data.total_amount || 1199;
    const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 1199;
    const cpmRate = Number(data.cpm_rate) || 10.0;
    const dailyLimit = Number(data.daily_limit) || 10.0;
    const targetImpressions = Number(data.target_impressions) || Math.round((amount / cpmRate) * 1000);
    const name = data.name || data.campaignName || 'Sponsored Ad Campaign';
    const headline = data.headline || data.title || 'Featured on IndiHunt';
    const description = data.description || 'Discover high-growth indie software on IndiHunt.';
    const ctaText = data.cta_text || data.ctaText || 'Visit Product';
    const destinationUrl = data.destination_url || data.destinationUrl || (productId ? `/products/${productId}` : 'https://indihunt.in');

    const DODO_PAYMENTS_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
    const envSetting = (process.env.DODO_ENVIRONMENT || 'test').trim().toLowerCase();
    const isLive = envSetting === 'live' || envSetting === 'live_mode' || envSetting === 'production' || envSetting === 'prod';
    const baseUrl = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

    let verifiedPaymentDetails: any = null;
    if (DODO_PAYMENTS_API_KEY && (paymentId?.startsWith('pay_') || checkoutId?.startsWith('chk_') || checkoutId?.startsWith('sess_'))) {
      try {
        const checkTarget = paymentId?.startsWith('pay_') ? `/payments/${paymentId}` : `/checkouts/${checkoutId}`;
        const checkRes = await fetch(`${baseUrl}${checkTarget}`, {
          headers: {
            Authorization: `Bearer ${DODO_PAYMENTS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (checkRes.ok) {
          verifiedPaymentDetails = await checkRes.json();
        }
      } catch (err) {
        console.warn('Dodo Payment verification check note:', err);
      }
    }

    if (verifiedPaymentDetails) {
      const dodoStatus = (verifiedPaymentDetails.status || '').toLowerCase();
      const failedStatuses = ['failed', 'cancelled', 'canceled', 'refunded', 'expired', 'declined', 'error'];
      if (failedStatuses.includes(dodoStatus)) {
        const adminSupabase = createAdminSupabaseClient();
        if (userId) {
          try {
            await adminSupabase.from('payments').insert({
              user_id: userId,
              campaign_id: campaignId || null,
              dodo_payment_id: paymentId,
              amount: amount,
              currency: verifiedPaymentDetails.currency || 'inr',
              status: 'failed',
              payment_method: 'dodo',
              metadata: {
                ...data,
                dodo_status: dodoStatus,
                verified_at: new Date().toISOString(),
                reason: 'Payment not successful per Dodo API verification',
              },
            });

            if (campaignId) {
              await adminSupabase
                .from('ad_campaigns')
                .update({ status: 'archived' })
                .eq('id', campaignId)
                .eq('status', 'pending_payment');
            }
          } catch (err) {
            console.error('Failed to record failed payment or archive campaign:', err);
          }
        }

        return apiFailure(`Payment failed (status: ${dodoStatus})`, 400, {
          status: 'payment_failed',
          dodo_status: dodoStatus,
        });
      }
    }

    const adminSupabase = createAdminSupabaseClient();
    let savedCampaign: any = null;

    if (campaignId) {
      const { data: existingCamp } = await adminSupabase
        .from('ad_campaigns')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();

      if (existingCamp) {
        const newBudget = Number(existingCamp.total_budget || 0) + amount;
        const additionalImps = Math.round((amount / (Number(existingCamp.cpm_rate) || cpmRate)) * 1000);
        const newTarget = (existingCamp.target_impressions || 0) + additionalImps;

        const { data: updated } = await adminSupabase
          .from('ad_campaigns')
          .update({
            status: 'active',
            total_budget: newBudget,
            target_impressions: newTarget,
            dodo_payment_id: paymentId,
          })
          .eq('id', campaignId)
          .select('*')
          .maybeSingle();

        if (updated) savedCampaign = updated;
      }
    }

    if (!savedCampaign && (productId || destinationUrl) && userId) {
      const { data: newCamp } = await adminSupabase
        .from('ad_campaigns')
        .insert({
          user_id: userId,
          product_id: productId || null,
          name,
          headline,
          description,
          cta_text: ctaText,
          destination_url: destinationUrl,
          status: 'active',
          total_budget: amount,
          target_impressions: targetImpressions > 0 ? targetImpressions : 119900,
          delivered_impressions: 0,
          impressions: 0,
          clicks: 0,
          daily_limit: dailyLimit,
          cpm_rate: cpmRate,
          dodo_payment_id: paymentId,
          placement_product_pages: true,
          placement_search: true,
          placement_category: true,
          placement_forums: true,
        })
        .select('*')
        .maybeSingle();

      if (newCamp) savedCampaign = newCamp;
    }

    return apiSuccessSecure({
      status: 'verified',
      campaign: savedCampaign,
      paymentId,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Verification process error', 500);
  }
}
