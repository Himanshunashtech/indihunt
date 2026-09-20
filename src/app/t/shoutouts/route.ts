import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/shoutouts?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('product_id');

    if (!productId) return apiFailure('productId is required', 400);

    const cacheKey = `shoutouts:${productId}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) return apiSuccess(cached);

    const supabase = await createServerSupabaseClient();
    const { data: shoutouts, error } = await supabase
      .from('product_shoutouts')
      .select('*, shouted_product:products!shouted_product_id(id, name, tagline, logo_url, website_url, upvotes_count)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) return apiFailure(error.message, 500);

    const list = shoutouts || [];
    await setCachedData(cacheKey, list, 300);
    return apiSuccess(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch shoutouts', 500);
  }
}

// GET /t/shoutouts?shouted_product_id=xxx — products that shouted this product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, product_id, shoutouts } = body;
    const pId = productId || product_id;

    if (!pId || !Array.isArray(shoutouts)) return apiFailure('productId and shoutouts[] are required', 400);

    const supabase = await createServerSupabaseClient();

    // Replace all shoutouts for this product
    await supabase.from('product_shoutouts').delete().eq('product_id', pId);

    if (shoutouts.length > 0) {
      const rows = shoutouts.map((s: any) => ({
        product_id: pId,
        shouted_product_id: s.shouted_product_id,
        name: s.name || null,
        logo_url: s.logo_url || null,
        note: s.note || null,
      }));
      const { error } = await supabase.from('product_shoutouts').insert(rows);
      if (error) return apiFailure(error.message, 500);
    }

    await invalidateCache(`shoutouts:${pId}`);
    return apiSuccess({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to save shoutouts', 500);
  }
}
