import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/reviews?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('product_id');

    if (!productId) return apiFailure('productId is required', 400);

    const cacheKey = `reviews:product:${productId}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) return apiSuccess(cached);

    const supabase = await createServerSupabaseClient();
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) return apiFailure(error.message, 500);

    const list = reviews || [];
    await setCachedData(cacheKey, list, 300);
    return apiSuccess(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch reviews', 500);
  }
}

// POST /t/reviews
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, product_id, userId, user_id, rating, body: reviewBody, title } = body;
    const pId = productId || product_id;
    const uId = userId || user_id;

    if (!pId || !uId || !rating) return apiFailure('productId, userId, and rating are required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({ product_id: pId, user_id: uId, rating, body: reviewBody || null, title: title || null })
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
      .single();

    if (error) return apiFailure(error.message, 500);

    await invalidateCache(`reviews:product:${pId}`);
    return apiSuccess(review, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to post review', 500);
  }
}

// PATCH /t/reviews — increment view count
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: current } = await supabase.from('reviews').select('views').eq('id', id).single();
    const nextViews = (current?.views || 0) + 1;
    await supabase.from('reviews').update({ views: nextViews }).eq('id', id);

    return apiSuccess({ views: nextViews });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update review views', 500);
  }
}

// DELETE /t/reviews?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) return apiFailure(error.message, 500);

    return apiSuccess({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete review', 500);
  }
}
