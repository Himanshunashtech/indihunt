-- Migration 87: Switch Ads Engine to CPM Model

-- Alter ad_campaigns table
ALTER TABLE public.ad_campaigns 
  DROP COLUMN IF EXISTS max_cpc,
  DROP COLUMN IF EXISTS remaining_budget,
  DROP COLUMN IF EXISTS spent,
  ADD COLUMN cpm_rate NUMERIC DEFAULT 10.00,
  ADD COLUMN target_impressions INTEGER DEFAULT 0,
  ADD COLUMN delivered_impressions INTEGER DEFAULT 0;

-- Update log_ad_event RPC
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
                   WHEN (delivered_impressions + 1) >= target_impressions THEN 'completed'::text
                   ELSE status
                 END
    WHERE id = campaign_uuid;
  END IF;

  -- Log into ad_events table
  INSERT INTO public.ad_events (campaign_id, event_type)
  VALUES (campaign_uuid, CASE WHEN is_click THEN 'click' ELSE 'impression' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
