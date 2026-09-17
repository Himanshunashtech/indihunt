-- ==============================================================================
-- Migration 92: Auto Cleanup 12h Pending Ad Campaigns & Enable Admin Campaign Deletion
-- ==============================================================================

-- 1. Enable Full Campaign Deletion for Admins and Campaign Creators in RLS
DROP POLICY IF EXISTS "Users can delete their own ad campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Users and admins can delete ad campaigns" ON public.ad_campaigns;

CREATE POLICY "Users and admins can delete ad campaigns" ON public.ad_campaigns
  FOR DELETE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Cleanup Function: Automatically delete ad_campaigns stuck in 'pending_payment' for > 12 hours
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_ad_campaigns()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ad_campaigns
  WHERE status = 'pending_payment'
    AND created_at < (NOW() - INTERVAL '12 hours');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Execute cleanup immediately on migration run
SELECT public.cleanup_expired_pending_ad_campaigns();
