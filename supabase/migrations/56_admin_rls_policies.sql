-- Migration 56: Admin RLS Policies
-- Grants admins the ability to read & manage all content tables
-- Required for the enterprise admin panel

-- Helper: reusable admin check expression
-- Admins are identified by role = 'admin' in profiles table

-- ── Notifications ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete any notification" ON public.notifications;
CREATE POLICY "Admins can delete any notification"
  ON public.notifications FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Ad Campaigns ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Admins can view all ad campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update any ad campaign" ON public.ad_campaigns;
CREATE POLICY "Admins can update any ad campaign"
  ON public.ad_campaigns FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete any ad campaign" ON public.ad_campaigns;
CREATE POLICY "Admins can delete any ad campaign"
  ON public.ad_campaigns FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── Comments ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Reviews ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can delete any review" ON public.reviews;
CREATE POLICY "Admins can delete any review"
  ON public.reviews FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Stories ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can delete any story" ON public.stories;
CREATE POLICY "Admins can delete any story"
  ON public.stories FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Comment Reports ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage comment reports" ON public.comment_reports;
CREATE POLICY "Admins can manage comment reports"
  ON public.comment_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Thread Reports ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage thread reports" ON public.thread_reports;
CREATE POLICY "Admins can manage thread reports"
  ON public.thread_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Product Reports ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage product reports" ON public.reports;
CREATE POLICY "Admins can manage product reports"
  ON public.reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Forums ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update forums" ON public.forums;
CREATE POLICY "Admins can update forums"
  ON public.forums FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert forums" ON public.forums;
CREATE POLICY "Admins can insert forums"
  ON public.forums FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
