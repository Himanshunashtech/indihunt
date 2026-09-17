import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: thread, error } = await supabase
      .from('threads')
      .select('id, title, body, category, product_id, upvotes_count, comments_count, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .eq('id', id)
      .maybeSingle();

    if (error || !thread) {
      return apiFailure('Thread not found', 404);
    }

    return apiSuccess(thread);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch thread', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from('threads').delete().eq('id', id);
    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccess(undefined, 200);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete thread', 500);
  }
}
