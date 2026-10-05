import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { DEFAULT_STORIES, getProductSlug } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return apiFailure('Invalid story ID', 400);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const supabase = await createServerSupabaseClient();
    let story: any = null;

    if (isUuid) {
      const { data } = await supabase
        .from('stories')
        .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
        .eq('id', id)
        .maybeSingle();
      story = data;
    }

    if (!story) {
      const decoded = decodeURIComponent(id).toLowerCase().trim();
      const cleanSearch = decoded.replace(/-/g, ' ');
      const { data: dbMatches } = await supabase
        .from('stories')
        .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
        .ilike('title', `%${cleanSearch}%`)
        .limit(10);

      if (dbMatches && dbMatches.length > 0) {
        story = dbMatches.find(
          (s: any) =>
            getProductSlug(s.title).toLowerCase() === decoded ||
            s.title.toLowerCase() === decoded ||
            s.id === id
        ) || dbMatches[0];
      }
    }

    if (!story) {
      const targetSlug = decodeURIComponent(id).toLowerCase().trim();
      const demoFound = DEFAULT_STORIES.find(
        (s) =>
          s.id === id ||
          getProductSlug(s.title).toLowerCase() === targetSlug ||
          s.title.toLowerCase() === targetSlug
      );
      if (demoFound) story = demoFound;
    }

    if (!story) {
      return apiFailure('Story not found', 404);
    }

    return apiSuccessSecure(story);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch story', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (error) {
      return apiFailure(error.message, 500);
    }
    return apiSuccessSecure({ success: true, deleted: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete story', 500);
  }
}

