import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const queryStr = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const cacheKey = `redis_products_${category || 'all'}_${limit}`;

    // Redis cache hit for non-personalized requests
    if (!userId && !queryStr) {
      const cached = await getCachedData<any[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return apiSuccess(cached);
      }
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('products')
      .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('maker_id', userId);
    }

    if (category) {
      query = query.contains('tags', [category]);
    }

    const { data: productsData, error } = await query;
    if (error) {
      return apiFailure(error.message, 500);
    }

    let products = productsData || [];

    if (!userId && !queryStr && products.length > 0) {
      setCachedData(cacheKey, products, 60);
    }

    if (queryStr) {
      const q = queryStr.toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    if (userId && products.length > 0) {
      const productIds = products.map(p => p.id);
      const { data: upvotes } = await supabase
        .from('upvotes')
        .select('product_id')
        .eq('user_id', userId)
        .in('product_id', productIds);

      const upvotedSet = new Set((upvotes || []).map(u => u.product_id));
      products = products.map(p => ({
        ...p,
        has_upvoted: upvotedSet.has(p.id)
      }));
    }

    return apiSuccess(products);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch products', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tagline, description, website_url, logo_url, screenshots, maker_id, tags } = body;

    if (!name || !tagline || !website_url || !maker_id) {
      return apiFailure('Missing required fields (name, tagline, website_url, maker_id)', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name,
        tagline,
        description: description || '',
        website_url,
        logo_url: logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
        screenshots: screenshots || [],
        maker_id,
        tags: tags || ['SaaS'],
        upvotes_count: 1,
        comments_count: 0,
        status: 'published'
      })
      .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    await supabase.from('upvotes').insert({
      product_id: newProduct.id,
      user_id: maker_id
    });

    invalidateCache('redis_products_all_100');

    return apiSuccess({ ...newProduct, has_upvoted: true }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create product', 500);
  }
}
