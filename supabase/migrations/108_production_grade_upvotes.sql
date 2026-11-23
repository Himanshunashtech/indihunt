-- Migration 108: Production-Grade Product Hunt Upvote System
-- 1. Deterministic Feed Index for Pagination & Ranking
-- 2. Performance indexes on upvotes table
-- 3. Atomic database-level RPC function for toggle_product_upvote

-- 1. Ensure upvotes table has the required constraints and indexes
ALTER TABLE IF EXISTS public.upvotes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Add unique constraint if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_product_user_upvote'
  ) THEN
    BEGIN
      ALTER TABLE public.upvotes 
        ADD CONSTRAINT unique_product_user_upvote UNIQUE (product_id, user_id);
    EXCEPTION WHEN duplicate_object OR duplicate_table THEN
      -- Already exists
    END;
  END IF;
END;
$$;

-- Ensure fast batch checking index on (user_id, product_id)
CREATE INDEX IF NOT EXISTS idx_upvotes_user_product
  ON public.upvotes (user_id, product_id);

-- Ensure index on (product_id) for count lookups
CREATE INDEX IF NOT EXISTS idx_upvotes_product_id
  ON public.upvotes (product_id);

-- 2. Deterministic composite index on products for server-side pagination & feed ranking
CREATE INDEX IF NOT EXISTS idx_products_feed_ranking
  ON public.products (upvotes_count DESC, created_at DESC, id ASC)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- 3. Recalculate upvotes_count to make sure all products are 100% accurate
UPDATE public.products p
SET upvotes_count = COALESCE(
  (
    SELECT COUNT(*)::integer
    FROM public.upvotes u
    WHERE u.product_id = p.id
  ),
  0
)
WHERE upvotes_count != COALESCE(
  (
    SELECT COUNT(*)::integer
    FROM public.upvotes u
    WHERE u.product_id = p.id
  ),
  0
);

-- 4. Atomic PostgreSQL RPC Function: toggle_product_upvote
-- Executes in a single atomic transaction: checks existence, inserts or deletes,
-- updates product.upvotes_count, and returns the state without race conditions.
CREATE OR REPLACE FUNCTION public.toggle_product_upvote(p_product_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_new_count INTEGER;
  v_has_upvoted BOOLEAN;
BEGIN
  -- Row-level lock on the product to serialize concurrent votes on the same product
  PERFORM 1 FROM public.products WHERE id = p_product_id FOR UPDATE;

  -- Check if upvote already exists
  SELECT EXISTS(
    SELECT 1 FROM public.upvotes 
    WHERE product_id = p_product_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- UNVOTE (Remove vote)
    DELETE FROM public.upvotes 
    WHERE product_id = p_product_id AND user_id = p_user_id;

    UPDATE public.products
    SET upvotes_count = GREATEST(0, (
      SELECT COUNT(*)::integer FROM public.upvotes WHERE product_id = p_product_id
    ))
    WHERE id = p_product_id
    RETURNING upvotes_count INTO v_new_count;

    v_has_upvoted := false;
  ELSE
    -- UPVOTE (Add vote)
    INSERT INTO public.upvotes (product_id, user_id)
    VALUES (p_product_id, p_user_id)
    ON CONFLICT (product_id, user_id) DO NOTHING;

    UPDATE public.products
    SET upvotes_count = GREATEST(0, (
      SELECT COUNT(*)::integer FROM public.upvotes WHERE product_id = p_product_id
    ))
    WHERE id = p_product_id
    RETURNING upvotes_count INTO v_new_count;

    v_has_upvoted := true;
  END IF;

  RETURN jsonb_build_object(
    'productId', p_product_id,
    'has_upvoted', v_has_upvoted,
    'upvotes_count', COALESCE(v_new_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

