-- Add college_id and college_email columns to campus_applications table
alter table public.campus_applications
  add column if not exists college_id text not null default '',
  add column if not exists college_email text not null default '';

-- Remove default constraints so new inserts require these values
alter table public.campus_applications
  alter column college_id drop default,
  alter column college_email drop default;
