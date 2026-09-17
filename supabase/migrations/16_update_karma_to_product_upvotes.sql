-- Migration 16: Update handle_upvote_changes trigger to assign karma points to the product maker based on product upvotes
create or replace function public.handle_upvote_changes()
returns trigger as $$
declare
  v_maker_id uuid;
begin
  if (TG_OP = 'INSERT') then
    update public.products set upvotes_count = upvotes_count + 1 where id = new.product_id;
    
    -- Find the product maker
    select maker_id into v_maker_id from public.products where id = new.product_id;
    if (v_maker_id is not null) then
      update public.profiles set karma_points = karma_points + 1 where id = v_maker_id;
    end if;
    
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.products set upvotes_count = upvotes_count - 1 where id = old.product_id;
    
    -- Find the product maker
    select maker_id into v_maker_id from public.products where id = old.product_id;
    if (v_maker_id is not null) then
      update public.profiles set karma_points = karma_points - 1 where id = v_maker_id;
    end if;
    
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Remove karma points update from comment trigger (revert to only updating comments count)
create or replace function public.handle_comment_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if (new.product_id is not null) then
      update public.products set comments_count = comments_count + 1 where id = new.product_id;
    elsif (new.thread_id is not null) then
      update public.threads set comments_count = comments_count + 1 where id = new.thread_id;
    end if;
    return new;
  elsif (TG_OP = 'DELETE') then
    if (old.product_id is not null) then
      update public.products set comments_count = comments_count - 1 where id = old.product_id;
    elsif (old.thread_id is not null) then
      update public.threads set comments_count = comments_count - 1 where id = old.thread_id;
    end if;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Recalculate karma points for all users based on total upvotes received on their launched products
update public.profiles p
set karma_points = coalesce(
  (
    select sum(upvotes_count)
    from public.products prod
    where prod.maker_id = p.id
  ),
  0
);
