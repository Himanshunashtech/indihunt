-- Migration 20: Create campaigns table for self-serve advertisement campaigns
create table if not exists public.campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  url text,
  name text not null,
  tagline text,
  goal text,
  budget text,
  status text default 'active' not null, -- active, paused, completed
  clicks integer default 0 not null,
  views integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.campaigns enable row level security;

-- Policies
drop policy if exists "Campaigns are viewable by owners" on public.campaigns;
create policy "Campaigns are viewable by owners" on public.campaigns
  for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own campaigns" on public.campaigns;
create policy "Users can create their own campaigns" on public.campaigns
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own campaigns" on public.campaigns;
create policy "Users can update their own campaigns" on public.campaigns
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own campaigns" on public.campaigns;
create policy "Users can delete their own campaigns" on public.campaigns
  for delete using (auth.uid() = user_id);
