-- Migration 103: Drop redundant upvote count triggers from migration 100
-- Root cause: trg_upvote_insert / trg_upvote_delete (migration 100) increment/decrement
-- upvotes_count via trigger, BUT the API route (/t/products/[id]/upvote) ALSO does
-- SELECT COUNT(*) + UPDATE, causing double-counting (vote shows 1, refresh shows 2).
-- Migration 101 only dropped the OLD triggers (on_upvote_change) but missed these.

-- 1. Drop the redundant product-upvote triggers from migration 100
DROP TRIGGER IF EXISTS trg_upvote_insert ON public.upvotes;
DROP TRIGGER IF EXISTS trg_upvote_delete ON public.upvotes;

-- 2. Drop the corresponding functions
DROP FUNCTION IF EXISTS public.increment_product_upvotes() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_product_upvotes() CASCADE;

-- 3. Safety: also drop any surviving old triggers
DROP TRIGGER IF EXISTS on_upvote_change ON public.upvotes;
DROP TRIGGER IF EXISTS on_upvote_added ON public.upvotes;
DROP TRIGGER IF EXISTS on_upvote_removed ON public.upvotes;
DROP FUNCTION IF EXISTS public.handle_upvote_changes() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_upvote() CASCADE;

-- 4. Recalculate exact upvotes_count for all products
UPDATE public.products p
SET upvotes_count = COALESCE(
  (
    SELECT COUNT(*)::integer
    FROM public.upvotes u
    WHERE u.product_id = p.id
  ),
  0
);

-- 5. Recalculate karma points for all makers
UPDATE public.profiles pr
SET karma_points = COALESCE(
  (
    SELECT SUM(prod.upvotes_count)::integer
    FROM public.products prod
    WHERE prod.maker_id = pr.id
  ),
  0
);
