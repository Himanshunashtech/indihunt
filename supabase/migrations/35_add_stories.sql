-- Create stories table
create table public.stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  image_url text,
  category text default 'Makers' not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  excerpt text,
  published_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on stories
alter table public.stories enable row level security;

create policy "Stories are viewable by everyone." on public.stories
  for select using (true);

create policy "Authenticated users can create stories." on public.stories
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own stories." on public.stories
  for delete using (auth.uid() = user_id);

create policy "Users can update their own stories." on public.stories
  for update using (auth.uid() = user_id);


-- Create story_comments table
create table public.story_comments (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references public.stories(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.story_comments(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on story_comments
alter table public.story_comments enable row level security;

create policy "Story comments are viewable by everyone." on public.story_comments
  for select using (true);

create policy "Authenticated users can post story comments." on public.story_comments
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own story comments." on public.story_comments
  for delete using (auth.uid() = user_id);


-- Set up storage bucket for story-images
insert into storage.buckets (id, name, public) 
values ('story-images', 'story-images', true)
on conflict (id) do nothing;

-- Add RLS policies for storage bucket 'story-images'
create policy "Story images are publicly viewable" on storage.objects
  for select using (bucket_id = 'story-images');

create policy "Authenticated users can upload story images" on storage.objects
  for insert with check (
    bucket_id = 'story-images' 
    and auth.role() = 'authenticated'
  );

create policy "Users can delete their own story images" on storage.objects
  for delete using (
    bucket_id = 'story-images' 
    and auth.uid() = owner
  );
