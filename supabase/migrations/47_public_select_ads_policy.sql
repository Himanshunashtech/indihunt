-- Migration 47: Allow public select on ad_campaigns table
drop policy if exists "Ad campaigns are viewable by anyone" on public.ad_campaigns;
create policy "Ad campaigns are viewable by anyone" on public.ad_campaigns
  for select using (true);