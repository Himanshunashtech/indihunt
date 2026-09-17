-- Migration 43: Create Self-Serve Advertising tables
create table if not exists public.ad_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null,
  headline text not null check (char_length(headline) <= 60),
  description text not null check (char_length(description) <= 120),
  cta_text text default 'Visit Product' not null,
  destination_url text not null,
  status text default 'active' not null, -- active, paused, completed
  total_budget numeric(10, 2) default 0.00 not null,
  daily_limit numeric(10, 2) default 0.00 not null,
  max_cpc numeric(10, 2) default 0.30 not null,
  spent numeric(10, 2) default 0.00 not null,
  remaining_budget numeric(10, 2) default 0.00 not null,
  impressions integer default 0 not null,
  clicks integer default 0 not null,
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ad_campaigns enable row level security;

-- Policies for ad_campaigns
drop policy if exists "Ad campaigns are viewable by owner" on public.ad_campaigns;
create policy "Ad campaigns are viewable by anyone" on public.ad_campaigns
  for select using (true);

drop policy if exists "Users can insert their own ad campaigns" on public.ad_campaigns;
create policy "Users can insert their own ad campaigns" on public.ad_campaigns
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own ad campaigns" on public.ad_campaigns;
create policy "Users can update their own ad campaigns" on public.ad_campaigns
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own ad campaigns" on public.ad_campaigns;
create policy "Users can delete their own ad campaigns" on public.ad_campaigns
  for delete using (auth.uid() = user_id);

-- ad_events for tracking and fraud mitigation
create table if not exists public.ad_events (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.ad_campaigns(id) on delete cascade not null,
  event_type text not null, -- impression, click
  ip_hash text,
  user_agent text,
  referrer text,
  session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ad_events enable row level security;

-- Anyone can insert ad_events (for tracking) but select is restricted
drop policy if exists "Anyone can insert ad events" on public.ad_events;
create policy "Anyone can insert ad events" on public.ad_events
  for insert with check (true);

drop policy if exists "Owners can view their ad events" on public.ad_events;
create policy "Owners can view their ad events" on public.ad_events
  for select using (
    exists (
      select 1 from public.ad_campaigns c 
      where c.id = campaign_id and c.user_id = auth.uid()
    )
  );
