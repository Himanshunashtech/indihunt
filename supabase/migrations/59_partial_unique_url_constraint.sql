-- Migration 59: Make website_url unique constraint partial (non-deleted only)
-- This allows re-submission of the same URL after a product is soft-deleted.

-- Drop the old blanket unique constraint
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_website_url_key;

-- Create a partial unique index — only enforces uniqueness on active (non-deleted) products.
-- Soft-deleted products (is_deleted = true) are excluded, so their URLs can be reused.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_website_url_active
  ON public.products (website_url)
  WHERE is_deleted IS NOT TRUE AND website_url IS NOT NULL;
