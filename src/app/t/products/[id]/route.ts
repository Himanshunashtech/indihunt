import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache, invalidateCachePattern } from '@/lib/redis';
import { cached, bumpFeedVersion } from '@/lib/cache';
import { apiSuccessSecure, apiFailure, PUBLIC_CACHE_HEADERS } from '@/lib/api/response';
import { checkContentViolation, getProductSlug } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DETAIL_COLUMNS =
  '*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)';

const ALLOWED = [
  'name', 'tagline', 'description', 'website_url', 'logo_url', 'screenshots',
  'twitter_url', 'facebook_url', 'instagram_url', 'linkedin_url', 'medium_url',
  'github_url', 'video_url', 'show_pre_launch', 'worked_on_launch', 'funding_type',
  'status', 'scheduled_for', 'pricing_type', 'promo_offer', 'promo_code',
  'promo_expiry', 'country', 'is_open_source', 'is_student_project', 'tags',
  'shoutout_names', 'shoutout_notes', 'shoutout_logos'
];

async function fetchProductByKey(key: string) {
  const supabase = await createServerSupabaseClient();
  const isUuid = UUID_RE.test(key);

  if (isUuid) {
    const { data } = await supabase
      .from('products')
      .select(DETAIL_COLUMNS)
      .eq('id', key)
      .eq('is_deleted', false)
      .maybeSingle();
    return data || null;
  }

  const decodedKey = decodeURIComponent(key).toLowerCase().trim();
  const normalizedKey = decodedKey.replace(/[^a-z0-9]/g, '');
  const cleanSearch = decodedKey.replace(/[-_.]+/g, ' ').trim();

  let candidates: any[] = [];

  // Stage 1: Try direct substring or word pattern
  const words = decodedKey.split(/[-_.\s]+/).filter(Boolean);
  const searchPatterns = [
    cleanSearch,
    words.length > 1 ? words.join('%') : null,
    decodedKey.length >= 3 ? decodedKey.slice(0, 4) : null,
  ].filter(Boolean) as string[];

  for (const pattern of searchPatterns) {
    const { data: matched } = await supabase
      .from('products')
      .select(DETAIL_COLUMNS)
      .eq('is_deleted', false)
      .ilike('name', `%${pattern}%`)
      .limit(20);

    if (matched && matched.length > 0) {
      candidates = matched;
      break;
    }
  }

  // Stage 2: Fallback to recent 50 active products
  if (!candidates.length) {
    const { data: recent } = await supabase
      .from('products')
      .select(DETAIL_COLUMNS)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50);
    candidates = recent || [];
  }

  // Exact matching against candidates
  const exact = candidates.find((p: any) => {
    const slug = getProductSlug(p.name || '').toLowerCase();
    const raw = (p.name || '').toLowerCase().trim();
    const alphanumeric = raw.replace(/[^a-z0-9]/g, '');
    const customSlug = ((p as any).slug || '').toLowerCase();

    return (
      p.id === key ||
      slug === decodedKey ||
      raw === decodedKey ||
      customSlug === decodedKey ||
      alphanumeric === normalizedKey ||
      slug.replace(/-/g, '') === normalizedKey
    );
  });

  return exact || (candidates.length > 0 && cleanSearch.length > 3 ? candidates[0] : null);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = new URL(request.url).searchParams.get('userId');
    const key = decodeURIComponent(id).toLowerCase().trim();

    const cacheKey = `product_detail_${key}`;
    const product = await cached<any | null>(cacheKey, 60, () => fetchProductByKey(key));

    if (!product || product.is_deleted) {
      return apiFailure('Product not found', 404);
    }

    let hasUpvoted = false;
    if (userId) {
      const upvotesKey = `upvotes:user:${userId}`;
      let upvoteIds = await getCachedData<string[]>(upvotesKey);
      if (!upvoteIds) {
        const supabase = await createServerSupabaseClient();
        const { data: upvotes } = await supabase
          .from('upvotes')
          .select('product_id')
          .eq('user_id', userId)
          .limit(2000);
        upvoteIds = (upvotes || []).map((u: any) => u.product_id);
        await setCachedData(upvotesKey, upvoteIds, 30);
      }
      hasUpvoted = new Set(upvoteIds).has(product.id);
    }

    return apiSuccessSecure({ ...product, has_upvoted: hasUpvoted }, 200, PUBLIC_CACHE_HEADERS);
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

    const patch = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)));

    const supabase = await createServerSupabaseClient();
    const { data: updated, error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select(DETAIL_COLUMNS)
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    await Promise.all([
      invalidateCachePattern('redis_products_'),
      invalidateCache('public_products'),
      invalidateCache('product_slug_map'),
      invalidateCache(`product_detail_${id.toLowerCase()}`),
      updated?.id ? invalidateCache(`product_detail_${updated.id.toLowerCase()}`) : Promise.resolve(),
      updated?.name ? invalidateCache(`product_detail_${getProductSlug(updated.name).toLowerCase()}`) : Promise.resolve(),
      bumpFeedVersion(),
    ]);

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
    const isUuid = UUID_RE.test(id);
    if (!isUuid) {
      return apiFailure('Invalid product ID', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return apiFailure(error.message, 500);
    }

    await Promise.all([
      invalidateCachePattern('redis_products_'),
      invalidateCache('public_products'),
      invalidateCache('product_slug_map'),
      invalidateCache(`product_detail_${id.toLowerCase()}`),
      bumpFeedVersion(),
    ]);

    return apiSuccessSecure({ deleted: true }, 200);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete product', 500);
  }
}

