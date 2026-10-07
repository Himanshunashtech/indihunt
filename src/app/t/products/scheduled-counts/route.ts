import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('products')
      .select('scheduled_for')
      .eq('status', 'scheduled')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .not('scheduled_for', 'is', null);

    if (error) {
      console.warn('[GET /t/products/scheduled-counts] Database error:', error.message);
      return apiFailure(error.message, 500);
    }

    const counts: Record<string, number> = {};
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    (data || []).forEach((p: any) => {
      if (p.scheduled_for) {
        // Normalize scheduled timestamp to Indian Standard Time (IST) date key YYYY-MM-DD
        const utcDate = new Date(p.scheduled_for);
        const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
        const yyyy = istDate.getUTCFullYear();
        const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(istDate.getUTCDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return apiSuccessSecure(counts, 200, {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    });
  } catch (error: any) {
    console.error('[GET /t/products/scheduled-counts] Error:', error);
    return apiFailure(error?.message || 'Failed to fetch scheduled counts', 500);
  }
}
