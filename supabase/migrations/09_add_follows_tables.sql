-- Migration 09: Add follows tables (product follows and user follows)

-- 1. Product Follows
create table if not exists public.product_follows (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, user_id)
);

alter table public.product_follows enable row level security;

drop policy if exists "Product follows are viewable by everyone." on public.product_follows;
create policy "Product follows are viewable by everyone." on public.product_follows
  for select using (true);

drop policy if exists "Authenticated users can toggle follow on products." on public.product_follows;
create policy "Authenticated users can toggle follow on products." on public.product_follows
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove their product follow." on public.product_follows;
create policy "Users can remove their product follow." on public.product_follows
  for delete using (auth.uid() = user_id);

-- 2. User Follows (Followers / Following)
create table if not exists public.user_follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

alter table public.user_follows enable row level security;

drop policy if exists "User follows are viewable by everyone." on public.user_follows;
create policy "User follows are viewable by everyone." on public.user_follows
  for select using (true);

drop policy if exists "Authenticated users can follow other users." on public.user_follows;
create policy "Authenticated users can follow other users." on public.user_follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow." on public.user_follows;
create policy "Users can unfollow." on public.user_follows
  for delete using (auth.uid() = follower_id);

-- Triggers to update followers_count and following_count in profiles
create or replace function public.handle_user_follow_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.profiles set followers_count = followers_count - 1 where id = old.following_id;
    update public.profiles set following_count = following_count - 1 where id = old.follower_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_follow_change on public.user_follows;
create trigger on_user_follow_change
  after insert or delete on public.user_follows
  for each row execute procedure public.handle_user_follow_changes();
