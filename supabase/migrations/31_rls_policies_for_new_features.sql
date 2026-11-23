-- Row Level Security policies for newly added tables

-- 1. Funding Announcements policies
alter table public.funding_announcements enable row level security;

-- Drop existing to avoid conflicts if already run
drop policy if exists "Funding announcements are viewable by everyone." on public.funding_announcements;
drop policy if exists "Authenticated users can submit funding." on public.funding_announcements;
drop policy if exists "Authenticated users can update funding." on public.funding_announcements;
drop policy if exists "Authenticated users can delete funding." on public.funding_announcements;

create policy "Funding announcements are viewable by everyone." 
  on public.funding_announcements for select using (true);

create policy "Authenticated users can submit funding." 
  on public.funding_announcements for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update funding." 
  on public.funding_announcements for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete funding." 
  on public.funding_announcements for delete using (auth.role() = 'authenticated');


-- 2. Jobs policies
alter table public.jobs enable row level security;

drop policy if exists "Jobs are viewable by everyone." on public.jobs;
drop policy if exists "Makers can post jobs." on public.jobs;
drop policy if exists "Makers can update their own jobs." on public.jobs;
drop policy if exists "Makers can delete their own jobs." on public.jobs;

create policy "Jobs are viewable by everyone." 
  on public.jobs for select using (true);

create policy "Makers can post jobs." 
  on public.jobs for insert with check (auth.role() = 'authenticated');

create policy "Makers can update their own jobs." 
  on public.jobs for update using (auth.uid() = maker_id);

create policy "Makers can delete their own jobs." 
  on public.jobs for delete using (auth.uid() = maker_id);


-- 3. Investors policies
alter table public.investors enable row level security;

drop policy if exists "Investors are viewable by everyone." on public.investors;
drop policy if exists "Authenticated users can add investors." on public.investors;
drop policy if exists "Authenticated users can update investors." on public.investors;
drop policy if exists "Authenticated users can delete investors." on public.investors;

create policy "Investors are viewable by everyone." 
  on public.investors for select using (true);

create policy "Authenticated users can add investors." 
  on public.investors for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update investors." 
  on public.investors for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete investors." 
  on public.investors for delete using (auth.role() = 'authenticated');


-- 4. Communities policies
alter table public.communities enable row level security;

drop policy if exists "Communities are viewable by everyone." on public.communities;
drop policy if exists "Authenticated users can create communities." on public.communities;
drop policy if exists "Authenticated users can update communities." on public.communities;
drop policy if exists "Authenticated users can delete communities." on public.communities;

create policy "Communities are viewable by everyone." 
  on public.communities for select using (true);

create policy "Authenticated users can create communities." 
  on public.communities for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update communities." 
  on public.communities for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete communities." 
  on public.communities for delete using (auth.role() = 'authenticated');


-- 5. Founder Matches policies
alter table public.founder_matches enable row level security;

drop policy if exists "Matches are viewable by everyone." on public.founder_matches;
drop policy if exists "Users can manage their matchmaking profile." on public.founder_matches;

create policy "Matches are viewable by everyone." 
  on public.founder_matches for select using (true);

create policy "Users can manage their matchmaking profile." 
  on public.founder_matches for all using (auth.uid() = user_id);
