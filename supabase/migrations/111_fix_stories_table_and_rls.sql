-- Migration 111: Ensure stories table schema, user foreign key, and RLS policies

-- 1. Ensure columns exist on stories
ALTER TABLE IF EXISTS public.stories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT NULL;

-- 2. Ensure RLS is enabled
ALTER TABLE IF EXISTS public.stories ENABLE ROW LEVEL SECURITY;

-- 3. Ensure SELECT policy allows public read
DROP POLICY IF EXISTS "Stories are viewable by everyone." ON public.stories;
DROP POLICY IF EXISTS "Allow anonymous read public stories" ON public.stories;
CREATE POLICY "Stories are viewable by everyone." ON public.stories
  FOR SELECT USING (true);

-- 4. Ensure authenticated users and service role can create stories
DROP POLICY IF EXISTS "Authenticated users can create stories." ON public.stories;
CREATE POLICY "Authenticated users can create stories." ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- 5. Ensure users and service role can update/delete their own stories
DROP POLICY IF EXISTS "Users can update their own stories." ON public.stories;
CREATE POLICY "Users can update their own stories." ON public.stories
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own stories." ON public.stories;
CREATE POLICY "Users can delete their own stories." ON public.stories
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 6. Ensure story_comments table exists with proper policies
CREATE TABLE IF NOT EXISTS public.story_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.story_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS public.story_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Story comments are viewable by everyone." ON public.story_comments;
CREATE POLICY "Story comments are viewable by everyone." ON public.story_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post story comments." ON public.story_comments;
CREATE POLICY "Authenticated users can post story comments." ON public.story_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete their own story comments." ON public.story_comments;
CREATE POLICY "Users can delete their own story comments." ON public.story_comments
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 7. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON public.stories (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories (user_id);

