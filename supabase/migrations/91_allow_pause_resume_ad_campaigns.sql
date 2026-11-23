-- Migration 91: Allow campaign owners to toggle between active and paused, while protecting unpaid activation
CREATE OR REPLACE FUNCTION protect_ad_campaigns_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS tr_protect_ad_campaigns ON ad_campaigns;
CREATE TRIGGER tr_protect_ad_campaigns
BEFORE UPDATE ON ad_campaigns
FOR EACH ROW EXECUTE FUNCTION protect_ad_campaigns_sensitive_columns();
