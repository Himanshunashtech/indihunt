-- ── Migration 53: Notifications & User Notification Settings ────────────────

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create User Notification Settings Table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_updates_inapp BOOLEAN DEFAULT true,
  forum_threads_inapp BOOLEAN DEFAULT true,
  forum_status_inapp BOOLEAN DEFAULT true,
  comment_digest_inapp BOOLEAN DEFAULT true,
  maker_reports_inapp BOOLEAN DEFAULT true,
  product_feedback_inapp BOOLEAN DEFAULT true,
  personal_achievements_inapp BOOLEAN DEFAULT true,
  product_recognitions_inapp BOOLEAN DEFAULT true,
  discovery_notifications BOOLEAN DEFAULT true,
  new_followers_inapp BOOLEAN DEFAULT true,
  new_followers_push BOOLEAN DEFAULT true,
  friend_posts_inapp BOOLEAN DEFAULT true,
  friend_posts_push BOOLEAN DEFAULT true,
  mentions_inapp BOOLEAN DEFAULT true,
  mentions_push BOOLEAN DEFAULT true,
  unsubscribe_all BOOLEAN DEFAULT false,
  auto_follow_commenting BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications read status"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for user_notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON public.user_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own notification settings"
  ON public.user_notification_settings FOR ALL
  USING (auth.uid() = user_id);
