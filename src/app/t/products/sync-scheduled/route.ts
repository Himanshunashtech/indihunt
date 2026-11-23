import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    const { data: scheduledProds, error: fetchErr } = await supabase
      .from('products')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (fetchErr) {
      return apiFailure(fetchErr.message, 500);
    }

    if (!scheduledProds || scheduledProds.length === 0) {
      return apiSuccessSecure({ success: true, count: 0 });
    }

    const ids = scheduledProds.map(p => p.id);
    const { error: updateErr } = await supabase
      .from('products')
      .update({ status: 'live' })
      .in('id', ids);

    if (updateErr) {
      return apiFailure(updateErr.message, 500);
    }

    return apiSuccessSecure({ success: true, count: ids.length, updated_ids: ids });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to sync scheduled products', 500);
  }
}
