import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('product_id');

    if (!productId) {
      return apiFailure('productId is required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('product_follows')
      .select('product_id, user_id, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .eq('product_id', productId);

    if (error) {
      return apiFailure(error.message, 500);
    }

    const followers = (data || []).map((row: any) => row.user || row).filter(Boolean);
    return apiSuccess(followers);
  } catch (err: any) {
    return apiFailure(err.message || 'Failed to fetch product followers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = body.productId || body.product_id;
    const userId = body.userId || body.user_id;

    if (!productId || !userId) {
      return apiFailure('productId and userId are required', 400);
    }

    const supabase = await createServerSupabaseClient();

    // Check if follow exists
    const { data: existing, error: findErr } = await supabase
      .from('product_follows')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle();

    if (findErr) {
      return apiFailure(findErr.message, 500);
    }

    let isFollowing = false;
    if (existing) {
      const { error: delErr } = await supabase
        .from('product_follows')
        .delete()
        .eq('id', existing.id);

      if (delErr) return apiFailure(delErr.message, 500);
      isFollowing = false;
    } else {
      const { error: insErr } = await supabase
        .from('product_follows')
        .insert({ product_id: productId, user_id: userId });

      if (insErr) return apiFailure(insErr.message, 500);
      isFollowing = true;
    }

    // Get updated follower count
    const { count } = await supabase
      .from('product_follows')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    return apiSuccess({ isFollowing, count: count || 0 });
  } catch (err: any) {
    return apiFailure(err.message || 'Failed to toggle product follow', 500);
  }
}
