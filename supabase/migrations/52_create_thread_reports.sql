-- Migration 52: Create thread_reports table for discussion thread reporting
-- Follows the same pattern as comment_reports (migration 17)

create table if not exists public.thread_reports (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null default 'spam',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(thread_id, user_id)
);

-- Enable RLS
alter table public.thread_reports enable row level security;

-- Policies
drop policy if exists "Thread reports can be inserted by authenticated users." on public.thread_reports;
create policy "Thread reports can be inserted by authenticated users." on public.thread_reports
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Thread reports are viewable by everyone." on public.thread_reports;
create policy "Thread reports are viewable by everyone." on public.thread_reports
  for select using (true);
