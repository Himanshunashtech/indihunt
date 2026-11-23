import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccessSecure, apiFailure, isValidUUID } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const sessionUserId = authData?.user?.id;

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId') || searchParams.get('user_id');
    const withProducts = searchParams.get('withProducts') === 'true' || searchParams.get('products') === 'true';

    // Prioritize authenticated session user, fallback to query param only if no active session
    const userId = sessionUserId || queryUserId;

    if (!userId) {
      return apiFailure('userId is required or session must be authenticated', 400);
    }

    if (!isValidUUID(userId)) {
      return apiSuccessSecure([]);
    }

    const cacheKey = withProducts ? `upvotes_full:user:${userId}` : `upvotes:user:${userId}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) {
      return apiSuccessSecure(cached);
    }

    if (withProducts) {
      const { data: upvotes, error } = await supabase
        .from('upvotes')
        .select('product:products(id, name, tagline, logo_url, website_url, tags, status, scheduled_for, created_at, upvotes_count, comments_count, quality_score, featured, country, pricing_type, is_open_source, is_deleted, maker_id, worked_on_launch, maker:profiles!maker_id(id, username, full_name, avatar_url, headline, is_maker, is_verified))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return apiFailure(error.message, 500);
      }

      const prods = (upvotes || []).map((u: any) => u.product).filter(Boolean);
      await setCachedData(cacheKey, prods, 30);
      return apiSuccessSecure(prods);
    }

    const { data: upvotes, error } = await supabase
      .from('upvotes')
      .select('product_id')
      .eq('user_id', userId)
      .limit(2000);

    if (error) {
      return apiFailure(error.message, 500);
    }

    const result = upvotes || [];
    await setCachedData(cacheKey, result, 30);
    return apiSuccessSecure(result);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch upvotes', 500);
  }
}
