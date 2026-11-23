-- ==============================================================================
-- Migration 96: Allow Public Access to Active Ad Campaigns
-- Ensures anonymous (guest) and logged-in visitors can view active ads in feeds
-- ==============================================================================

-- Drop conflicting policies on public.ad_campaigns
DROP POLICY IF EXISTS "Ad campaigns are viewable by anyone" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Public can view active ad campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Admins can view all ad campaigns" ON public.ad_campaigns;

-- Create comprehensive SELECT policy
-- 1. Anyone (public/anon) can view campaigns that are 'active'
-- 2. Authenticated users can view their own campaigns (any status)
-- 3. Admins can view all campaigns
CREATE POLICY "Public can view active ad campaigns" ON public.ad_campaigns
  FOR SELECT USING (
    status = 'active'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_current_user_admin()
  );
