import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, proofUrl, message } = body;

    if (!userId) {
      return apiFailure('Missing userId for claim', 400);
    }

    const supabase = await createServerSupabaseClient();

    // Verify product exists and has no maker or maker is not current user
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('id, maker_id, name')
      .eq('id', id)
      .single();

    if (fetchErr || !product) {
      return apiFailure('Product not found', 404);
    }

    // Update product maker_id to the claiming user
    const { data: updatedProduct, error: updateErr } = await supabase
      .from('products')
      .update({ maker_id: userId })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      return apiFailure(updateErr.message, 500);
    }

    return apiSuccessSecure({ claimed: true, product: updatedProduct });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to process product claim', 500);
  }
}
