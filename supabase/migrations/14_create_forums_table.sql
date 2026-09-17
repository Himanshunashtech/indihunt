-- Migration 14: Create forums table to organize topic and product forums
create table if not exists public.forums (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  is_product_forum boolean default false,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on forums
alter table public.forums enable row level security;

drop policy if exists "Forums are viewable by everyone." on public.forums;
create policy "Forums are viewable by everyone." on public.forums
  for select using (true);

drop policy if exists "Authenticated users can create forums." on public.forums;
create policy "Authenticated users can create forums." on public.forums
  for insert with check (auth.role() = 'authenticated');

-- Link threads to forums table
alter table public.threads
  add column if not exists forum_id uuid references public.forums(id) on delete cascade;

-- Seed the forums table
insert into public.forums (slug, name, description, icon, is_product_forum)
values
  ('all', 'All Discussions', 'View all community threads', '🌐', false),
  ('general', 'General', 'General chit-chat and startup discussions', '💬', false),
  ('vibecoding', 'Vibe Coding', 'Vibecoding workflows and AI assistance conversations', '💬', false),
  ('ama', 'AMA', 'Ask Me Anything threads with makers', '💬', false),
  ('introduce-yourself', 'Introduce Yourself', 'New members introducing themselves', '💬', false),
  ('self-promotion', 'Self Promotion', 'Share links and promote your projects', '💬', false)
on conflict (slug) do nothing;
