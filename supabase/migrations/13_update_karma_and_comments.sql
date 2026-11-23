-- Migration 13: Update comments trigger to compute user karma points based on comments on products
create or replace function public.handle_comment_changes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if (new.product_id is not null) then
      update public.products set comments_count = comments_count + 1 where id = new.product_id;
      -- Increment karma points for comments on a product
      update public.profiles set karma_points = karma_points + 1 where id = new.user_id;
    elsif (new.thread_id is not null) then
      update public.threads set comments_count = comments_count + 1 where id = new.thread_id;
    end if;
    return new;
  elsif (TG_OP = 'DELETE') then
    if (old.product_id is not null) then
      update public.products set comments_count = comments_count - 1 where id = old.product_id;
      -- Decrement karma points for comments on a product
      update public.profiles set karma_points = karma_points - 1 where id = old.user_id;
    elsif (old.thread_id is not null) then
      update public.threads set comments_count = comments_count - 1 where id = old.thread_id;
    end if;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Recalculate karma points for all users based on existing comments on products
update public.profiles p
set karma_points = coalesce(
  (
    select count(*)
    from public.comments c
    where c.user_id = p.id and c.product_id is not null
  ),
  0
);
