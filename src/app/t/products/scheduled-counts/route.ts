import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const counts: Record<string, number> = {};

    const recordProductDate = (dateVal: string | Date | undefined) => {
      if (!dateVal) return;
      try {
        const dateKeys = new Set<string>();
        if (typeof dateVal === 'string') {
          const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            dateKeys.add(`${match[1]}-${match[2]}-${match[3]}`);
          }
        }
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          dateKeys.add(`${yyyy}-${mm}-${dd}`);

          // UTC representation
          const utcYyyy = d.getUTCFullYear();
          const utcMm = String(d.getUTCMonth() + 1).padStart(2, '0');
          const utcDd = String(d.getUTCDate()).padStart(2, '0');
          dateKeys.add(`${utcYyyy}-${utcMm}-${utcDd}`);
        }

        dateKeys.forEach((key) => {
          counts[key] = (counts[key] || 0) + 1;
        });
      } catch {}
    };

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, name, scheduled_for, status, is_deleted')
      .eq('is_deleted', false)
      .not('scheduled_for', 'is', null);

    if (error) {
      return apiFailure(error.message, 500);
    }

    if (data && Array.isArray(data)) {
      data.forEach((p: any) => {
        if (!p.is_deleted && p.scheduled_for) {
          recordProductDate(p.scheduled_for);
        }
      });
    }

    return apiSuccessSecure(counts);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to get scheduled product counts', 500);
  }
}
