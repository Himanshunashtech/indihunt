-- Migration 106: Add Security Definer trigger for product upvotes
-- Mirrors handle_thread_upvote_changes and handle_comment_upvote_changes

-- 1. Create or replace the product upvote trigger function with security definer
CREATE OR REPLACE FUNCTION public.handle_upvote_changes()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.products 
    SET upvotes_count = upvotes_count + 1 
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.products 
    SET upvotes_count = GREATEST(0, upvotes_count - 1) 
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on public.upvotes
DROP TRIGGER IF EXISTS on_upvote_change ON public.upvotes;
CREATE TRIGGER on_upvote_change
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_upvote_changes();

-- 3. Recalculate upvotes_count to make sure all products are 100% accurate
UPDATE public.products p
SET upvotes_count = COALESCE(
  (
    SELECT COUNT(*)::integer
    FROM public.upvotes u
    WHERE u.product_id = p.id
  ),
  0
);

-- 4. Ensure Realtime is enabled on products and upvotes tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.upvotes;
    EXCEPTION WHEN duplicate_object THEN
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_upvotes;
    EXCEPTION WHEN duplicate_object THEN
    END;
  END IF;
END;
$$;
