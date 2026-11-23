-- ============================================================================
-- Migration 99: High-Performance Database Indexes for Product API Queries
-- Minimizes database CPU, memory load, and latency across all product endpoints
-- ============================================================================

DO $$
BEGIN

  -- 1. Composite Partial Index: Active Products sorted by Upvotes & Comments (Trending / Top Feeds)
  CREATE INDEX IF NOT EXISTS idx_products_active_upvotes_desc
    ON public.products (upvotes_count DESC, comments_count DESC, created_at DESC)
    WHERE is_deleted = false;

  -- 2. Composite Partial Index: Active Products sorted by Creation Time (Today / Recent Feeds)
  CREATE INDEX IF NOT EXISTS idx_products_active_created_at_desc
    ON public.products (created_at DESC)
    WHERE is_deleted = false;

  -- 3. Composite Partial Index: Scheduled / Upcoming Product Launches
  CREATE INDEX IF NOT EXISTS idx_products_scheduled_lookup
    ON public.products (scheduled_for ASC, created_at ASC)
    WHERE is_deleted = false AND (status = 'scheduled' OR scheduled_for IS NOT NULL);

  -- 4. Composite Partial Index: Category Filtering with Upvote Ordering
  CREATE INDEX IF NOT EXISTS idx_products_category_active
    ON public.products (category, upvotes_count DESC)
    WHERE is_deleted = false AND category IS NOT NULL;

  -- 5. Composite Partial Index: Maker Profile Product Portfolio
  CREATE INDEX IF NOT EXISTS idx_products_maker_active
    ON public.products (maker_id, created_at DESC)
    WHERE is_deleted = false;

  -- 6. Composite Partial Index: Featured & Editorial Product Feed
  CREATE INDEX IF NOT EXISTS idx_products_featured_active
    ON public.products (featured, featured_at DESC, upvotes_count DESC)
    WHERE is_deleted = false AND featured = true;

  -- 7. Composite Index: User Upvotes Lookup (Fast batch resolution for has_upvoted)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'upvotes') THEN
    CREATE INDEX IF NOT EXISTS idx_upvotes_user_product_composite
      ON public.upvotes (user_id, product_id, created_at DESC);
  END IF;

  -- 8. Composite Partial Index: Product Comments Hierarchy & Timeline
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    CREATE INDEX IF NOT EXISTS idx_comments_product_hierarchy
      ON public.comments (product_id, parent_id, created_at DESC)
      WHERE product_id IS NOT NULL;
  END IF;

  -- 9. Composite Partial Index: Product Reviews (Rating + Recency)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_product_rating_date
      ON public.reviews (product_id, rating DESC, created_at DESC)
      WHERE product_id IS NOT NULL;
  END IF;

  -- 10. Composite Index: Product Alternatives
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alternatives') THEN
    CREATE INDEX IF NOT EXISTS idx_alternatives_product_votes
      ON public.alternatives (product_id, votes_count DESC);
  END IF;

  -- 11. Composite Index: Product Team Members / Collaborators
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_members') THEN
    CREATE INDEX IF NOT EXISTS idx_product_members_lookup
      ON public.product_members (product_id, user_id);
  END IF;

  -- 12. Composite Index: Product Followers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_followers') THEN
    CREATE INDEX IF NOT EXISTS idx_product_followers_lookup
      ON public.product_followers (product_id, user_id);
  END IF;

  -- 13. Index: Anti-Fraud Velocity Flags for Fast Admin Monitoring
  CREATE INDEX IF NOT EXISTS idx_products_fraud_velocity
    ON public.products (vote_velocity_flag, upvotes_count DESC)
    WHERE vote_velocity_flag = true AND is_deleted = false;

END $$;
