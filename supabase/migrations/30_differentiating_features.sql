-- Create pgvector extension if not exists
create extension if not exists vector;

-- Add new columns to products
alter table public.products 
  add column if not exists is_student_project boolean default false,
  add column if not exists github_url text,
  add column if not exists video_url text,
  add column if not exists ai_summary text,
  add column if not exists views_count integer default 0,
  add column if not exists country text default 'Global',
  add column if not exists embedding vector(1536);

-- Add new columns to profiles
alter table public.profiles
  add column if not exists reputation_points integer default 0,
  add column if not exists country text default 'Global',
  add column if not exists badges text[] default '{}';

-- Create funding_announcements table
create table if not exists public.funding_announcements (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  amount text not null,
  round text not null,
  investor_names text[] default '{}',
  article_url text,
  announcement_date date default current_date,
  enriched_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.funding_announcements enable row level security;
create policy "Funding announcements are viewable by everyone." on public.funding_announcements for select using (true);
create policy "Authenticated users can submit funding." on public.funding_announcements for insert with check (auth.role() = 'authenticated');

-- Create jobs table
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  logo_url text,
  title text not null,
  description text not null,
  location text not null,
  type text not null, -- Full-time, Part-time, Remote, etc.
  salary_range text,
  equity_range text,
  tags text[] default '{}',
  apply_url text not null,
  maker_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.jobs enable row level security;
create policy "Jobs are viewable by everyone." on public.jobs for select using (true);
create policy "Makers can post jobs." on public.jobs for insert with check (auth.role() = 'authenticated');

-- Create investors table
create table if not exists public.investors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  avatar_url text,
  firm_name text,
  stage_focus text[] default '{}',
  sector_focus text[] default '{}',
  check_size text,
  linkedin_url text,
  website_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.investors enable row level security;
create policy "Investors are viewable by everyone." on public.investors for select using (true);

-- Create founder_matches table
create table if not exists public.founder_matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  role_offered text not null,
  role_sought text not null,
  bio text not null,
  skills text[] default '{}',
  interest_tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.founder_matches enable row level security;
create policy "Matches are viewable by everyone." on public.founder_matches for select using (true);
create policy "Users can manage their matchmaking profile." on public.founder_matches for all using (auth.uid() = user_id);

-- Create communities table
create table if not exists public.communities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  city text not null,
  country text not null,
  banner_url text,
  description text,
  members_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.communities enable row level security;
create policy "Communities are viewable by everyone." on public.communities for select using (true);

-- Create Indexes for scaling
create index if not exists products_country_idx on public.products(country);
create index if not exists products_student_idx on public.products(is_student_project);
create index if not exists profiles_reputation_idx on public.profiles(reputation_points);
