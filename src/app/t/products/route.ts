import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function normalizeUrl(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('?')[0]
    .split('#')[0]
    .replace(/\/+$/, '');
}

function extractDomain(raw: string): string {
  const norm = normalizeUrl(raw);
  return norm.split('/')[0] || norm;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const queryStr = searchParams.get('q') || searchParams.get('search');
    const checkUrl = searchParams.get('check_url') || searchParams.get('url');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const makerId = searchParams.get('makerId') || searchParams.get('maker_id');

    const cacheKey = `redis_products_${category || 'all'}_${limit}`;

    // Redis cache hit for non-personalized, non-maker, non-search requests
    if (!userId && !queryStr && !checkUrl && !makerId) {
      const cached = await getCachedData<any[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return apiSuccessSecure(cached);
      }
    }

    const supabase = await createServerSupabaseClient();
    let products: any[] = [];
    try {
      let query = supabase
        .from('products')
        .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, is_maker, karma_points, streak_count)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (makerId) {
        query = query.eq('maker_id', makerId);
      }

      if (category) {
        query = query.contains('tags', [category]);
      }

      if (checkUrl) {
        const cleanDomain = extractDomain(checkUrl);
        const normUrl = normalizeUrl(checkUrl);
        query = query.or(`website_url.ilike.%${cleanDomain}%,website_url.ilike.%${normUrl}%`);
      } else if (queryStr) {
        query = query.or(`name.ilike.%${queryStr}%,tagline.ilike.%${queryStr}%,description.ilike.%${queryStr}%`);
      }

      const { data: productsData, error } = await query;
      if (!error && productsData) {
        products = productsData;
      } else if (error) {
        console.warn('[GET /t/products] Primary query error, falling back to simple select:', error.message);
        let fallbackQuery = supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (makerId) fallbackQuery = fallbackQuery.eq('maker_id', makerId);
        if (checkUrl) {
          const cleanDomain = extractDomain(checkUrl);
          const normUrl = normalizeUrl(checkUrl);
          fallbackQuery = fallbackQuery.or(`website_url.ilike.%${cleanDomain}%,website_url.ilike.%${normUrl}%`);
        } else if (queryStr) {
          fallbackQuery = fallbackQuery.or(`name.ilike.%${queryStr}%,tagline.ilike.%${queryStr}%,description.ilike.%${queryStr}%`);
        }

        const { data: fallbackData } = await fallbackQuery;
        if (fallbackData) products = fallbackData;
      }
    } catch (dbErr: any) {
      console.warn('[GET /t/products] Supabase connection error:', dbErr?.message);
    }

    if (!userId && !queryStr && !checkUrl && !makerId && products.length > 0) {
      // 5-min TTL — feed is eventually consistent, saves ~80% Supabase round-trips
      setCachedData(cacheKey, products, 300);
    }

    if (queryStr) {
      const q = queryStr.toLowerCase();
      products = products.filter((p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    if (userId && products.length > 0) {
      try {
        const productIds = products.map((p: any) => p.id);
        const { data: upvotes } = await supabase
          .from('upvotes')
          .select('product_id')
          .eq('user_id', userId)
          .in('product_id', productIds);

        const upvotedSet = new Set((upvotes || []).map((u: any) => u.product_id));
        products = products.map((p: any) => ({
          ...p,
          has_upvoted: upvotedSet.has(p.id)
        }));
      } catch (upvoteErr) {
        console.warn('[GET /t/products] Upvotes check error:', upvoteErr);
      }
    }

    return apiSuccessSecure(products);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch products', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tagline, description, website_url, logo_url, screenshots, maker_id, tags, scheduled_for, status } = body;

    if (!name || !tagline || !website_url || !maker_id) {
      return apiFailure('Missing required fields (name, tagline, website_url, maker_id)', 400);
    }

    const nameV = checkContentViolation(name);
    if (nameV.hasViolation) return apiFailure(nameV.message || 'Content violation in product name', 400);

    const tagV = checkContentViolation(tagline);
    if (tagV.hasViolation) return apiFailure(tagV.message || 'Content violation in product tagline', 400);

    if (description) {
      const descV = checkContentViolation(description);
      if (descV.hasViolation) return apiFailure(descV.message || 'Content violation in description', 400);
    }

    const supabase = await createServerSupabaseClient();

    // Check for duplicate products by normalized URL, domain, or exact name
    const normSubmitted = normalizeUrl(website_url);
    const domainSubmitted = extractDomain(website_url);
    const cleanName = name.trim().toLowerCase();

    if (normSubmitted) {
      const { data: existingProds } = await supabase
        .from('products')
        .select('id, name, website_url')
        .or(`website_url.ilike.%${domainSubmitted}%,name.ilike.${name.trim()}`)
        .limit(20);

      if (existingProds && existingProds.length > 0) {
        const duplicate = existingProds.find((p: any) => {
          const normExisting = normalizeUrl(p.website_url || '');
          const domainExisting = extractDomain(p.website_url || '');
          const existingName = (p.name || '').trim().toLowerCase();
          return (
            normExisting === normSubmitted ||
            (domainSubmitted.includes('.') && domainExisting === domainSubmitted) ||
            existingName === cleanName
          );
        });

        if (duplicate) {
          return apiFailure(`This product (${duplicate.name}) has already been launched on IndiHunt!`, 409);
        }
      }
    }

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
        scheduled_for: scheduled_for || null,
        status: status || (scheduled_for ? 'scheduled' : 'live')
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
    invalidateCache('redis_products_all_30');

    return apiSuccessSecure({ ...newProduct, has_upvoted: true }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create product', 500);
  }
}
