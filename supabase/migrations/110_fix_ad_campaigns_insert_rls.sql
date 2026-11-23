-- Migration 110: Fix RLS on ad_campaigns so admins, authenticated users, and anon can insert
DROP POLICY IF EXISTS "Users can insert their own ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Users can insert their own ad campaigns" ON public.ad_campaigns
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can insert any ad campaign" ON public.ad_campaigns;
CREATE POLICY "Admins can insert any ad campaign" ON public.ad_campaigns
  FOR INSERT WITH CHECK (true);

