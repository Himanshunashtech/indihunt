-- Migration 06: Create storage buckets for avatars and products, and set up policies

-- Enable storage if not enabled (usually standard in Supabase)
-- Insert buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Note: RLS is already enabled on storage.objects by default in Supabase.
-- Do NOT run: alter table storage.objects enable row level security;
-- (that table is owned by supabase_storage_admin, not the migration user)

-- Policies for public reading
create policy "Public Access to Avatars and Products"
on storage.objects for select
using ( bucket_id in ('avatars', 'products') );

-- Policies for uploading files (Authenticated users)
create policy "Authenticated Users Upload Files"
on storage.objects for insert
to authenticated
with check ( bucket_id in ('avatars', 'products') );

-- Policies for updating and deleting files (Owner check via file path)
-- Uses storage.foldername() to extract the user ID from the file path.
-- Files should be uploaded to paths like: {user_id}/filename
-- This avoids the owner vs owner_id column type ambiguity across Supabase versions.
create policy "Users Update and Delete Own Files"
on storage.objects for all
to authenticated
using ( (storage.foldername(name))[1] = auth.uid()::text )
with check ( (storage.foldername(name))[1] = auth.uid()::text );

