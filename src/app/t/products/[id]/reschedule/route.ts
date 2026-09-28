import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { date, userId } = body;

    if (!productId || !date) {
      return apiFailure('Missing productId or date', 400);
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('products')
      .update({
        scheduled_for: date,
        status: 'scheduled'
      })
      .eq('id', productId);

    if (userId) {
      query = query.eq('maker_id', userId);
    }

    const { error } = await query;
    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ success: true, date, status: 'scheduled' });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to reschedule product launch', 500);
  }
}
