-- Add composite indexes for comments and reviews to optimize product queries
CREATE INDEX IF NOT EXISTS idx_comments_product_id_created_at ON comments (product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id_created_at ON reviews (product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id_created_at ON comments (thread_id, created_at);
