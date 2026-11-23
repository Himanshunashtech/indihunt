-- ============================================================
-- Migration 74: Scalability Fixes for 100k - 1M MAU
-- Replaces O(N) recursive RLS subqueries with O(1) STABLE functions
-- Adds critical foreign key indexes to prevent table locks
-- Adds partial indexes for soft-deleted products
-- ============================================================

-- 1. Create a STABLE security definer function for Admin checks
-- Marking this as STABLE tells Postgres it can cache the result for the entire query
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Update Admin RLS Policies (Migrate from recursive subquery to STABLE function)
-- Note: We use ALTER POLICY to update the USING clause, or DROP/CREATE if it uses WITH CHECK.
-- For safety across Postgres versions, we DROP and re-CREATE.

-- ── Notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete any notification" ON public.notifications;
CREATE POLICY "Admins can delete any notification" ON public.notifications FOR DELETE USING (public.is_current_user_admin());

-- ── Ad Campaigns
DROP POLICY IF EXISTS "Admins can view all ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Admins can view all ad campaigns" ON public.ad_campaigns FOR SELECT USING (auth.uid() = user_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update any ad campaign" ON public.ad_campaigns;
CREATE POLICY "Admins can update any ad campaign" ON public.ad_campaigns FOR UPDATE USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete any ad campaign" ON public.ad_campaigns;
CREATE POLICY "Admins can delete any ad campaign" ON public.ad_campaigns FOR DELETE USING (public.is_current_user_admin());

-- ── Comments, Reviews, Stories
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;
CREATE POLICY "Admins can delete any comment" ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete any review" ON public.reviews;
CREATE POLICY "Admins can delete any review" ON public.reviews FOR DELETE USING (auth.uid() = user_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete any story" ON public.stories;
CREATE POLICY "Admins can delete any story" ON public.stories FOR DELETE USING (auth.uid() = user_id OR public.is_current_user_admin());

-- ── Reports
DROP POLICY IF EXISTS "Admins can manage comment reports" ON public.comment_reports;
CREATE POLICY "Admins can manage comment reports" ON public.comment_reports FOR ALL USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage thread reports" ON public.thread_reports;
CREATE POLICY "Admins can manage thread reports" ON public.thread_reports FOR ALL USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage product reports" ON public.reports;
CREATE POLICY "Admins can manage product reports" ON public.reports FOR ALL USING (public.is_current_user_admin());

-- ── Forums
DROP POLICY IF EXISTS "Admins can update forums" ON public.forums;
CREATE POLICY "Admins can update forums" ON public.forums FOR UPDATE USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can insert forums" ON public.forums;
CREATE POLICY "Admins can insert forums" ON public.forums FOR INSERT WITH CHECK (public.is_current_user_admin());

-- ── Admin Audit Log
DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read audit log" ON public.admin_audit_log FOR SELECT USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log FOR INSERT WITH CHECK (public.is_current_user_admin());

-- ── Categories
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_current_user_admin());

-- ── Editorial Features
DROP POLICY IF EXISTS "Admins can manage editorial features" ON public.editorial_features;
CREATE POLICY "Admins can manage editorial features" ON public.editorial_features FOR ALL USING (public.is_current_user_admin());

-- ── Platform Settings
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings" ON public.platform_settings FOR UPDATE USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings FOR INSERT WITH CHECK (public.is_current_user_admin());

-- ── Leaderboard Overrides
DROP POLICY IF EXISTS "Admins can manage leaderboard overrides" ON public.leaderboard_overrides;
CREATE POLICY "Admins can manage leaderboard overrides" ON public.leaderboard_overrides FOR ALL USING (public.is_current_user_admin());

-- ── Products (Admin overrides)
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.is_current_user_admin());

-- ── Polar Payments & Budgets
DROP POLICY IF EXISTS "Admins can view all polar payments" ON public.polar_payments;
CREATE POLICY "Admins can view all polar payments" ON public.polar_payments FOR SELECT USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all budget transactions" ON public.ad_budget_transactions;
CREATE POLICY "Admins can view all budget transactions" ON public.ad_budget_transactions FOR SELECT USING (public.is_current_user_admin());


-- 3. Add Missing Foreign Key Index for ad_events (Prevents Cascade Delete Table Lock)
CREATE INDEX IF NOT EXISTS idx_ad_events_campaign_id ON public.ad_events(campaign_id);


-- 4. Add Partial Indexes for Soft-Deleted Products (Optimizes feed queries)
-- We only index active products, saving memory and avoiding filtering during query execution
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc_active 
  ON public.products (created_at DESC) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_products_upvotes_desc_active 
  ON public.products (upvotes_count DESC) 
  WHERE is_deleted = false;

-- Same for comments and threads just in case they are queried heavily on the main feed (if they get soft deletion)
-- But wait, only products had soft-deletion added in Migration 42.

-- 5. Helper function for ad_events owner checks (Optimizes the other subquery in ad_events)
-- The ad_events select policy uses an EXISTS on ad_campaigns. We can wrap it in a STABLE function too.
CREATE OR REPLACE FUNCTION public.is_campaign_owner(_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ad_campaigns 
    WHERE id = _campaign_id AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Owners can view their ad events" ON public.ad_events;
CREATE POLICY "Owners can view their ad events" ON public.ad_events 
  FOR SELECT USING (public.is_campaign_owner(campaign_id));
