import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/alternatives?productId=xxx&userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('product_id');
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    if (!productId) return apiFailure('productId is required', 400);

    const cacheKey = `alternatives:${productId}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) {
      // Attach has_voted per user if userId provided
      if (userId) {
        const supabase = await createServerSupabaseClient();
        const { data: votes } = await supabase
          .from('product_alternative_votes')
          .select('alternative_id')
          .eq('user_id', userId);
        const votedIds = new Set((votes || []).map((v: any) => v.alternative_id));
        return apiSuccess(cached.map((a: any) => ({ ...a, has_voted: votedIds.has(a.id) })));
      }
      return apiSuccess(cached);
    }

    const supabase = await createServerSupabaseClient();
    const { data: alternatives, error } = await supabase
      .from('product_alternatives')
      .select('*, alternative_product:products!alternative_id(id, name, tagline, logo_url, website_url, upvotes_count, category), created_by_user:profiles!created_by(id, username, full_name, avatar_url)')
      .eq('product_id', productId)
      .order('votes_count', { ascending: false });

    if (error) return apiFailure(error.message, 500);

    const list = alternatives || [];
    await setCachedData(cacheKey, list, 300);

    if (userId) {
      const { data: votes } = await supabase
        .from('product_alternative_votes')
        .select('alternative_id')
        .eq('user_id', userId);
      const votedIds = new Set((votes || []).map((v: any) => v.alternative_id));
      return apiSuccess(list.map((a: any) => ({ ...a, has_voted: votedIds.has(a.id) })));
    }

    return apiSuccess(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch alternatives', 500);
  }
}

// POST /t/alternatives — add alternative OR toggle vote
// body: { action: 'add' | 'vote', productId, alternativeId, userId, ... }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, product_id, alternativeId, alternative_id, userId, user_id } = body;
    const pId = productId || product_id;
    const altId = alternativeId || alternative_id;
    const uId = userId || user_id;

    if (!pId || !uId) return apiFailure('productId and userId are required', 400);

    const supabase = await createServerSupabaseClient();

    // Toggle vote on existing alternative
    if (action === 'vote' && altId) {
      const { data: existing } = await supabase
        .from('product_alternative_votes')
        .select('id')
        .eq('alternative_id', altId)
        .eq('user_id', uId)
        .maybeSingle();

      if (existing) {
        await supabase.from('product_alternative_votes').delete().eq('id', existing.id);
      } else {
        await supabase.from('product_alternative_votes').insert({ alternative_id: altId, user_id: uId });
      }

      const { data: alt } = await supabase
        .from('product_alternatives')
        .select('votes_count')
        .eq('id', altId)
        .single();

      await invalidateCache(`alternatives:${pId}`);
      return apiSuccess({ success: true, votes_count: alt?.votes_count || 0, has_voted: !existing });
    }

    // Add new alternative
    const { alternativeProductId, note } = body;
    if (!alternativeProductId) return apiFailure('alternativeProductId is required for action=add', 400);

    const { data: newAlt, error } = await supabase
      .from('product_alternatives')
      .insert({ product_id: pId, alternative_id: alternativeProductId, created_by: uId, note: note || null, votes_count: 1 })
      .select('*, alternative_product:products!alternative_id(id, name, tagline, logo_url, website_url, upvotes_count, category)')
      .single();

    if (error) return apiFailure(error.message, 500);

    // Auto-vote by the creator
    await supabase.from('product_alternative_votes').insert({ alternative_id: newAlt.id, user_id: uId });
    await invalidateCache(`alternatives:${pId}`);

    return apiSuccess({ ...newAlt, has_voted: true }, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to handle alternative', 500);
  }
}

// DELETE /t/alternatives?id=xxx&productId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const productId = searchParams.get('productId') || searchParams.get('product_id');

    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('product_alternatives').delete().eq('id', id);
    if (error) return apiFailure(error.message, 500);

    if (productId) await invalidateCache(`alternatives:${productId}`);
    return apiSuccess({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete alternative', 500);
  }
}
