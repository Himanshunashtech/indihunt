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
    const { action } = body;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!productId || !isUuid || !action) {
      return apiFailure('Valid productId and action are required', 400);
    }

    const updates = action === 'feature'
      ? { editor_pick: true, featured: true, featured_at: new Date().toISOString(), never_feature: false }
      : { editor_pick: false, featured: false, never_feature: true };

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ success: true, featured: action === 'feature' });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to feature product', 500);
  }
}
