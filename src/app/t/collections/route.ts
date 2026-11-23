import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/collections?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    if (!userId) return apiFailure('userId is required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*, collection_products(product_id, products(*, maker:profiles!maker_id(*)))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return apiFailure(error.message, 500);

    const list = (collections || []).map((col: any) => ({
      ...col,
      products: (col.collection_products || [])
        .map((cp: any) => cp.products)
        .filter(Boolean),
    }));

    return apiSuccessSecure(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch collections', 500);
  }
}

// POST /t/collections
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId, user_id } = body;
    const uId = userId || user_id;

    if (!name || !uId) return apiFailure('name and userId are required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: newCol, error } = await supabase
      .from('collections')
      .insert({ name, description: description || null, user_id: uId })
      .select()
      .single();

    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ ...newCol, products: [] }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create collection', 500);
  }
}

// DELETE /t/collections?id=xxx&userId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) return apiFailure('id and userId are required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true, deleted: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete collection', 500);
  }
}
