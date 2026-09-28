import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return apiFailure('Missing productId parameter', 400);
    }

    const cacheKey = `awards_${productId}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      return apiSuccessSecure(cached);
    }

    const supabase = await createServerSupabaseClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, tagline, upvotes_count, created_at, scheduled_for, status')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return apiFailure('Product not found', 404);
    }

    const upvotes = product.upvotes_count || 0;
    const awards: any[] = [];

    // Milestone Awards
    if (upvotes >= 100) {
      awards.push({
        type: "Orbit Awards",
        title: "The People's Champ Award",
        subtitle: product.name,
        tagline: product.tagline || "",
        date: "2025",
        rank: "P",
        iconType: "orbit",
      });
    }

    if (upvotes >= 50) {
      awards.push({
        type: "Launch Awards",
        title: "Top 10 Product of the Day",
        subtitle: product.name,
        tagline: product.tagline || "",
        date: "Launch Day",
        rank: "#5",
        iconType: "trophy",
      });
    }

    if (upvotes >= 20) {
      awards.push({
        type: "Rising Star",
        title: "Trending Indie Product",
        subtitle: product.name,
        tagline: product.tagline || "",
        date: "2025",
        rank: "★",
        iconType: "star",
      });
    }

    const res = {
      productId: product.id,
      upvotesCount: upvotes,
      awards,
    };
    await setCachedData(cacheKey, res, 300);
    return apiSuccessSecure(res);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to calculate awards', 500);
  }
}
