import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache, invalidateCachePattern } from '@/lib/redis';
import { apiSuccessSecure, apiFailure, PUBLIC_CACHE_HEADERS } from '@/lib/api/response';
import { checkContentViolation } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Feed list columns — only what ProductItem card actually renders
// Feed list columns — only what ProductItem card actually renders
const LIST_COLS =
  'id,name,tagline,logo_url,website_url,scheduled_for,tags,status,created_at,upvotes_count,comments_count,quality_score,featured,country,pricing_type,is_open_source,is_student_project,is_deleted,maker_id,maker:profiles!maker_id(id,username,full_name,avatar_url,headline,is_maker,is_verified)';
const FULL_COLS =
  '*, maker:profiles!maker_id(id, username, full_name, avatar_url, is_maker, karma_points, streak_count)';
const MAX_LIMIT = 300;

function normalizeUrl(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^\/\//, '')
    .replace(/^www\./i, '')
    .split('?')[0]
    .split('#')[0]
    .trim()
    .replace(/\/+/g, '/')
    .replace(/\/+$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const queryStr = searchParams.get('q') || searchParams.get('search');
    const checkUrl = searchParams.get('check_url') || searchParams.get('url');
    const cursor = searchParams.get('cursor');
    const full = searchParams.get('full') === 'true';
    const makerId = searchParams.get('makerId') || searchParams.get('maker_id');

    const requested = parseInt(searchParams.get('limit') || (cursor ? '20' : '100'), 10);
    let limit = Math.min(Number.isFinite(requested) ? requested : 100, MAX_LIMIT);
    if (queryStr || checkUrl) limit = Math.min(limit, 50);

    const cacheKey = `redis_products_${category || 'all'}_${limit}_${cursor || 'none'}_${full ? 'full' : 'lite'}`;
    const canUsePublicCache = !queryStr && !checkUrl && !makerId;

    let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
    const db = async () => (supabase ??= await createServerSupabaseClient());

    let products: any[] = [];
    if (canUsePublicCache) {
      const cached = await getCachedData<any[]>(cacheKey);
      if (Array.isArray(cached) && cached.length > 0) products = cached;
    }

    if (products.length === 0) {
      const selectCols = checkUrl ? 'id, name, website_url, is_deleted' : (full ? FULL_COLS : LIST_COLS);
      let query = (await db())
        .from('products')
        .select(selectCols)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (cursor) query = query.lt('created_at', cursor);
      if (makerId) query = query.eq('maker_id', makerId);
      if (category) query = query.contains('tags', [category]);
      if (checkUrl) {
        query = query.or(`website_url.ilike.%${normalizeUrl(checkUrl)}%`);
      } else if (queryStr) {
        const q = queryStr.replace(/[%,()]/g, ' ').trim();
        query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[GET /t/products]', error.message);
        return apiFailure(error.message, 500);
      }
      const now = new Date();
      products = (data || []).map((p: any) =>
        p.status === 'scheduled' && p.scheduled_for && new Date(p.scheduled_for) <= now
          ? { ...p, status: 'live' }
          : p
      );
      if (canUsePublicCache && products.length > 0) await setCachedData(cacheKey, products, 300);
    }

    if (userId && products.length > 0) {
      const { data: upvotes } = await (await db())
        .from('upvotes')
        .select('product_id')
        .eq('user_id', userId)
        .limit(2000);
      const set = new Set((upvotes || []).map((u: any) => u.product_id));
      products = products.map((p: any) => ({ ...p, has_upvoted: set.has(p.id) }));
    }

    return apiSuccessSecure(products, 200, userId ? undefined : PUBLIC_CACHE_HEADERS);
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

    // Check for duplicate products strictly by normalized URL
    const normSubmitted = normalizeUrl(website_url);

    if (normSubmitted) {
      const { data: existingProds } = await supabase
        .from('products')
        .select('id, name, website_url, is_deleted')
        .ilike('website_url', `%${normSubmitted}%`)
        .limit(50);

      if (existingProds && existingProds.length > 0) {
        const duplicate = existingProds.find((p: any) => {
          if (p.is_deleted) return false;
          const normExisting = normalizeUrl(p.website_url || '');
          return normExisting === normSubmitted;
        });

        if (duplicate) {
          return apiFailure(`This product (${duplicate.name}) has already been launched on IndiHunt!`, 409);
        }
      }
    }

    const worked_on_launch = body.worked_on_launch !== undefined
      ? Boolean(body.worked_on_launch)
      : (body.workedOnLaunch !== undefined ? Boolean(body.workedOnLaunch) : true);

    const isScheduled = Boolean(
      status === 'scheduled' || (scheduled_for && new Date(scheduled_for) > new Date())
    );
    const initialUpvotes = isScheduled ? 0 : 1;

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
        worked_on_launch,
        pricing_type: body.pricing_type || 'free',
        promo_offer: body.promo_offer || null,
        promo_code: body.promo_code || null,
        promo_expiry: body.promo_expiry || null,
        video_url: body.video_url || null,
        demo_url: body.demo_url || null,
        funding_type: body.funding_type || null,
        is_open_source: body.is_open_source || false,
        github_url: body.github_url || null,
        is_student_project: body.is_student_project || false,
        school: body.school || null,
        additional_urls: body.additional_urls || [],
        twitter_url: body.twitter_url || null,
        country: body.country || 'Global',
        tags: tags || ['SaaS'],
        upvotes_count: initialUpvotes,
        comments_count: 0,
        scheduled_for: scheduled_for || null,
        status: status || (isScheduled ? 'scheduled' : 'live')
      })
      .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    if (Array.isArray(body.makers) && body.makers.length > 0) {
      try {
        const memberInserts = body.makers.map((uId: string) => ({
          product_id: newProduct.id,
          user_id: uId,
          role: 'maker'
        }));
        await supabase.from('product_members').insert(memberInserts);
      } catch {}
    }

    if (!isScheduled) {
      await supabase.from('upvotes').insert({
        product_id: newProduct.id,
        user_id: maker_id
      });
    }

    await Promise.all([
      invalidateCachePattern('redis_products_'),
      invalidateCache('public_products'),
      invalidateCache('product_slug_map'),
    ]);

    return apiSuccessSecure({ ...newProduct, has_upvoted: !isScheduled }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create product', 500);
  }
}

