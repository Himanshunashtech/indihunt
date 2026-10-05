-- Migration 105: Fix RLS policies on upvotes, thread_upvotes, and comment_upvotes tables
-- Ensures authenticated users can select, insert, and delete their own upvotes

-- ==========================================
-- 1. PRODUCT UPVOTES
-- ==========================================
ALTER TABLE IF EXISTS public.upvotes ENABLE ROW LEVEL SECURITY;

-- Allow public viewing of upvotes (so count and has_upvoted checks work)
DROP POLICY IF EXISTS "Upvotes are viewable by everyone." ON public.upvotes;
DROP POLICY IF EXISTS "select own upvotes" ON public.upvotes;
DROP POLICY IF EXISTS "Public can view upvotes" ON public.upvotes;
CREATE POLICY "Public can view upvotes" ON public.upvotes
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own upvote
DROP POLICY IF EXISTS "Authenticated users can toggle upvote." ON public.upvotes;
DROP POLICY IF EXISTS "insert own upvotes" ON public.upvotes;
DROP POLICY IF EXISTS "Users can insert own upvotes" ON public.upvotes;
CREATE POLICY "Users can insert own upvotes" ON public.upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own upvote
DROP POLICY IF EXISTS "Users can delete their own upvote." ON public.upvotes;
DROP POLICY IF EXISTS "delete own upvotes" ON public.upvotes;
DROP POLICY IF EXISTS "Users can delete own upvotes" ON public.upvotes;
CREATE POLICY "Users can delete own upvotes" ON public.upvotes
  FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 2. THREAD UPVOTES
-- ==========================================
ALTER TABLE IF EXISTS public.thread_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Thread upvotes are viewable by everyone." ON public.thread_upvotes;
DROP POLICY IF EXISTS "Public can view thread upvotes" ON public.thread_upvotes;
CREATE POLICY "Public can view thread upvotes" ON public.thread_upvotes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own thread upvotes" ON public.thread_upvotes;
CREATE POLICY "Users can insert own thread upvotes" ON public.thread_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own thread upvotes" ON public.thread_upvotes;
CREATE POLICY "Users can delete own thread upvotes" ON public.thread_upvotes
  FOR DELETE USING (auth.uid() = user_id);


-- ==========================================
-- 3. COMMENT UPVOTES
-- ==========================================
ALTER TABLE IF EXISTS public.comment_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comment upvotes are viewable by everyone." ON public.comment_upvotes;
DROP POLICY IF EXISTS "Public can view comment upvotes" ON public.comment_upvotes;
CREATE POLICY "Public can view comment upvotes" ON public.comment_upvotes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own comment upvotes" ON public.comment_upvotes;
CREATE POLICY "Users can insert own comment upvotes" ON public.comment_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment upvotes" ON public.comment_upvotes;
CREATE POLICY "Users can delete own comment upvotes" ON public.comment_upvotes
  FOR DELETE USING (auth.uid() = user_id);
