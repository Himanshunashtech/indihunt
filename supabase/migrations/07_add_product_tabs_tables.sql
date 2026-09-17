-- Migration 07: Add reviews, alternatives, reports, and link threads to products

-- 1. Reviews table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, user_id)
);

-- Enable RLS on reviews
alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone." on public.reviews
  for select using (true);

create policy "Authenticated users can post reviews." on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own reviews." on public.reviews
  for delete using (auth.uid() = user_id);

-- 2. Alternatives table
create table if not exists public.product_alternatives (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null, -- main product
  alternative_id uuid references public.products(id) on delete cascade not null, -- alternative product
  created_by uuid references public.profiles(id) on delete set null,
  votes_count integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, alternative_id)
);

-- Enable RLS on alternatives
alter table public.product_alternatives enable row level security;

create policy "Product alternatives are viewable by everyone." on public.product_alternatives
  for select using (true);

create policy "Authenticated users can add product alternatives." on public.product_alternatives
  for insert with check (auth.role() = 'authenticated');

-- 3. Product alternative votes (upvotes for suggestions)
create table if not exists public.product_alternative_votes (
  id uuid default gen_random_uuid() primary key,
  alternative_id uuid references public.product_alternatives(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(alternative_id, user_id)
);

alter table public.product_alternative_votes enable row level security;

create policy "Alternative votes are viewable by everyone." on public.product_alternative_votes
  for select using (true);

create policy "Authenticated users can vote for alternatives." on public.product_alternative_votes
  for insert with check (auth.uid() = user_id);

create policy "Users can remove their vote for alternatives." on public.product_alternative_votes
  for delete using (auth.uid() = user_id);

-- Trigger to increment/decrement votes_count in product_alternatives
create or replace function public.handle_alternative_vote_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.product_alternatives set votes_count = votes_count + 1 where id = new.alternative_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.product_alternatives set votes_count = votes_count - 1 where id = old.alternative_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_alternative_vote_change
  after insert or delete on public.product_alternative_votes
  for each row execute procedure public.handle_alternative_vote_changes();

-- 4. Reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on reports
alter table public.reports enable row level security;

create policy "Reports can be inserted by anyone." on public.reports
  for insert with check (true);

create policy "Reports can be viewed by admins (currently public for simplicity or authenticated maker of product)." on public.reports
  for select using (true);

-- 5. Add product_id to threads table to support product-specific forums
alter table public.threads
  add column if not exists product_id uuid references public.products(id) on delete cascade;
