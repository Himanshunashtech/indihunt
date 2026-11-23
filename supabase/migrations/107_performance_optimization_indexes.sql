-- IndiHunt Database Performance Optimization Indexes
-- Designed to accelerate high-frequency queries and eradicate DB connection bottlenecks

-- 1. Unread notifications index (for ultra-fast unread count polling & badge hydration)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE read = false;

-- 2. Upvotes by user (for /t/upvotes, /t/bootstrap, and has_upvoted lookups)
CREATE INDEX IF NOT EXISTS idx_upvotes_user_product
  ON public.upvotes (user_id, product_id);

-- 3. Product follows by product
CREATE INDEX IF NOT EXISTS idx_product_follows_product_user
  ON public.product_follows (product_id, user_id);

-- 4. Comments by product and creation date
CREATE INDEX IF NOT EXISTS idx_comments_product_created
  ON public.comments (product_id, created_at ASC)
  WHERE product_id IS NOT NULL;

-- 5. Reviews by product
CREATE INDEX IF NOT EXISTS idx_reviews_product_id
  ON public.reviews (product_id);

-- 6. Products active feed index
CREATE INDEX IF NOT EXISTS idx_products_active_feed
  ON public.products (created_at DESC)
  WHERE is_deleted = false;

-- 7. Product name/slug lookup index
CREATE INDEX IF NOT EXISTS idx_products_name_lower
  ON public.products (lower(name))
  WHERE is_deleted = false;

-- 8. Threads by creation date and category
CREATE INDEX IF NOT EXISTS idx_threads_created
  ON public.threads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_category
  ON public.threads (category, created_at DESC);

-- 9. Threads title lookup index
CREATE INDEX IF NOT EXISTS idx_threads_title_lower
  ON public.threads (lower(title));

-- 10. Comments by thread and creation date
CREATE INDEX IF NOT EXISTS idx_comments_thread_created
  ON public.comments (thread_id, created_at ASC)
  WHERE thread_id IS NOT NULL;

