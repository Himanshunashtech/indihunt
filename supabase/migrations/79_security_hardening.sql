-- Migration 79: Security Hardening & Moderation Triggers

-- 1. Protect User Email Exposure RPC
REVOKE EXECUTE ON FUNCTION public.get_all_user_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO service_role;

-- 2. Harden Account Anonymization and Deletion
CREATE OR REPLACE FUNCTION public.anonymize_and_delete_account(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Authorization Check: Must be owner or admin
  IF auth.uid() <> target_user_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized to delete this account.' USING ERRCODE = '42501';
  END IF;

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

  RETURN TRUE;
END;
$$;

-- 3. Harden User Streak Updates
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_date DATE;
  v_current_streak INTEGER;
BEGIN
  -- Authorization Check: Must be owner or admin
  IF auth.uid() <> p_user_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized to update streak for this user.' USING ERRCODE = '42501';
  END IF;

  -- Get current streak info
  SELECT last_active_date, streak_count
  INTO v_last_date, v_current_streak
  FROM public.profiles
  WHERE id = p_user_id;

  -- If already active today, do nothing
  IF v_last_date = v_today THEN
    RETURN;
  END IF;

  -- Insert visit record (ignore if already exists)
  INSERT INTO public.user_streak_history (user_id, visited_date)
  VALUES (p_user_id, v_today)
  ON CONFLICT (user_id, visited_date) DO NOTHING;

  -- Calculate new streak
  IF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day — increment
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Streak broken or first visit
    v_current_streak := 1;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET streak_count = v_current_streak,
      last_active_date = v_today
  WHERE id = p_user_id;
END;
$$;

-- 4. Content Moderation Trigger Function
CREATE OR REPLACE FUNCTION public.check_content_violation_trigger()
RETURNS TRIGGER AS $$
DECLARE
  content_to_check TEXT := '';
  pros_text TEXT := '';
  cons_text TEXT := '';
BEGIN
  -- 1. Gather all content to validate based on table
  IF TG_TABLE_NAME = 'comments' THEN
    content_to_check := COALESCE(NEW.body, '');
  ELSIF TG_TABLE_NAME = 'threads' THEN
    content_to_check := COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.body, '');
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    -- Convert text arrays to space-separated text
    IF NEW.pros IS NOT NULL THEN
      pros_text := ARRAY_TO_STRING(NEW.pros, ' ');
    END IF;
    IF NEW.cons IS NOT NULL THEN
      cons_text := ARRAY_TO_STRING(NEW.cons, ' ');
    END IF;
    content_to_check := COALESCE(NEW.body, '') || ' ' || COALESCE(NEW.alternatives_vs, '') || ' ' || pros_text || ' ' || cons_text;
  END IF;

  -- 2. Validate links
  IF content_to_check ~* '(https?://|www\.|[a-zA-Z0-9.-]+\.(com|net|org|io|co)\y)' THEN
    RAISE EXCEPTION 'Community Guidelines Violation: Links or external website references are not allowed.'
      USING ERRCODE = '45000';
  END IF;

  -- 3. Validate spam keywords
  IF content_to_check ~* '(buy now|discount code|promo code|special offer|limited offer|get rich|earn money|cryptocurrency investment|click here|visit my website|visit our site|free giveaway|make money fast|subscribe to|check out my channel)' THEN
    RAISE EXCEPTION 'Community Guidelines Violation: Content contains promotional phrasing resembling advertising.'
      USING ERRCODE = '45000';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind Triggers to Tables
DROP TRIGGER IF EXISTS comments_moderation_trigger ON public.comments;
CREATE TRIGGER comments_moderation_trigger
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_content_violation_trigger();

DROP TRIGGER IF EXISTS threads_moderation_trigger ON public.threads;
CREATE TRIGGER threads_moderation_trigger
  BEFORE INSERT OR UPDATE ON public.threads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_content_violation_trigger();

DROP TRIGGER IF EXISTS reviews_moderation_trigger ON public.reviews;
CREATE TRIGGER reviews_moderation_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_content_violation_trigger();
