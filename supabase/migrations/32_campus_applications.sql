-- Create campus_applications table
create table if not exists public.campus_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  college_name text not null,
  email text not null,
  graduation_year text not null,
  social_link text,
  reason_to_join text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.campus_applications enable row level security;

-- Policies
create policy "Users can view their own campus applications" 
  on public.campus_applications for select using (auth.uid() = user_id);

create policy "Authenticated users can submit campus applications" 
  on public.campus_applications for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can update their own campus applications"
  on public.campus_applications for update using (auth.uid() = user_id);

create policy "Users can delete their own campus applications"
  on public.campus_applications for delete using (auth.uid() = user_id);
