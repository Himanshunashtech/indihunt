-- ============================================================
-- Migration 22: Scalability Indexes for 100k Users
-- Each index is guarded: only runs if the table exists.
-- Safe to run on partial or full schema deployments.
-- ============================================================

DO $$
BEGIN

  -- ──────────────────────────────────────────────────────────
  -- 1. PRODUCTS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN

    CREATE INDEX IF NOT EXISTS idx_products_created_at_desc
      ON public.products (created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_products_maker_id
      ON public.products (maker_id);

    CREATE INDEX IF NOT EXISTS idx_products_tags_gin
      ON public.products USING GIN (tags)
      WHERE tags IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_products_name_fts
      ON public.products USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(tagline, '')));

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_products_status
        ON public.products (status)
        WHERE status IS NOT NULL;
    END IF;

    ALTER TABLE public.products
      DROP CONSTRAINT IF EXISTS chk_products_upvotes_non_negative,
      DROP CONSTRAINT IF EXISTS chk_products_comments_non_negative;
    ALTER TABLE public.products
      ADD CONSTRAINT chk_products_upvotes_non_negative CHECK (upvotes_count >= 0),
      ADD CONSTRAINT chk_products_comments_non_negative CHECK (comments_count >= 0);

  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 2. UPVOTES
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'upvotes') THEN
    CREATE INDEX IF NOT EXISTS idx_upvotes_product_user ON public.upvotes (product_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_user_id     ON public.upvotes (user_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_product_id  ON public.upvotes (product_id);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 3. COMMENTS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    CREATE INDEX IF NOT EXISTS idx_comments_product_id ON public.comments (product_id) WHERE product_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_comments_thread_id  ON public.comments (thread_id)  WHERE thread_id  IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_comments_user_id    ON public.comments (user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id  ON public.comments (parent_id)  WHERE parent_id  IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments (created_at DESC);

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'upvotes_count') THEN
      ALTER TABLE public.comments
        DROP CONSTRAINT IF EXISTS chk_comments_upvotes_non_negative;
      ALTER TABLE public.comments
        ADD CONSTRAINT chk_comments_upvotes_non_negative CHECK (upvotes_count >= 0);
    END IF;
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 4. THREADS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'threads') THEN
    CREATE INDEX IF NOT EXISTS idx_threads_category_created ON public.threads (category, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_threads_user_id          ON public.threads (user_id);
    CREATE INDEX IF NOT EXISTS idx_threads_product_id       ON public.threads (product_id) WHERE product_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_threads_title_fts
      ON public.threads USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '')));

    ALTER TABLE public.threads
      DROP CONSTRAINT IF EXISTS chk_threads_upvotes_non_negative,
      DROP CONSTRAINT IF EXISTS chk_threads_comments_non_negative;
    ALTER TABLE public.threads
      ADD CONSTRAINT chk_threads_upvotes_non_negative  CHECK (upvotes_count >= 0),
      ADD CONSTRAINT chk_threads_comments_non_negative CHECK (comments_count >= 0);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 5. THREAD UPVOTES
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'thread_upvotes') THEN
    CREATE INDEX IF NOT EXISTS idx_thread_upvotes_thread_user ON public.thread_upvotes (thread_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_thread_upvotes_user_id     ON public.thread_upvotes (user_id);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 6. FOLLOWS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_follows') THEN
    CREATE INDEX IF NOT EXISTS idx_product_follows_product_user ON public.product_follows (product_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_product_follows_user_id      ON public.product_follows (user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_follows') THEN
    CREATE INDEX IF NOT EXISTS idx_user_follows_follower  ON public.user_follows (follower_id);
    CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows (following_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles
      DROP CONSTRAINT IF EXISTS chk_profiles_followers_non_negative,
      DROP CONSTRAINT IF EXISTS chk_profiles_following_non_negative,
      DROP CONSTRAINT IF EXISTS chk_profiles_karma_non_negative,
      DROP CONSTRAINT IF EXISTS chk_profiles_streak_non_negative;
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_followers_non_negative CHECK (followers_count >= 0),
      ADD CONSTRAINT chk_profiles_following_non_negative CHECK (following_count >= 0),
      ADD CONSTRAINT chk_profiles_karma_non_negative     CHECK (karma_points    >= 0),
      ADD CONSTRAINT chk_profiles_streak_non_negative    CHECK (streak_count    >= 0);

    CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));
    CREATE INDEX IF NOT EXISTS idx_profiles_karma_desc     ON public.profiles (karma_points DESC);
    CREATE INDEX IF NOT EXISTS idx_profiles_streak_desc    ON public.profiles (streak_count DESC);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 7. REVIEWS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON public.reviews (user_id);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 8. COMMENT UPVOTES & REPORTS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_upvotes') THEN
    CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment_user ON public.comment_upvotes (comment_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_comment_upvotes_user_id      ON public.comment_upvotes (user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_reports') THEN
    CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON public.comment_reports (comment_id);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 9. COLLECTIONS & STACKS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections') THEN
    CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections (user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collection_products') THEN
    CREATE INDEX IF NOT EXISTS idx_collection_products_collection ON public.collection_products (collection_id);
    CREATE INDEX IF NOT EXISTS idx_collection_products_product    ON public.collection_products (product_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stacks') THEN
    CREATE INDEX IF NOT EXISTS idx_user_stacks_user_id ON public.user_stacks (user_id);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 10. STREAK HISTORY
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_streak_history') THEN
    CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON public.user_streak_history (user_id, visited_date DESC);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 11. PRODUCT ALTERNATIVES
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_alternatives') THEN
    CREATE INDEX IF NOT EXISTS idx_product_alternatives_product_id ON public.product_alternatives (product_id);
    CREATE INDEX IF NOT EXISTS idx_product_alternatives_alt_id     ON public.product_alternatives (alternative_id);
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 12. CAMPAIGNS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns (user_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status  ON public.campaigns (status);

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'product_id') THEN
      CREATE INDEX IF NOT EXISTS idx_campaigns_product_id ON public.campaigns (product_id) WHERE product_id IS NOT NULL;
    END IF;
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 13. NEWSLETTER SUBSCRIBERS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'newsletter_subscribers') THEN
    CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email_lower
      ON public.newsletter_subscribers (lower(email));
  END IF;


  -- ──────────────────────────────────────────────────────────
  -- 14. ORBIT AWARDS
  -- ──────────────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orbit_awards') THEN
    CREATE INDEX IF NOT EXISTS idx_orbit_awards_product_id
      ON public.orbit_awards (winner_product_id)
      WHERE winner_product_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_orbit_awards_year
      ON public.orbit_awards (year DESC);
  END IF;

END $$;
