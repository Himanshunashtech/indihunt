import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// POST /t/collections/[id]/products
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const body = await request.json();
    const { productId } = body;

    if (!productId) return apiFailure('productId is required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('collection_products')
      .insert({ collection_id: collectionId, product_id: productId });

    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to add product to collection', 500);
  }
}

// DELETE /t/collections/[id]/products?productId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) return apiFailure('productId is required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)
      .eq('product_id', productId);

    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to remove product from collection', 500);
  }
}
