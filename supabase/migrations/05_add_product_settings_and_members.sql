-- Migration 05: Add product settings (social URLs) and team members management

-- 1. Add social link columns to products
alter table public.products
  add column if not exists twitter_url text,
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists linkedin_url text,
  add column if not exists medium_url text;

-- 2. Create product members table for co-makers/team collaboration
create table if not exists public.product_members (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' not null, -- 'owner', 'member'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, user_id)
);

-- Enable RLS on product_members
alter table public.product_members enable row level security;

create policy "Product members are viewable by everyone." on public.product_members
  for select using (true);

create policy "Makers can add members to their own products." on public.product_members
  for insert with check (
    exists (
      select 1 from public.products
      where id = product_id and maker_id = auth.uid()
    )
  );

create policy "Makers/Owners can remove members from their own products." on public.product_members
  for delete using (
    exists (
      select 1 from public.products
      where id = product_id and maker_id = auth.uid()
    )
  );
