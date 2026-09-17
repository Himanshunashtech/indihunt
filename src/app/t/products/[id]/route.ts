import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const supabase = await createServerSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let product: any = null;

    if (isUuid) {
      const { data } = await supabase
        .from('products')
        .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)')
        .eq('id', id)
        .maybeSingle();
      product = data;
    }

    if (!product) {
      const { data: allProds } = await supabase
        .from('products')
        .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)');
      if (allProds) {
        product = allProds.find(
          (p: any) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
        ) || null;
      }
    }

    if (!product) {
      return apiFailure('Product not found', 404);
    }

    let hasUpvoted = false;
    if (userId) {
      const { data: upvote } = await supabase
        .from('upvotes')
        .select('id')
        .eq('product_id', product.id)
        .eq('user_id', userId)
        .maybeSingle();
      hasUpvoted = !!upvote;
    }

    return apiSuccess({ ...product, has_upvoted: hasUpvoted });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch product', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const supabase = await createServerSupabaseClient();

    const { data: updated, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', id)
      .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccess(updated);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update product', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return apiFailure('Invalid product ID', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccess(undefined, 200);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete product', 500);
  }
}
