-- ============================================================================
-- Migration 100: Postgres Triggers for Atomic Count Updates + Full-Text Search
-- 
-- WHY: Product Hunt keeps counts accurate using DB triggers, not app-level
-- SELECT+UPDATE. Triggers are atomic (no race conditions) and eliminate
-- 1-2 DB round-trips per upvote/comment from the API routes.
--
-- RUN IN: Supabase SQL Editor > New Query > Paste & Run
-- ============================================================================

-- ============================================================
-- PART 1: Upvotes Count Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_product_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products SET upvotes_count = upvotes_count + 1 WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_upvote_insert ON public.upvotes;
CREATE TRIGGER trg_upvote_insert
  AFTER INSERT ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION public.increment_product_upvotes();

CREATE OR REPLACE FUNCTION public.decrement_product_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = OLD.product_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_upvote_delete ON public.upvotes;
CREATE TRIGGER trg_upvote_delete
  AFTER DELETE ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_upvotes();

-- ============================================================
-- PART 2: Comments Count Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products SET comments_count = comments_count + 1 WHERE id = NEW.product_id;
  END IF;
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE public.threads SET comments_count = comments_count + 1 WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_comment_insert ON public.comments;
CREATE TRIGGER trg_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.increment_comments_count();

CREATE OR REPLACE FUNCTION public.decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.product_id IS NOT NULL THEN
    UPDATE public.products SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.product_id;
  END IF;
  IF OLD.thread_id IS NOT NULL THEN
    UPDATE public.threads SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.thread_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_comment_delete ON public.comments;
CREATE TRIGGER trg_comment_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.decrement_comments_count();

-- ============================================================
-- PART 3: Thread Upvotes Count Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_thread_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.threads SET upvotes_count = upvotes_count + 1 WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_thread_upvote_insert ON public.thread_upvotes;
CREATE TRIGGER trg_thread_upvote_insert
  AFTER INSERT ON public.thread_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.increment_thread_upvotes();

CREATE OR REPLACE FUNCTION public.decrement_thread_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.threads SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = OLD.thread_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_thread_upvote_delete ON public.thread_upvotes;
CREATE TRIGGER trg_thread_upvote_delete
  AFTER DELETE ON public.thread_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_thread_upvotes();

-- ============================================================
-- PART 4: Full-Text Search Index (Algolia alternative - free)
-- Replaces slow ILIKE queries with GIN-indexed tsvector search
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(''english'',
      coalesce(name, '''') || '' '' ||
      coalesce(tagline, '''') || '' '' ||
      coalesce(description, '''')
    )
  ) STORED;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_fts
  ON public.products USING GIN (search_vector);

-- ============================================================
-- PART 5: Notifications unread index
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id, read, created_at DESC)
  WHERE read = false;
