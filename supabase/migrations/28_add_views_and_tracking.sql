-- Migration 28: Add views tracking table and views columns to threads/comments

-- Add views_count column to threads table if it doesn't exist
alter table public.threads add column if not exists views_count integer default 0 not null;

-- Add views_count column to comments table if it doesn't exist
alter table public.comments add column if not exists views_count integer default 0 not null;

-- Create views tracking table
create table if not exists public.views (
  id uuid default gen_random_uuid() primary key,
  item_type text not null, -- 'product', 'thread', 'comment', 'review'
  item_id text not null,
  viewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on views
alter table public.views enable row level security;

-- Policies for views
drop policy if exists "Views are viewable by everyone" on public.views;
create policy "Views are viewable by everyone" on public.views for select using (true);

drop policy if exists "Anyone can record a view" on public.views;
create policy "Anyone can record a view" on public.views for insert with check (true);

-- Function to increment view counts and record view
create or replace function public.record_view(
  p_item_type text,
  p_item_id text,
  p_viewer_id uuid default null
) returns void as $$
declare
  v_uuid_id uuid;
begin
  -- Try to parse as UUID if possible
  begin
    v_uuid_id := p_item_id::uuid;
  exception when others then
    v_uuid_id := null;
  end;

  -- Record in views table
  insert into public.views (item_type, item_id, viewer_id)
  values (p_item_type, p_item_id, p_viewer_id);

  -- Increment counter in respective table
  if p_item_type = 'product' and v_uuid_id is not null then
    update public.products
    set views_count = views_count + 1
    where id = v_uuid_id;
  elsif p_item_type = 'thread' and v_uuid_id is not null then
    update public.threads
    set views_count = views_count + 1
    where id = v_uuid_id;
  elsif p_item_type = 'comment' and v_uuid_id is not null then
    update public.comments
    set views_count = views_count + 1
    where id = v_uuid_id;
  elsif p_item_type = 'review' and v_uuid_id is not null then
    update public.reviews
    set views = views + 1
    where id = v_uuid_id;
  end if;
end;
$$ language plpgsql security definer;
