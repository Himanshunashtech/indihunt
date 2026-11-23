-- Migration 95: Allow log_ad_event RPC to update delivered_impressions and status while maintaining client tampering protection

-- 1. Update protect_ad_campaigns_sensitive_columns trigger function to bypass checks when called inside trusted RPCs
CREATE OR REPLACE FUNCTION protect_ad_campaigns_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked inside trusted internal RPC log_ad_event, allow delivered_impressions / status updates
  IF current_setting('app.in_log_ad_event', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Check client-side requests (authenticated or anon roles)
  IF auth.role() = 'authenticated' OR auth.role() = 'anon' THEN
    IF NEW.total_budget IS DISTINCT FROM OLD.total_budget THEN
      RAISE EXCEPTION 'Cannot modify total_budget directly';
    END IF;
    IF NEW.target_impressions IS DISTINCT FROM OLD.target_impressions THEN
      RAISE EXCEPTION 'Cannot modify target_impressions directly';
    END IF;
    IF NEW.delivered_impressions IS DISTINCT FROM OLD.delivered_impressions THEN
      RAISE EXCEPTION 'Cannot modify delivered_impressions directly';
    END IF;

    -- Block client from directly activating an unpaid pending campaign
    IF OLD.status = 'pending_payment' AND NEW.status IN ('active', 'completed') THEN
      RAISE EXCEPTION 'Cannot activate unpaid campaign directly. Must be completed via Dodo Payments.';
    END IF;

    -- Block client from setting status to completed directly
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      RAISE EXCEPTION 'Cannot mark campaign as completed directly.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update log_ad_event RPC to set the session flag before updating ad_campaigns
CREATE OR REPLACE FUNCTION public.log_ad_event(campaign_uuid uuid, is_click boolean)
RETURNS void AS $$
BEGIN
  -- Set transaction-local configuration flag
  PERFORM set_config('app.in_log_ad_event', 'true', true);

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
