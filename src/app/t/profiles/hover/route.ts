import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const viewerId = searchParams.get('viewerId');

    if (!userId) {
      return apiFailure('Missing userId parameter', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, followers_count, is_maker, streak_count')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return apiFailure('Profile not found', 404);
    }

    const { count: followersCount } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId);

    let isFollowing = false;
    if (viewerId && viewerId !== userId) {
      const { data: followRecord } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', userId)
        .maybeSingle();

      if (followRecord) {
        isFollowing = true;
      }
    }

    return apiSuccessSecure({
      profile: {
        ...profile,
        followers_count: followersCount ?? profile.followers_count ?? 0,
        karma_points: profile.karma_points ?? 120,
      },
      isFollowing,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Internal server error', 500);
  }
}
