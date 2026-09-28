import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemType, userId, type } = body;

    const supabase = await createServerSupabaseClient();

    // If click increment
    if (type === 'click' && itemId) {
      const { data } = await supabase.from('products').select('clicks_count').eq('id', itemId).single();
      if (data) {
        await supabase.from('products').update({ clicks_count: (data.clicks_count || 0) + 1 }).eq('id', itemId);
      }
      return apiSuccessSecure({ success: true, itemId, type: 'click' });
    }

    if (!itemId || !itemType) {
      return apiFailure('Missing itemId or itemType', 400);
    }

    // Attempt RPC first
    try {
      const { error: rpcError } = await supabase.rpc('record_view', {
        p_item_type: itemType,
        p_item_id: itemId,
        p_viewer_id: userId || null,
      });
      if (!rpcError) {
        return apiSuccessSecure({ success: true, itemId, itemType });
      }
    } catch (e) { }

    // Direct fallback
    if (itemType === 'product') {
      const { data } = await supabase.from('products').select('views_count').eq('id', itemId).single();
      const nextCount = (data?.views_count || 0) + 1;
      await supabase.from('products').update({ views_count: nextCount }).eq('id', itemId);
    } else if (itemType === 'thread') {
      const { data } = await supabase.from('threads').select('views_count').eq('id', itemId).single();
      const nextCount = (data?.views_count || 0) + 1;
      await supabase.from('threads').update({ views_count: nextCount }).eq('id', itemId);
    } else if (itemType === 'review') {
      const { data } = await supabase.from('reviews').select('views').eq('id', itemId).single();
      const nextCount = (data?.views || 0) + 1;
      await supabase.from('reviews').update({ views: nextCount }).eq('id', itemId);
    }

    return apiSuccessSecure({ success: true, itemId, itemType });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to record view', 500);
  }
}
