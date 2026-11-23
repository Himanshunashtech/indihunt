-- ── Migration 54: Account Deactivation and PII Anonymization ────────────────

-- 1. Add Deactivation and Deletion Columns to Profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Create Function for Account Anonymization and Deletion
-- Note: PRODUCTS SUBMITTED BY THE USER REMAIN INTACT to preserve community upvotes and links.
CREATE OR REPLACE FUNCTION public.anonymize_and_delete_account(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Anonymize user profile details
  UPDATE public.profiles
  SET 
    full_name = 'Deleted User',
    username = 'deleted_user_' || SUBSTRING(target_user_id::text FROM 1 FOR 8),
    headline = 'Account deleted',
    bio = NULL,
    avatar_url = NULL,
    location = NULL,
    website = NULL,
    linkedin_url = NULL,
    twitter_url = NULL,
    work_email = NULL,
    is_deactivated = true,
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Anonymize thread comments
  UPDATE public.thread_comments
  SET 
    author_name = 'Deleted User',
    author_avatar = NULL,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  -- Anonymize forum threads
  UPDATE public.discussions
  SET 
    author_name = 'Deleted User',
    author_avatar = NULL,
    updated_at = NOW()
  WHERE author_id = target_user_id;

  -- Purge user notification settings and notification inbox
  DELETE FROM public.user_notification_settings WHERE user_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;

  RETURN true;
END;
$$;
