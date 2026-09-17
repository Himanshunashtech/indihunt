-- Migration 26: Populate profiles.work_email from auth.users email and update handle_new_user trigger
-- 1. Update the handle_new_user() trigger function to populate work_email on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, bio, is_maker, work_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Anonymous Maker'),
    new.raw_user_meta_data->>'avatar_url',
    'Launching awesome things!',
    true,
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Populate work_email for existing profiles that don't have it set yet
update public.profiles p
set work_email = u.email
from auth.users u
where p.id = u.id and (p.work_email is null or p.work_email = '');
