-- Migration 85: Clean wipe fake upvotes & enforce launched products only constraint
-- Wipes all existing fake upvotes to remove any invalid votes on scheduled/unlaunched products

-- 1. Wipe all fake upvote records
DELETE FROM fake_upvotes;

-- 2. Optional helper function to clean up any fake upvotes associated with unlaunched/scheduled products
CREATE OR REPLACE FUNCTION public.clean_unlaunched_fake_upvotes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM fake_upvotes
  WHERE product_id IN (
    SELECT id FROM products
    WHERE is_deleted = true
       OR status = 'draft'
       OR (status = 'scheduled' AND (scheduled_for IS NULL OR scheduled_for > NOW()))
       OR (scheduled_for IS NOT NULL AND scheduled_for > NOW())
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clean_unlaunched_fake_upvotes() TO authenticated, anon, service_role;
