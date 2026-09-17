-- Migration 08: Add extra launch links and details to products
alter table public.products
  add column if not exists is_open_source boolean default false,
  add column if not exists github_url text,
  add column if not exists additional_urls text[] default '{}';

-- 2. Create product investor details table
create table if not exists public.product_investor_details (
  product_id uuid references public.products(id) on delete cascade primary key,
  why_team text,
  why_idea text,
  competitors text,
  revenue text,
  anything_else text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.product_investor_details enable row level security;

drop policy if exists "Makers can view their own product's investor details." on public.product_investor_details;
create policy "Makers can view their own product's investor details." on public.product_investor_details
  for select using (
    exists (
      select 1 from public.products
      where id = product_id and maker_id = auth.uid()
    )
  );

drop policy if exists "Makers can insert their own product's investor details." on public.product_investor_details;
create policy "Makers can insert their own product's investor details." on public.product_investor_details
  for insert with check (
    exists (
      select 1 from public.products
      where id = product_id and maker_id = auth.uid()
    )
  );

-- 3. Create product shoutouts table (founder reviews)
create table if not exists public.product_shoutouts (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  shouted_product_id uuid references public.products(id) on delete cascade not null,
  note text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, shouted_product_id)
);

alter table public.product_shoutouts enable row level security;

drop policy if exists "Product shoutouts are viewable by everyone." on public.product_shoutouts;
create policy "Product shoutouts are viewable by everyone." on public.product_shoutouts
  for select using (true);

drop policy if exists "Authenticated users can insert shoutouts for their products." on public.product_shoutouts;
create policy "Authenticated users can insert shoutouts for their products." on public.product_shoutouts
  for insert with check (
    exists (
      select 1 from public.products
      where id = product_id and maker_id = auth.uid()
    )
  );
