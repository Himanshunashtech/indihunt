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
    const { userId, reason } = body;

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 7);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('products')
      .update({
        scheduled_deletion_date: scheduledDate.toISOString(),
        deletion_reason: reason || null,
        deleted_by: userId || null
      })
      .eq('id', productId);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({
      success: true,
      scheduled_deletion_date: scheduledDate.toISOString()
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to schedule product deletion', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('products')
      .update({
        scheduled_deletion_date: null,
        deletion_reason: null,
        deleted_by: null
      })
      .eq('id', productId);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ success: true, cancelled: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to cancel product deletion', 500);
  }
}
