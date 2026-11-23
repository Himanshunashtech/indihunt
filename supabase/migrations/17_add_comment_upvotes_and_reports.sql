-- Migration 17: Add comment_upvotes and comment_reports tables
-- These support Upvote, Reply (already exists via parent_id), and Report on each comment.

-- ============================================================
-- CURRENT SCHEMA SUMMARY (as of migration 16)
-- ============================================================
-- profiles          : id, username, full_name, avatar_url, bio, website, is_maker,
--                     work_email, github_username, is_verified, karma_points,
--                     followers_count, following_count, headline, twitter_url,
--                     linkedin_url, location, onboarding_completed, streak_count,
--                     last_active_date, created_at
--
-- products          : id, name, tagline, description, website_url, logo_url,
--                     screenshots, maker_id, upvotes_count, comments_count, created_at
--
-- upvotes           : id, product_id, user_id, created_at  [unique(product_id, user_id)]
--
-- comments          : id, product_id (nullable), thread_id (nullable), user_id,
--                     parent_id (self-ref), body, created_at
--
-- threads           : id, title, body, user_id, category, upvotes_count,
--                     comments_count, product_id, created_at
--
-- thread_upvotes    : id, thread_id, user_id, created_at  [unique(thread_id, user_id)]
--
-- reviews           : id, product_id, user_id, rating, body, created_at
--                     [unique(product_id, user_id)]
--
-- product_alternatives     : id, product_id, alternative_id, created_by, votes_count, created_at
-- product_alternative_votes: id, alternative_id, user_id, created_at
--
-- reports           : id, product_id, user_id, reason, description, created_at
--
-- product_follows   : id, product_id, user_id, created_at  [unique(product_id, user_id)]
-- user_follows      : id, follower_id, following_id, created_at
--
-- collections       : id, name, description, user_id, created_at
-- collection_products: id, collection_id, product_id, created_at
-- user_stacks       : id, user_id, product_id, created_at
-- ============================================================


-- 1. Add upvotes_count column to comments table
alter table public.comments
  add column if not exists upvotes_count integer default 0 not null;


-- 2. comment_upvotes table
create table if not exists public.comment_upvotes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(comment_id, user_id)
);

-- Enable RLS on comment_upvotes
alter table public.comment_upvotes enable row level security;

drop policy if exists "Comment upvotes are viewable by everyone." on public.comment_upvotes;
create policy "Comment upvotes are viewable by everyone." on public.comment_upvotes
  for select using (true);

drop policy if exists "Authenticated users can upvote comments." on public.comment_upvotes;
create policy "Authenticated users can upvote comments." on public.comment_upvotes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove their comment upvote." on public.comment_upvotes;
create policy "Users can remove their comment upvote." on public.comment_upvotes
  for delete using (auth.uid() = user_id);


-- 3. Trigger: update upvotes_count on comments when a comment_upvote is inserted/deleted
create or replace function public.handle_comment_upvote_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.comments set upvotes_count = upvotes_count + 1 where id = new.comment_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.comments set upvotes_count = greatest(upvotes_count - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_upvote_change on public.comment_upvotes;
create trigger on_comment_upvote_change
  after insert or delete on public.comment_upvotes
  for each row execute procedure public.handle_comment_upvote_changes();


-- 4. comment_reports table
create table if not exists public.comment_reports (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null default 'spam',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(comment_id, user_id)
);

-- Enable RLS on comment_reports
alter table public.comment_reports enable row level security;

drop policy if exists "Comment reports can be inserted by authenticated users." on public.comment_reports;
create policy "Comment reports can be inserted by authenticated users." on public.comment_reports
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Comment reports are viewable by everyone." on public.comment_reports;
create policy "Comment reports are viewable by everyone." on public.comment_reports
  for select using (true);
