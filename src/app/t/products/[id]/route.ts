import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation, getProductSlug } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const cacheKey = `product_detail_${id.toLowerCase()}`;

    // Redis/Memory cache check for guest/public request
    if (!userId) {
      const cached = await getCachedData<any>(cacheKey);
      if (cached && cached.id) {
        return apiSuccessSecure({ ...cached, has_upvoted: false });
      }
    }

    const supabase = await createServerSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let product: any = null;

    const DETAIL_COLUMNS = '*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)';

    if (isUuid) {
      const { data } = await supabase
        .from('products')
        .select(DETAIL_COLUMNS)
        .eq('id', id)
        .maybeSingle();
      product = data;
    }

    if (!product) {
      const { data: allProds } = await supabase
        .from('products')
        .select('id, name');
      if (allProds) {
        const decodedId = decodeURIComponent(id).toLowerCase().trim();
        const matched = allProds.find(
          (p: any) =>
            getProductSlug(p.name).toLowerCase() === decodedId ||
            (p.slug && p.slug.toLowerCase() === decodedId) ||
            p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === decodedId ||
            p.id === id
        );
        if (matched) {
          const { data: fullProduct } = await supabase
            .from('products')
            .select(DETAIL_COLUMNS)
            .eq('id', matched.id)
            .maybeSingle();
          product = fullProduct;
        }
      }
    }

    if (!product) {
      return apiFailure('Product not found', 404);
    }

    // Cache public product data
    await setCachedData(cacheKey, product, 300);
    if (product.id !== id) {
      await setCachedData(`product_detail_${product.id}`, product, 300);
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

    return apiSuccessSecure({ ...product, has_upvoted: hasUpvoted });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch product', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.name) {
      const v = checkContentViolation(body.name);
      if (v.hasViolation) return apiFailure(v.message || 'Content violation in product name', 400);
    }
    if (body.tagline) {
      const v = checkContentViolation(body.tagline);
      if (v.hasViolation) return apiFailure(v.message || 'Content violation in product tagline', 400);
    }
    if (body.description) {
      const v = checkContentViolation(body.description);
      if (v.hasViolation) return apiFailure(v.message || 'Content violation in description', 400);
    }

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

    await invalidateCache(`product_detail_${id.toLowerCase()}`);
    if (updated?.id) await invalidateCache(`product_detail_${updated.id}`);
    if (updated?.name) await invalidateCache(`product_detail_${getProductSlug(updated.name).toLowerCase()}`);

    return apiSuccessSecure(updated);
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

    await invalidateCache(`product_detail_${id.toLowerCase()}`);

    return apiSuccessSecure({ deleted: true }, 200);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete product', 500);
  }
}
