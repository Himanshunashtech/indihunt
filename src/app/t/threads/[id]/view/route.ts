import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: thread } = await supabase
      .from('threads')
      .select('views_count')
      .eq('id', id)
      .single();

    const nextViews = ((thread as any)?.views_count || 0) + 1;

    await supabase
      .from('threads')
      .update({ views_count: nextViews })
      .eq('id', id);

    return apiSuccessSecure({ success: true, viewsCount: nextViews });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to record thread view', 500);
  }
}
