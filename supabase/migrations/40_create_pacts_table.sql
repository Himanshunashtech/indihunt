-- Create Pacts Table
create table if not exists public.pacts (
  id uuid default gen_random_uuid() primary key,
  user_1 uuid references public.profiles(id) on delete cascade,
  user_2 uuid references public.profiles(id) on delete cascade,
  product_1 uuid references public.products(id) on delete cascade,
  product_2 uuid references public.products(id) on delete cascade,
  status varchar(50) default 'active', -- 'active', 'completed', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_1, user_2)
);

-- Enable RLS
alter table public.pacts enable row level security;

-- Policies
create policy "Allow public read access to pacts" on public.pacts
  for select using (true);

create policy "Allow users to update their own pacts" on public.pacts
  for update using (auth.uid() = user_1 or auth.uid() = user_2);

create policy "Allow users to insert pacts" on public.pacts
  for insert with check (auth.uid() = user_1 or auth.uid() = user_2);

-- Automatic Pact Creation Trigger Function
create or replace function public.check_and_create_pact()
returns trigger as $$
declare
  product_maker_id uuid;
  partner_product_id uuid;
  my_product_id uuid;
begin
  -- 1. Find the maker of the newly upvoted product
  select maker_id into product_maker_id 
  from public.products 
  where id = NEW.product_id;

  if product_maker_id is null or product_maker_id = NEW.user_id then
    return NEW;
  end if;

  -- 2. Check if the product maker has upvoted any product belonging to the current upvoter (NEW.user_id)
  -- Find a product launched by the current upvoter (NEW.user_id) that has been upvoted by product_maker_id
  select p.id into my_product_id
  from public.products p
  join public.upvotes u on u.product_id = p.id
  where p.maker_id = NEW.user_id 
    and u.user_id = product_maker_id
  limit 1;

  -- 3. If a mutual upvote exists, create a pact
  if my_product_id is not null then
    insert into public.pacts (user_1, user_2, product_1, product_2, status)
    values (NEW.user_id, product_maker_id, my_product_id, NEW.product_id, 'active')
    on conflict (user_1, user_2) do nothing;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger on upvotes
create or replace trigger on_upvote_create_pact
  after insert on public.upvotes
  for each row execute function public.check_and_create_pact();
