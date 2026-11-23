-- Migration 86: Migrate Payments Infrastructure to Dodo Payments (Exclusive MoR)

-- 1. Extend ad_campaigns table with Dodo Payment tracking columns
alter table public.ad_campaigns
  add column if not exists dodo_payment_id text,
  add column if not exists dodo_customer_id text;

-- 2. Create or enhance payments table (with backward compatibility)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  campaign_id uuid references public.ad_campaigns(id) on delete set null,
  dodo_payment_id text,
  dodo_customer_id text,
  amount numeric(10, 2) not null,
  currency text default 'usd' not null,
  status text default 'succeeded' not null, -- succeeded, pending, failed, refunded
  payment_method text default 'dodo' not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on payments
alter table public.payments enable row level security;

-- Policies for payments
drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments" on public.payments
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own payments" on public.payments;
create policy "Users can insert their own payments" on public.payments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all payments" on public.payments;
create policy "Admins can view all payments" on public.payments
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Indexes for performance
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_campaign_id on public.payments(campaign_id);
create index if not exists idx_payments_dodo_payment_id on public.payments(dodo_payment_id);

-- 3. Also add dodo columns to existing polar_payments table if it already exists for zero-downtime compatibility
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'polar_payments') then
    alter table public.polar_payments add column if not exists dodo_payment_id text;
    alter table public.polar_payments add column if not exists dodo_customer_id text;
  end if;
end $$;
