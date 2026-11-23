import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, views_count, clicks_count, upvotes_count, comments_count, created_at')
      .eq('id', id)
      .single();

    if (error || !product) {
      return apiFailure('Product analytics not found', 404);
    }

    const views = product.views_count || 0;
    const clicks = product.clicks_count || 0;
    const upvotes = product.upvotes_count || 0;
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';
    const conversion = views > 0 ? ((upvotes / views) * 100).toFixed(1) : '0.0';

    return apiSuccessSecure({
      productId: product.id,
      name: product.name,
      viewsCount: views,
      clicksCount: clicks,
      upvotesCount: upvotes,
      commentsCount: product.comments_count || 0,
      clickThroughRate: `${ctr}%`,
      upvoteRate: `${conversion}%`,
      createdAt: product.created_at,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch product analytics', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const type = body?.type || 'view'; // 'view' or 'click'

    const supabase = await createServerSupabaseClient();
    const colName = type === 'click' ? 'clicks_count' : 'views_count';

    const { data: prod } = await supabase
      .from('products')
      .select(colName)
      .eq('id', id)
      .single();

    const nextCount = ((prod as any)?.[colName] || 0) + 1;

    await supabase
      .from('products')
      .update({ [colName]: nextCount })
      .eq('id', id);

    return apiSuccessSecure({ recorded: true, type, count: nextCount });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to record analytics event', 500);
  }
}
