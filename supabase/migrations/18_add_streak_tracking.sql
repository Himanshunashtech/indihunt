-- Migration 18: Add user streak tracking columns to profiles table
-- and a user_streak_history table for daily visit logs.

-- 1. Add streak columns to profiles if they don't already exist
alter table public.profiles
  add column if not exists streak_count integer default 0 not null,
  add column if not exists last_active_date date;

-- 2. user_streak_history table — records each daily visit for streak tracking
create table if not exists public.user_streak_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  visited_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, visited_date)
);

-- Enable RLS on user_streak_history
alter table public.user_streak_history enable row level security;

drop policy if exists "Streak history is viewable by the user." on public.user_streak_history;
create policy "Streak history is viewable by the user." on public.user_streak_history
  for select using (true);

drop policy if exists "Authenticated users can insert their streak history." on public.user_streak_history;
create policy "Authenticated users can insert their streak history." on public.user_streak_history
  for insert with check (auth.uid() = user_id);

-- 3. Function to update user streak when a daily visit is recorded
create or replace function public.update_user_streak(p_user_id uuid)
returns void as $$
declare
  v_today date := current_date;
  v_last_date date;
  v_current_streak integer;
begin
  -- Get current streak info
  select last_active_date, streak_count
  into v_last_date, v_current_streak
  from public.profiles
  where id = p_user_id;

  -- If already logged today, do nothing
  if v_last_date = v_today then
    return;
  end if;

  -- Insert visit record (ignore if already exists)
  insert into public.user_streak_history (user_id, visited_date)
  values (p_user_id, v_today)
  on conflict (user_id, visited_date) do nothing;

  -- Calculate new streak
  if v_last_date = v_today - interval '1 day' then
    -- Consecutive day — increment
    v_current_streak := coalesce(v_current_streak, 0) + 1;
  else
    -- Streak broken or first visit
    v_current_streak := 1;
  end if;

  -- Update profile
  update public.profiles
  set streak_count = v_current_streak,
      last_active_date = v_today
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.update_user_streak(uuid) to authenticated;
