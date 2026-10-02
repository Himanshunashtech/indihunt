-- Migration 101: Drop redundant upvote triggers and recalculate exact counts
-- Reason: Upvote and thread-upvote counts are already tracked with exact count queries in Next.js API routes (/t/products/[id]/upvote, /t/threads/[id]/upvote).
-- Having database triggers incrementing/decrementing upvotes_count caused double-counting (1 + 1 = 2) on product submission.

-- 1. Drop old upvote triggers on public.upvotes
DROP TRIGGER IF EXISTS on_upvote_change ON public.upvotes;
DROP TRIGGER IF EXISTS on_upvote_added ON public.upvotes;
DROP TRIGGER IF EXISTS on_upvote_removed ON public.upvotes;
DROP FUNCTION IF EXISTS public.handle_new_upvote() CASCADE;
DROP FUNCTION IF EXISTS public.handle_upvote_changes() CASCADE;

-- 2. Drop old upvote triggers on public.thread_upvotes
DROP TRIGGER IF EXISTS on_thread_upvote_added ON public.thread_upvotes;
DROP TRIGGER IF EXISTS on_thread_upvote_removed ON public.thread_upvotes;
DROP FUNCTION IF EXISTS public.handle_new_thread_upvote() CASCADE;

-- 3. Clean up upvotes for pre-launch/scheduled products (scheduled in future)
DELETE FROM public.upvotes
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE status = 'scheduled' AND scheduled_for > now()
);

-- 4. Reset upvotes_count to 0 for scheduled products that haven't launched yet
UPDATE public.products
SET upvotes_count = 0
WHERE status = 'scheduled' AND scheduled_for > now();

-- 5. Recalculate exact upvotes_count for all other products based on actual records in public.upvotes
UPDATE public.products p
SET upvotes_count = COALESCE(
  (
    SELECT COUNT(*)::integer
    FROM public.upvotes u
    WHERE u.product_id = p.id
  ),
  0
)
WHERE NOT (p.status = 'scheduled' AND p.scheduled_for > now());

-- 6. Recalculate exact upvotes_count for all threads based on public.thread_upvotes
UPDATE public.threads t
SET upvotes_count = COALESCE(
  (
    SELECT COUNT(*)::integer
    FROM public.thread_upvotes tu
    WHERE tu.thread_id = t.id
  ),
  0
);

-- 7. Update profile karma points according to actual product upvotes received
UPDATE public.profiles p
SET karma_points = COALESCE(
  (
    SELECT SUM(prod.upvotes_count)::integer
    FROM public.products prod
    WHERE prod.maker_id = p.id
  ),
  0
);
