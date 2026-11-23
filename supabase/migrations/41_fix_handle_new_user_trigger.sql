-- Fix handle_new_user trigger function to support GitHub and other OAuth providers properly
create or replace function public.handle_new_user()
returns trigger as $$
declare
  val_username text;
begin
  val_username := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  -- Ensure username is unique by checking if it already exists
  if exists (select 1 from public.profiles where username = val_username) then
    val_username := val_username || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, full_name, avatar_url, bio, is_maker, work_email)
  values (
    new.id,
    val_username,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'Anonymous Maker'
    ),
    new.raw_user_meta_data->>'avatar_url',
    'Launching awesome things!',
    true,
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Retroactively create profiles for users who signed up but don't have a profile yet
insert into public.profiles (id, username, full_name, avatar_url, bio, is_maker, work_email)
select 
  u.id,
  coalesce(
    u.raw_user_meta_data->>'username',
    u.raw_user_meta_data->>'user_name',
    u.raw_user_meta_data->>'preferred_username',
    split_part(u.email, '@', 1),
    'user_' || substr(u.id::text, 1, 8)
  ) || case 
    when exists (select 1 from public.profiles p where p.username = coalesce(u.raw_user_meta_data->>'username', u.raw_user_meta_data->>'user_name', u.raw_user_meta_data->>'preferred_username', split_part(u.email, '@', 1), 'user_' || substr(u.id::text, 1, 8))) 
    then '_' || substr(u.id::text, 1, 4) 
    else '' 
  end,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Anonymous Maker'),
  u.raw_user_meta_data->>'avatar_url',
  'Launching awesome things!',
  true,
  u.email
from auth.users u
left join public.profiles p on u.id = p.id
where p.id is null;
