-- ============================================================================
-- Migration 97: Drop fake_upvotes table and delete fake upvote settings
-- ============================================================================

-- 1. Drop fake_upvotes table and any associated policies/triggers
DROP TABLE IF EXISTS public.fake_upvotes CASCADE;

-- 2. Clean up fake upvotes feature flags
DELETE FROM public.feature_flags WHERE key = 'fake_upvotes_enabled';

-- 3. Clean up fake upvotes platform configuration settings
DELETE FROM public.platform_settings WHERE key LIKE 'fake_upvotes_%';
