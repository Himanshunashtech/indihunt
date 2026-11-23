import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return apiSuccessSecure({
        authenticated: false,
        profile: null,
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, followers_count, is_maker')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({
      authenticated: !!profile,
      profile: profile || null,
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Session query failed', 500);
  }
}
