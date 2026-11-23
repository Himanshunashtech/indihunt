-- Migration: 63_create_daily_digest_cron_job.sql
-- Description: Create Supabase pg_cron job to trigger daily newsletter digest email broadcast at 10 AM IST (4:30 AM UTC)

-- Enable the pg_cron and pg_net extensions if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to trigger the Next.js API endpoint for Daily Digest
CREATE OR REPLACE FUNCTION trigger_daily_digest_newsletter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Trigger HTTP GET request to the Next.js daily digest endpoint
  PERFORM net.http_get(
    url := 'https://indihunt.in/api/send-email/daily-digest',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
END;
$$;

-- Schedule the cron job to run every day at 10:00 AM IST (04:30 AM UTC)
-- Cron syntax: minute hour day month day-of-week (in UTC)
SELECT cron.schedule(
  'daily-digest-newsletter-10am-ist', -- Unique job name
  '30 4 * * *',                       -- 04:30 UTC = 10:00 AM IST
  $$ SELECT trigger_daily_digest_newsletter(); $$
);
