-- Migration 15: Add Collections and User Stacks Tables

-- 1. Collections Table
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on collections
alter table public.collections enable row level security;

drop policy if exists "Collections are viewable by everyone." on public.collections;
create policy "Collections are viewable by everyone." on public.collections
  for select using (true);

drop policy if exists "Users can create collections." on public.collections;
create policy "Users can create collections." on public.collections
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own collections." on public.collections;
create policy "Users can update their own collections." on public.collections
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own collections." on public.collections;
create policy "Users can delete their own collections." on public.collections
  for delete using (auth.uid() = user_id);


-- 2. Collection Products Link Table (Many-to-Many)
create table if not exists public.collection_products (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(collection_id, product_id)
);

-- Enable RLS on collection_products
alter table public.collection_products enable row level security;

drop policy if exists "Collection products are viewable by everyone." on public.collection_products;
create policy "Collection products are viewable by everyone." on public.collection_products
  for select using (true);

drop policy if exists "Users can add products to their own collections." on public.collection_products;
create policy "Users can add products to their own collections." on public.collection_products
  for insert with check (
    exists (
      select 1 from public.collections
      where public.collections.id = collection_id
        and public.collections.user_id = auth.uid()
    )
  );

drop policy if exists "Users can remove products from their own collections." on public.collection_products;
create policy "Users can remove products from their own collections." on public.collection_products
  for delete using (
    exists (
      select 1 from public.collections
      where public.collections.id = collection_id
        and public.collections.user_id = auth.uid()
    )
  );


-- 3. User Stacks Table
create table if not exists public.user_stacks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Enable RLS on user_stacks
alter table public.user_stacks enable row level security;

drop policy if exists "User stacks are viewable by everyone." on public.user_stacks;
create policy "User stacks are viewable by everyone." on public.user_stacks
  for select using (true);

drop policy if exists "Users can add products to their stack." on public.user_stacks;
create policy "Users can add products to their stack." on public.user_stacks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove products from their stack." on public.user_stacks;
create policy "Users can remove products from their stack." on public.user_stacks
  for delete using (auth.uid() = user_id);
