-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  is_maker boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- Products table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  tagline text not null,
  description text,
  website_url text not null,
  logo_url text,
  screenshots text[] default '{}',
  maker_id uuid references public.profiles(id) on delete set null,
  upvotes_count integer default 0 not null,
  comments_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Products
alter table public.products enable row level security;

drop policy if exists "Products are viewable by everyone." on public.products;
create policy "Products are viewable by everyone." on public.products
  for select using (true);

drop policy if exists "Authenticated users can insert products." on public.products;
create policy "Authenticated users can insert products." on public.products
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Makers can update their own products." on public.products;
create policy "Makers can update their own products." on public.products
  for update using (auth.uid() = maker_id);

-- Upvotes table
create table if not exists public.upvotes (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, user_id)
);

-- Enable RLS on Upvotes
alter table public.upvotes enable row level security;

drop policy if exists "Upvotes are viewable by everyone." on public.upvotes;
create policy "Upvotes are viewable by everyone." on public.upvotes
  for select using (true);

drop policy if exists "Authenticated users can toggle upvote." on public.upvotes;
create policy "Authenticated users can toggle upvote." on public.upvotes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own upvote." on public.upvotes;
create policy "Users can delete their own upvote." on public.upvotes
  for delete using (auth.uid() = user_id);

-- Comments table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Comments
alter table public.comments enable row level security;

drop policy if exists "Comments are viewable by everyone." on public.comments;
create policy "Comments are viewable by everyone." on public.comments
  for select using (true);

drop policy if exists "Authenticated users can post comments." on public.comments;
create policy "Authenticated users can post comments." on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments." on public.comments;
create policy "Users can delete their own comments." on public.comments
  for delete using (auth.uid() = user_id);

-- Trigger: Update upvote count
create or replace function public.handle_upvote_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.products set upvotes_count = upvotes_count + 1 where id = new.product_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.products set upvotes_count = upvotes_count - 1 where id = old.product_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_upvote_change on public.upvotes;
create trigger on_upvote_change
  after insert or delete on public.upvotes
  for each row execute procedure public.handle_upvote_changes();

-- Trigger: Update comment count
create or replace function public.handle_comment_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.products set comments_count = comments_count + 1 where id = new.product_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.products set comments_count = comments_count - 1 where id = old.product_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_change on public.comments;
create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.handle_comment_changes();

-- Trigger: Set up profile on user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, bio, is_maker)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Anonymous Maker'),
    new.raw_user_meta_data->>'avatar_url',
    'Launching awesome things!',
    true
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
