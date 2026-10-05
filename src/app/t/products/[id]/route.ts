import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache, invalidateCachePattern } from '@/lib/redis';
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

async function resolveProductId(key: string, getDb: () => Promise<any>): Promise<string | null> {
  if (UUID_RE.test(key)) return key;
  let map = await getCachedData<Record<string, string>>('product_slug_map');
  if (map && map[key]) return map[key];

  try {
    const { data } = await (await getDb()).from('products').select('id, name').limit(3000);
    const newMap: Record<string, string> = {};
    (data || []).forEach((p: any) => {
      if (p.name) {
        newMap[getProductSlug(p.name).toLowerCase()] = p.id;
        newMap[p.name.toLowerCase().trim()] = p.id;
        newMap[p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')] = p.id;
        newMap[p.name.toLowerCase().replace(/[^a-z0-9]+/g, '')] = p.id;
      }
      if (p.id) {
        newMap[p.id.toLowerCase()] = p.id;
      }
    });
    await setCachedData('product_slug_map', newMap, 3600);
    return newMap[key] || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = new URL(request.url).searchParams.get('userId');
    const key = decodeURIComponent(id).toLowerCase().trim();

    const supabase = await createServerSupabaseClient();
    const pid = await resolveProductId(key, async () => supabase);
    if (!pid) return apiFailure('Product not found', 404);

    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select(DETAIL_COLUMNS)
      .eq('id', pid)
      .maybeSingle();

    if (prodErr || !product || product.is_deleted) {
      return apiFailure('Product not found', 404);
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

    return apiSuccessSecure({ ...product, has_upvoted: hasUpvoted }, 200);
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
    ]);

    return apiSuccessSecure({ deleted: true }, 200);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete product', 500);
  }
}

