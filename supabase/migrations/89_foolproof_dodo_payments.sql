-- 1. Idempotency Lock: Prevent duplicate Dodo payments from being inserted
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS unique_dodo_payment_id;

ALTER TABLE payments
ADD CONSTRAINT unique_dodo_payment_id UNIQUE (dodo_payment_id);

-- 2. RLS Hardening: Prevent authenticated/anon users from manipulating sensitive billing/campaign fields directly
CREATE OR REPLACE FUNCTION protect_ad_campaigns_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow the service role (or postgres) to modify these columns
  -- Current user roles are 'authenticated' or 'anon' for client-side requests
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
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('active', 'completed') THEN
      RAISE EXCEPTION 'Cannot activate or complete campaign directly. Must be done via secure server webhook.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_ad_campaigns ON ad_campaigns;
CREATE TRIGGER tr_protect_ad_campaigns
BEFORE UPDATE ON ad_campaigns
FOR EACH ROW EXECUTE FUNCTION protect_ad_campaigns_sensitive_columns();

-- 3. RLS Hardening for Payments: Prevent users from updating their payment records
CREATE OR REPLACE FUNCTION protect_payments_table()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' OR auth.role() = 'anon' THEN
    RAISE EXCEPTION 'Payments table is immutable by client-side users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_payments ON payments;
CREATE TRIGGER tr_protect_payments
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION protect_payments_table();
