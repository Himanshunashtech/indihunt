-- Migration 03: Add Discussions (Threads) and profile verification fields

-- profiles updates
alter table public.profiles
  add column if not exists work_email text,
  add column if not exists github_username text,
  add column if not exists is_verified boolean default false,
  add column if not exists karma_points integer default 0,
  add column if not exists followers_count integer default 0,
  add column if not exists following_count integer default 0;

-- threads table
create table if not exists public.threads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text default 'General' not null,
  upvotes_count integer default 0 not null,
  comments_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS on Threads
alter table public.threads enable row level security;

drop policy if exists "Threads are viewable by everyone." on public.threads;
create policy "Threads are viewable by everyone." on public.threads
  for select using (true);

drop policy if exists "Authenticated users can create threads." on public.threads;
create policy "Authenticated users can create threads." on public.threads
  for insert with check (auth.uid() = user_id);

-- thread upvotes table
create table if not exists public.thread_upvotes (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(thread_id, user_id)
);

alter table public.thread_upvotes enable row level security;

drop policy if exists "Thread upvotes are viewable by everyone." on public.thread_upvotes;
create policy "Thread upvotes are viewable by everyone." on public.thread_upvotes
  for select using (true);

drop policy if exists "Authenticated users can upvote threads." on public.thread_upvotes;
create policy "Authenticated users can upvote threads." on public.thread_upvotes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove their thread upvote." on public.thread_upvotes;
create policy "Users can remove their thread upvote." on public.thread_upvotes
  for delete using (auth.uid() = user_id);

-- trigger to update thread upvotes count
create or replace function public.handle_thread_upvote_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.threads set upvotes_count = upvotes_count + 1 where id = new.thread_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.threads set upvotes_count = upvotes_count - 1 where id = old.thread_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_thread_upvote_change on public.thread_upvotes;
create trigger on_thread_upvote_change
  after insert or delete on public.thread_upvotes
  for each row execute procedure public.handle_thread_upvote_changes();

-- Add thread_id to comments table
alter table public.comments
  alter column product_id drop not null,
  add column if not exists thread_id uuid references public.threads(id) on delete cascade;

-- Update comments count trigger to handle thread comments
create or replace function public.handle_comment_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if (new.product_id is not null) then
      update public.products set comments_count = comments_count + 1 where id = new.product_id;
    elsif (new.thread_id is not null) then
      update public.threads set comments_count = comments_count + 1 where id = new.thread_id;
    end if;
    return new;
  elsif (TG_OP = 'DELETE') then
    if (old.product_id is not null) then
      update public.products set comments_count = comments_count - 1 where id = old.product_id;
    elsif (old.thread_id is not null) then
      update public.threads set comments_count = comments_count - 1 where id = old.thread_id;
    end if;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;
