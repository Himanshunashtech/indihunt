import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const forumId = searchParams.get('forumId');

    const supabase = await createServerSupabaseClient();

    if (forumId && !userId) {
      const { count, error } = await supabase
        .from('forum_follows')
        .select('id', { count: 'exact', head: true })
        .eq('forum_id', forumId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ count: count || 0 });
    }

    if (userId) {
      const { data, error } = await supabase
        .from('forum_follows')
        .select('forum_id')
        .eq('user_id', userId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure((data || []).map(item => item.forum_id));
    }

    return apiFailure('Missing userId or forumId', 400);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch forum follows', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { forumId, userId } = body;

    if (!forumId || !userId) {
      return apiFailure('Missing forumId or userId', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from('forum_follows')
      .select('id')
      .eq('forum_id', forumId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('forum_follows')
        .delete()
        .eq('id', existing.id);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ success: true, followed: false });
    } else {
      const { error } = await supabase
        .from('forum_follows')
        .insert({ forum_id: forumId, user_id: userId });

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ success: true, followed: true });
    }
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle forum follow', 500);
  }
}
