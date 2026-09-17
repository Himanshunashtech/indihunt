-- Migration 48: Create RPC function for logging ad events bypassing RLS securely
create or replace function public.log_ad_event(campaign_uuid uuid, is_click boolean)
returns void as $$
declare
  c_max_cpc numeric;
  c_remaining numeric;
  cost numeric;
begin
  -- Fetch max_cpc and remaining_budget
  select max_cpc, remaining_budget into c_max_cpc, c_remaining
  from public.ad_campaigns
  where id = campaign_uuid;

  if not found then
    return;
  end if;

  if is_click then
    cost := c_max_cpc;
  else
    cost := 0.005;
  end if;

  update public.ad_campaigns
  set 
    spent = spent + cost,
    remaining_budget = greatest(0, remaining_budget - cost),
    status = case when (remaining_budget - cost) <= 0 then 'completed' else status end,
    clicks = case when is_click then clicks + 1 else clicks end,
    impressions = case when not is_click then impressions + 1 else impressions end
  where id = campaign_uuid;

  -- Also log into ad_events table
  insert into public.ad_events (campaign_id, event_type)
  values (campaign_uuid, case when is_click then 'click' else 'impression' end);
end;
$$ language plpgsql security definer;
