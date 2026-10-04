import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdCampaign } from '@/types';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const all = searchParams.get('all') === 'true';

    let supabase: any;
    try {
      supabase = createAdminSupabaseClient();
    } catch {
      supabase = await createServerSupabaseClient();
    }
    let query = supabase.from('ad_campaigns').select('*, user:profiles!user_id(username, full_name)').order('created_at', { ascending: false });

    if (userId && !all) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback query without relational join if foreign key relation is not in schema cache
      let fbQuery = supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
      if (userId && !all) {
        fbQuery = fbQuery.eq('user_id', userId);
      }
      const { data: fbData, error: fbErr } = await fbQuery;
      if (fbErr) return apiFailure(fbErr.message, 500);
      return apiSuccessSecure(fbData || []);
    }

    return apiSuccessSecure(data || []);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to fetch ad campaigns', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const budget = Math.max(Number(body.total_budget) || 1000, 1);
    const cpmRate = body.cpm_rate || 10.00;
    const newCampFields = {
      ...body,
      total_budget: budget,
      daily_limit: Math.min(Number(body.daily_limit) || 10, budget),
      cpm_rate: cpmRate,
      target_impressions: (budget / cpmRate) * 1000,
      delivered_impressions: 0,
      impressions: 0,
      clicks: 0,
    };

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('ad_campaigns')
      .insert(newCampFields)
      .select('*')
      .single();

    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(data, 201);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to create ad campaign', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, addBudget, ...otherUpdates } = body;
    if (!id) return apiFailure('Missing campaign id', 400);

    const supabase = await createServerSupabaseClient();

    if (addBudget && typeof addBudget === 'number') {
      const { data: current } = await supabase.from('ad_campaigns').select('*').eq('id', id).single();
      if (current) {
        const nextTotal = Number(current.total_budget || 0) + addBudget;
        const extraImpressions = Math.floor((addBudget / (Number(current.cpm_rate) || 10)) * 1000);
        const nextTarget = Number(current.target_impressions || 0) + extraImpressions;
        const { data, error } = await supabase
          .from('ad_campaigns')
          .update({
            total_budget: nextTotal,
            target_impressions: nextTarget,
            status: 'active',
          })
          .eq('id', id)
          .select('*')
          .single();

        if (error) return apiFailure(error.message, 500);
        return apiSuccessSecure(data);
      }
    }

    const payload: any = { ...otherUpdates };
    if (status) payload.status = status;

    const { data, error } = await supabase
      .from('ad_campaigns')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(data);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to update ad campaign', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiFailure('Missing campaign id', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);
    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true, id });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to delete ad campaign', 500);
  }
}
