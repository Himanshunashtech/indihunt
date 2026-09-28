import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const withProducts = searchParams.get('withProducts') === 'true' || searchParams.get('products') === 'true';

    if (!userId) {
      return apiFailure('userId is required', 400);
    }

    const supabase = await createServerSupabaseClient();

    if (withProducts) {
      const { data: upvotes, error } = await supabase
        .from('upvotes')
        .select('product:products(*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker))')
        .eq('user_id', userId);

      if (error) {
        return apiFailure(error.message, 500);
      }

      const prods = (upvotes || []).map((u: any) => u.product).filter(Boolean);
      return apiSuccessSecure(prods);
    }

    const { data: upvotes, error } = await supabase
      .from('upvotes')
      .select('product_id')
      .eq('user_id', userId);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(upvotes || []);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch upvotes', 500);
  }
}
