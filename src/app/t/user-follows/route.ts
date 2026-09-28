import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/user-follows?followerId=xxx&followingId=yyy OR ?userId=xxx&type=followers|following
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'followers';

    const supabase = await createServerSupabaseClient();

    // Check single follow status
    if (followerId && followingId) {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) {
        return apiFailure(error.message, 500);
      }

      return apiSuccessSecure({ isFollowing: !!data });
    }

    // List followers or following
    if (userId) {
      if (type === 'followers') {
        const { data, error } = await supabase
          .from('user_follows')
          .select('follower:profiles!follower_id(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
          .eq('following_id', userId);

        if (error) return apiFailure(error.message, 500);
        const list = (data || []).map((f: any) => f.follower).filter(Boolean);
        return apiSuccessSecure(list);
      } else {
        const { data, error } = await supabase
          .from('user_follows')
          .select('following:profiles!following_id(id, username, full_name, avatar_url, headline, karma_points, is_maker)')
          .eq('follower_id', userId);

        if (error) return apiFailure(error.message, 500);
        const list = (data || []).map((f: any) => f.following).filter(Boolean);
        return apiSuccessSecure(list);
      }
    }

    return apiFailure('Missing query parameters', 400);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch follow data', 500);
  }
}

// POST /t/user-follows
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followingId, isCurrentlyFollowing } = body;

    if (!followerId || !followingId) {
      return apiFailure('followerId and followingId are required', 400);
    }

    const supabase = await createServerSupabaseClient();

    if (isCurrentlyFollowing) {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ isFollowing: false });
    } else {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: followerId, following_id: followingId });

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ isFollowing: true });
    }
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to toggle follow status', 500);
  }
}
