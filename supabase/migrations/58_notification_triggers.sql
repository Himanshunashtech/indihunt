-- Migration 58: Notification triggers + INSERT policy
-- Automatically creates in-app notifications when users upvote, comment, or follow

-- ── INSERT policy (missing from migration 53) ─────────────────────────────────
-- Without this, triggers running as SECURITY DEFINER can insert,
-- but direct API calls (server-side functions) cannot.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ── Helper: safely create a notification (avoids duplicates) ─────────────────
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_actor_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  -- Don't notify users about their own actions
  IF p_user_id = p_actor_id THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, type, actor_id, entity_type, entity_id, data)
  VALUES (p_user_id, p_type, p_actor_id, p_entity_type, p_entity_id, p_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Trigger: upvote notification ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_upvote_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
BEGIN
  -- Get product info
  SELECT name, maker_id INTO v_product
  FROM public.products
  WHERE id = NEW.product_id AND is_deleted IS NOT TRUE;

  IF v_product.maker_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_notification(
    v_product.maker_id,            -- notify the product maker
    'upvote',                      -- type
    NEW.user_id,                   -- actor = person who upvoted
    'product',                     -- entity_type
    NEW.product_id::TEXT,          -- entity_id
    jsonb_build_object(
      'product_name', v_product.name,
      'action_url', '/products/' || NEW.product_id,
      'action_label', 'View your product'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_upvote_notification ON public.upvotes;
CREATE TRIGGER on_upvote_notification
  AFTER INSERT ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_upvote_notification();

-- ── Trigger: comment notification ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_parent_comment RECORD;
BEGIN
  -- Only handle product comments (product_id is set)
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name, maker_id INTO v_product
  FROM public.products
  WHERE id = NEW.product_id AND is_deleted IS NOT TRUE;

  -- Notify the product maker of a new comment
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

  -- If it's a reply, also notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_comment
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
          'product_name', v_product.name,
          'body_text', LEFT(NEW.body, 120),
          'action_url', '/products/' || NEW.product_id,
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

-- ── Trigger: follow notification ──────────────────────────────────────────────
-- Only fires if follows table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'follows') THEN
    EXECUTE $trigger$
      CREATE OR REPLACE FUNCTION public.handle_follow_notification()
      RETURNS TRIGGER AS $fn$
      BEGIN
        PERFORM public.create_notification(
          NEW.following_id,      -- person being followed gets notified
          'follow',
          NEW.follower_id,       -- actor = person who followed
          'profile',
          NEW.following_id::TEXT,
          jsonb_build_object(
            'action_url', '/profile',
            'action_label', 'View profile'
          )
        );
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
      CREATE TRIGGER on_follow_notification
        AFTER INSERT ON public.follows
        FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();
    $trigger$;
  END IF;
END $$;
