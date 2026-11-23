-- ==============================================================================
-- Migration 88: Clean Rebuild of Ads System (CPM Engine)
-- Drops all legacy ad functions/triggers and cleanly recreates tables & RPCs
-- ==============================================================================

-- 1. Drop old functions and triggers cleanly
DROP FUNCTION IF EXISTS public.log_ad_event(uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.log_ad_event(uuid, boolean, text, text, text, text) CASCADE;

-- 2. Drop old tables cleanly (cascade removes foreign keys, policies, and indexes)
DROP TABLE IF EXISTS public.ad_events CASCADE;
DROP TABLE IF EXISTS public.ad_campaigns CASCADE;

-- 3. Create public.ad_campaigns table (Clean CPM Schema)
CREATE TABLE public.ad_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  cta_text TEXT DEFAULT 'Visit Product' NOT NULL,
  destination_url TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('draft', 'pending_payment', 'active', 'paused', 'paused_by_admin', 'completed', 'expired', 'archived')),
  total_budget NUMERIC(10, 2) DEFAULT 350.00 NOT NULL,
  daily_limit NUMERIC(10, 2) DEFAULT 10.00 NOT NULL,
  cpm_rate NUMERIC(10, 2) DEFAULT 10.00 NOT NULL,
  target_impressions INTEGER DEFAULT 35000 NOT NULL,
  delivered_impressions INTEGER DEFAULT 0 NOT NULL,
  impressions INTEGER DEFAULT 0 NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  dodo_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create public.ad_events table (Tracking & Auditing)
CREATE TABLE public.ad_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Performance Indexes
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns (status);
CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns (user_id);
CREATE INDEX idx_ad_campaigns_product_id ON public.ad_campaigns (product_id);
CREATE INDEX idx_ad_events_campaign_id ON public.ad_events (campaign_id);
CREATE INDEX idx_ad_events_created_at ON public.ad_events (created_at DESC);

-- 6. Row Level Security (RLS)
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- Policies for ad_campaigns
CREATE POLICY "Ad campaigns are viewable by anyone" ON public.ad_campaigns
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ad campaigns" ON public.ad_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad campaigns" ON public.ad_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad campaigns" ON public.ad_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for ad_events
CREATE POLICY "Anyone can log ad events" ON public.ad_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Ad events are viewable by campaign owners" ON public.ad_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.ad_campaigns WHERE id = campaign_id
    )
  );

-- 7. High-Performance RPC for CPM event logging
CREATE OR REPLACE FUNCTION public.log_ad_event(campaign_uuid uuid, is_click boolean)
RETURNS void AS $$
BEGIN
  IF is_click THEN
    UPDATE public.ad_campaigns
    SET clicks = clicks + 1
    WHERE id = campaign_uuid;
  ELSE
    UPDATE public.ad_campaigns
    SET impressions = impressions + 1,
        delivered_impressions = delivered_impressions + 1,
        status = CASE 
                   WHEN target_impressions > 0 AND (delivered_impressions + 1) >= target_impressions THEN 'completed'
                   ELSE status
                 END
    WHERE id = campaign_uuid;
  END IF;

  -- Insert event record into ad_events table
  INSERT INTO public.ad_events (campaign_id, event_type)
  VALUES (campaign_uuid, CASE WHEN is_click THEN 'click' ELSE 'impression' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
