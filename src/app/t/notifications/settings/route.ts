import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { UserNotificationSettings } from '@/types';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  user_id: 'default',
  product_updates_inapp: true,
  forum_threads_inapp: true,
  forum_status_inapp: true,
  comment_digest_inapp: true,
  maker_reports_inapp: true,
  product_feedback_inapp: true,
  personal_achievements_inapp: true,
  product_recognitions_inapp: true,
  discovery_notifications: true,
  new_followers_inapp: true,
  new_followers_push: true,
  friend_posts_inapp: true,
  friend_posts_push: true,
  mentions_inapp: true,
  mentions_push: true,
  unsubscribe_all: false,
  auto_follow_commenting: true,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return apiSuccessSecure({ ...DEFAULT_USER_NOTIFICATION_SETTINGS, user_id: 'guest' });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      return apiSuccessSecure(data as UserNotificationSettings);
    }

    return apiSuccessSecure({ ...DEFAULT_USER_NOTIFICATION_SETTINGS, user_id: userId });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to fetch notification settings', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...settings } = body;
    if (!userId) return apiFailure('Missing userId', 400);

    const updated: UserNotificationSettings = {
      ...DEFAULT_USER_NOTIFICATION_SETTINGS,
      ...settings,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    const supabase = await createServerSupabaseClient();
    await supabase
      .from('user_notification_settings')
      .upsert(updated, { onConflict: 'user_id' });

    return apiSuccessSecure(updated);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to update notification settings', 500);
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
