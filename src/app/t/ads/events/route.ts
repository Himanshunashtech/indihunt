import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return apiFailure('Missing campaignId parameter', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('ad_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(data || []);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch ad campaign events', 500);
  }
}
