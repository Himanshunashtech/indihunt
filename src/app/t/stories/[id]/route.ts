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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return apiFailure('Invalid story ID', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: story, error } = await supabase
      .from('stories')
      .select('id, title, content, excerpt, image_url, category, user_id, published_at, created_at, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .eq('id', id)
      .single();

    if (error || !story) {
      const { data: fallbackStory, error: fallbackError } = await supabase
        .from('stories')
        .select('id, title, content, excerpt, image_url, category, user_id, published_at, created_at')
        .eq('id', id)
        .maybeSingle();

      if (fallbackError || !fallbackStory) {
        return apiFailure('Story not found', 404);
      }
      return apiSuccess(fallbackStory);
    }

    return apiSuccess(story);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch story', 500);
  }
}
