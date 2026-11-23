-- Migration 61: Add github_url to profiles and update anonymization function

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Update the anonymization function to clean up github_url as well
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
    github_url = NULL,
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
