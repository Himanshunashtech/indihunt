-- Create RPC function to log billboard impressions and clicks bypassing RLS safely
create or replace function public.log_billboard_event(billboard_uuid uuid, is_click boolean)
returns void as $$
begin
  if is_click then
    update public.billboard_ads
    set clicks_count = clicks_count + 1
    where id = billboard_uuid;
  else
    update public.billboard_ads
    set views_count = views_count + 1
    where id = billboard_uuid;
  end if;
end;
$$ language plpgsql security definer;
