import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const supabase = await createServerSupabaseClient();
    const { data: updated, error } = await supabase
      .from('pacts')
      .update({ status: status || 'completed' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(updated);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update pact', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('pacts')
      .delete()
      .eq('id', id);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ deleted: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete pact', 500);
  }
}
