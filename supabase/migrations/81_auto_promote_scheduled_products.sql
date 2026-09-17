-- Migration 81: Automatic Promotion of Scheduled Products to 'live'
-- Provides a stored function that updates all products whose scheduled launch time has arrived

CREATE OR REPLACE FUNCTION public.promote_scheduled_products()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  promoted_count integer;
BEGIN
  UPDATE public.products
  SET status = 'live'
  WHERE status = 'scheduled'
    AND scheduled_for IS NOT NULL
    AND scheduled_for <= NOW();

  GET DIAGNOSTICS promoted_count = ROW_COUNT;
  RETURN promoted_count;
END;
$$;

-- Allow public / authenticated execution
GRANT EXECUTE ON FUNCTION public.promote_scheduled_products() TO authenticated, anon, service_role;

-- Run once immediately to promote any existing past scheduled products
SELECT public.promote_scheduled_products();
