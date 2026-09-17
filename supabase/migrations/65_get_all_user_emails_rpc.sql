-- Migration: 65_get_all_user_emails_rpc.sql
-- Description: Create security definer function to return all registered user emails from auth.users, profiles, and newsletter subscriptions

CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE (email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT u.email::text
  FROM auth.users u
  WHERE u.email IS NOT NULL AND u.email LIKE '%@%'
  
  UNION
  
  SELECT DISTINCT p.work_email::text
  FROM public.profiles p
  WHERE p.work_email IS NOT NULL AND p.work_email LIKE '%@%'
  
  UNION
  
  SELECT DISTINCT n.email::text
  FROM public.newsletter_subscriptions n
  WHERE n.email IS NOT NULL AND n.email LIKE '%@%';
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO service_role;
