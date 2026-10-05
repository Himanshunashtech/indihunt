-- ============================================================
-- Migration 102: Diagnostic — List ALL active triggers on upvotes table
-- Run this FIRST in Supabase SQL Editor to see what triggers exist
-- before applying the fix in migration 103.
-- ============================================================

-- 1. All triggers on the upvotes table
SELECT 
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement AS executes
FROM information_schema.triggers
WHERE event_object_table = 'upvotes'
  AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 2. All trigger functions related to upvotes
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%upvote%' 
    OR p.proname LIKE '%increment_product%'
    OR p.proname LIKE '%decrement_product%'
  )
ORDER BY p.proname;

-- 3. Products where stored count doesn't match actual upvote rows
SELECT 
  p.id,
  p.name,
  p.upvotes_count AS stored_count,
  COALESCE(u.actual_count, 0) AS actual_count,
  p.upvotes_count - COALESCE(u.actual_count, 0) AS difference
FROM public.products p
LEFT JOIN (
  SELECT product_id, COUNT(*)::integer AS actual_count
  FROM public.upvotes
  GROUP BY product_id
) u ON u.product_id = p.id
WHERE p.upvotes_count != COALESCE(u.actual_count, 0)
ORDER BY ABS(p.upvotes_count - COALESCE(u.actual_count, 0)) DESC;
