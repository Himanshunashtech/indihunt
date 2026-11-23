-- Migration 24: Add forum_follows table
create table if not exists public.forum_follows (
  id uuid default gen_random_uuid() primary key,
  forum_id text not null, -- The forum category id (e.g. 'vibecoding', 'General')
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(forum_id, user_id)
);

alter table public.forum_follows enable row level security;

drop policy if exists "Forum follows are viewable by everyone." on public.forum_follows;
create policy "Forum follows are viewable by everyone." on public.forum_follows
  for select using (true);

drop policy if exists "Authenticated users can toggle follow on forums." on public.forum_follows;
create policy "Authenticated users can toggle follow on forums." on public.forum_follows
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove their forum follow." on public.forum_follows;
create policy "Users can remove their forum follow." on public.forum_follows
  for delete using (auth.uid() = user_id);
