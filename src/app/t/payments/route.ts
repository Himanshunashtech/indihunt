import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PaymentRecord, AdBudgetTransaction } from '@/types';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const campaignId = searchParams.get('campaignId');
    const all = searchParams.get('all') === 'true';

    const supabase = await createServerSupabaseClient();

    if (campaignId) {
      const { data, error } = await supabase
        .from('ad_budget_transactions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure(data || []);
    }

    if (userId && !all) {
      let { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const { data: legacyData } = await supabase
          .from('polar_payments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (legacyData) data = legacyData;
      }

      return apiSuccessSecure(data || []);
    }

    // All payments
    const result: PaymentRecord[] = [];
    const { data: dbPayments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbPayments && dbPayments.length > 0) {
      result.push(...(dbPayments as PaymentRecord[]));
    } else {
      const { data: legacyPayments } = await supabase
        .from('polar_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (legacyPayments) {
        result.push(...(legacyPayments as PaymentRecord[]));
      }
    }

    // Also fetch campaigns to synthesize any unrecorded ad payments
    const { data: dbCampaigns } = await supabase
      .from('ad_campaigns')
      .select('*, user:profiles!user_id(username, full_name)')
      .order('created_at', { ascending: false });

    if (dbCampaigns) {
      const existingPayCampaignIds = new Set(result.map(p => p.campaign_id).filter(Boolean));
      for (const c of dbCampaigns as any[]) {
        if (!existingPayCampaignIds.has(c.id) && c.total_budget > 0) {
          result.push({
            id: `pay_ad_${c.id}`,
            user_id: c.user?.username || c.user_id,
            campaign_id: c.id,
            dodo_payment_id: c.dodo_payment_id || `dodo_${c.id}`,
            amount: Number(c.total_budget || 0),
            currency: 'usd',
            status: c.status === 'paused_by_admin' ? 'pending' : 'succeeded',
            payment_method: 'dodo',
            metadata: {
              campaignName: c.name,
              headline: c.headline,
              type: 'ad_campaign',
            },
            created_at: c.created_at || new Date().toISOString(),
          });
        }
      }
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return apiSuccessSecure(result);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to fetch payments', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payment = await request.json();
    const newRecord: PaymentRecord = {
      id: payment.id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: payment.user_id || 'admin',
      campaign_id: payment.campaign_id || null,
      dodo_payment_id: payment.dodo_payment_id || null,
      dodo_customer_id: payment.dodo_customer_id || null,
      polar_checkout_id: payment.polar_checkout_id || null,
      polar_order_id: payment.polar_order_id || null,
      amount: payment.amount || 0,
      currency: payment.currency || 'usd',
      status: payment.status || 'succeeded',
      payment_method: payment.payment_method || 'dodo',
      metadata: payment.metadata || {},
      created_at: new Date().toISOString(),
    };

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('payments')
      .insert(newRecord)
      .select('*')
      .single();

    if (!error && data) {
      return apiSuccessSecure(data, 201);
    }

    const { data: legacyData, error: legErr } = await supabase
      .from('polar_payments')
      .insert(newRecord)
      .select('*')
      .single();

    if (!legErr && legacyData) {
      return apiSuccessSecure(legacyData, 201);
    }

    return apiSuccessSecure(newRecord, 201);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to record payment', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, notes } = body;
    if (!paymentId) return apiFailure('Missing paymentId', 400);

    const supabase = await createServerSupabaseClient();
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status, metadata: { notes, updated_at: new Date().toISOString() } })
      .eq('id', paymentId);

    if (updateError) {
      await supabase
        .from('polar_payments')
        .update({ status, metadata: { notes, updated_at: new Date().toISOString() } })
        .eq('id', paymentId);
    }

    return apiSuccessSecure({ success: true, paymentId, status });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to update payment status', 500);
  }
}
