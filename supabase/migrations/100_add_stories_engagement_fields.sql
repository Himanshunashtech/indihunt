-- Migration 100: Add engagement + reading metrics to stories table
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT NULL;

-- Index for sorting by engagement
CREATE INDEX IF NOT EXISTS idx_stories_likes_count ON public.stories (likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON public.stories (published_at DESC);
