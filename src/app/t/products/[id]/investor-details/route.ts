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

    if (!productId) {
      return apiFailure('Missing productId', 400);
    }

    const payload = {
      ...body,
      product_id: productId,
    };

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('product_investor_details')
      .insert(payload);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ success: true }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to submit investor details', 500);
  }
}
