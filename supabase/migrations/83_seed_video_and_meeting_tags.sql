-- Migration 83: Seed Video Conferencing, Video & Voice Calling, and Meeting Software launch tags

INSERT INTO public.launch_tags (name, slug, category, icon, is_popular, is_active)
VALUES
  ('Video Conferencing', 'video-conferencing', 'Productivity & Core Software', '🎥', true, true),
  ('Video and Voice Calling', 'video-voice-calling', 'Productivity & Core Software', '📞', false, true),
  ('Meeting Software', 'meeting-software', 'Productivity & Core Software', '📹', false, true)
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_popular = EXCLUDED.is_popular,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
