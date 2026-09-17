-- Migration 60: Comprehensive Notifications Triggers for Threads, Comments, and Upvotes
-- Handles:
-- 1. Product comment / reply notifications
-- 2. Thread comment / reply notifications
-- 3. Thread upvote notifications (when someone upvotes a discussion thread)
-- 4. Comment upvote notifications (when someone upvotes a product or thread comment)
-- 5. Follow notifications

-- ── 1. Update/Extend Comment Notification Trigger ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_thread RECORD;
  v_parent_comment RECORD;
BEGIN
  -- A) Product Comments
  IF NEW.product_id IS NOT NULL THEN
    SELECT name, maker_id INTO v_product
    FROM public.products
    WHERE id = NEW.product_id AND is_deleted IS NOT TRUE;

    IF v_product.maker_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_product.maker_id,
        'comment',
        NEW.user_id,
        'product',
        NEW.product_id::TEXT,
        jsonb_build_object(
          'product_name', v_product.name,
          'body_text', LEFT(NEW.body, 120),
          'action_url', '/products/' || NEW.product_id,
          'action_label', 'View comment'
        )
      );
    END IF;
  END IF;

  -- B) Thread / Discussion Comments
  IF NEW.thread_id IS NOT NULL THEN
    SELECT title, user_id INTO v_thread
    FROM public.threads
    WHERE id = NEW.thread_id;

    IF v_thread.user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_thread.user_id,
        'comment',
        NEW.user_id,
        'thread',
        NEW.thread_id::TEXT,
        jsonb_build_object(
          'thread_title', v_thread.title,
          'body_text', LEFT(NEW.body, 120),
          'action_url', '/threads/' || NEW.thread_id,
          'action_label', 'View discussion'
        )
      );
    END IF;
  END IF;

  -- C) Replies to Parent Comment
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id, product_id, thread_id INTO v_parent_comment
    FROM public.comments
    WHERE id = NEW.parent_id;

    IF v_parent_comment.user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_parent_comment.user_id,
        'reply',
        NEW.user_id,
        'comment',
        NEW.parent_id::TEXT,
        jsonb_build_object(
          'body_text', LEFT(NEW.body, 120),
          'action_url', CASE 
            WHEN NEW.product_id IS NOT NULL THEN '/products/' || NEW.product_id 
            WHEN NEW.thread_id IS NOT NULL THEN '/threads/' || NEW.thread_id 
            ELSE '/' 
          END,
          'action_label', 'View reply'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
CREATE TRIGGER on_comment_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();


-- ── 2. Trigger: Thread Upvote Notification ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_thread_upvote_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_thread RECORD;
BEGIN
  SELECT title, user_id INTO v_thread
  FROM public.threads
  WHERE id = NEW.thread_id;

  IF v_thread.user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      v_thread.user_id,
      'upvote',
      NEW.user_id,
      'thread',
      NEW.thread_id::TEXT,
      jsonb_build_object(
        'thread_title', v_thread.title,
        'action_url', '/threads/' || NEW.thread_id,
        'action_label', 'View thread'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_thread_upvote_notification ON public.thread_upvotes;
CREATE TRIGGER on_thread_upvote_notification
  AFTER INSERT ON public.thread_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_thread_upvote_notification();


-- ── 3. Trigger: Comment Upvote Notification ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_comment_upvote_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_comment RECORD;
BEGIN
  SELECT user_id, product_id, thread_id, body INTO v_comment
  FROM public.comments
  WHERE id = NEW.comment_id;

  IF v_comment.user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      v_comment.user_id,
      'upvote',
      NEW.user_id,
      'comment',
      NEW.comment_id::TEXT,
      jsonb_build_object(
        'body_text', LEFT(v_comment.body, 100),
        'action_url', CASE 
          WHEN v_comment.product_id IS NOT NULL THEN '/products/' || v_comment.product_id 
          WHEN v_comment.thread_id IS NOT NULL THEN '/threads/' || v_comment.thread_id 
          ELSE '/' 
        END,
        'action_label', 'View comment'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_upvote_notification ON public.comment_upvotes;
CREATE TRIGGER on_comment_upvote_notification
  AFTER INSERT ON public.comment_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_upvote_notification();
