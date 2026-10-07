import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure, isValidUUID } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/user-stacks?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    if (!userId) return apiFailure('userId is required', 400);

    if (!isValidUUID(userId)) {
      return apiSuccessSecure([]);
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('user_stacks')
      .select('product:products(*, maker:profiles!maker_id(*))')
      .eq('user_id', userId);

    if (error) return apiFailure(error.message, 500);

    const products = (data || []).map((s: any) => s.product).filter(Boolean);
    return apiSuccessSecure(products);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch user stack', 500);
  }
}

// POST /t/user-stacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId } = body;

    if (!userId || !productId) return apiFailure('userId and productId are required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('user_stacks')
      .insert({ user_id: userId, product_id: productId });

    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to add product to stack', 500);
  }
}

// DELETE /t/user-stacks?userId=xxx&productId=yyy
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) return apiFailure('userId and productId are required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('user_stacks')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true, deleted: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to remove product from stack', 500);
  }
}
