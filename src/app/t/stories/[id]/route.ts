import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

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
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, karma_points)')
      .eq('id', id)
      .single();

    if (error || !story) {
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

