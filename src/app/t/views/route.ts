import { NextRequest, after } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { itemId, itemType, userId, type } = body;

  // Immediately respond so views/clicks never block page render
  after(async () => {
    try {
      const supabase = await createServerSupabaseClient();

      // If click increment
      if (type === 'click' && itemId) {
        const { data } = await supabase.from('products').select('clicks_count').eq('id', itemId).single();
        if (data) {
          await supabase.from('products').update({ clicks_count: (data.clicks_count || 0) + 1 }).eq('id', itemId);
        }
        return;
      }

      if (!itemId || !itemType) return;

      // Attempt RPC first
      try {
        const { error: rpcError } = await supabase.rpc('record_view', {
          p_item_type: itemType,
          p_item_id: itemId,
          p_viewer_id: userId || null,
        });
        if (!rpcError) return;
      } catch { }

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
    } catch (err) {
      console.warn('[Views] Background view record error:', err);
    }
  });

  return apiSuccessSecure({ success: true, itemId, itemType: itemType || type || 'view' });
}
