import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!userId || !productId || !isUuid) {
      return apiFailure('Valid userId and productId are required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from('upvotes')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle();

    let hasUpvoted = false;

    if (existing) {
      await supabase.from('upvotes').delete().eq('id', existing.id);
      hasUpvoted = false;
    } else {
      await supabase.from('upvotes').insert({ product_id: productId, user_id: userId });
      hasUpvoted = true;
    }

    const { count } = await supabase
      .from('upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    const updatedCount = count ?? (hasUpvoted ? 1 : 0);

    await supabase
      .from('products')
      .update({ upvotes_count: updatedCount })
      .eq('id', productId);

    return apiSuccess({
      has_upvoted: hasUpvoted,
      upvotes_count: updatedCount,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle upvote', 500);
  }
}
