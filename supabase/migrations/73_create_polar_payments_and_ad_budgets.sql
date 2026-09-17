-- Migration 73: Create Polar Payments and Ad Budget Tracking Tables

-- 1. Extend ad_campaigns with placement and targeting fields + Polar checkout IDs
alter table public.ad_campaigns 
  add column if not exists placement_product_pages boolean default true,
  add column if not exists placement_search boolean default true,
  add column if not exists placement_category boolean default true,
  add column if not exists placement_forums boolean default true,
  add column if not exists target_category text,
  add column if not exists target_country text,
  add column if not exists target_device text default 'all',
  add column if not exists polar_checkout_id text,
  add column if not exists polar_customer_id text;

-- 2. Create polar_payments table for storing payment history & webhooks
create table if not exists public.polar_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  campaign_id uuid references public.ad_campaigns(id) on delete set null,
  polar_checkout_id text,
  polar_order_id text,
  polar_customer_id text,
  amount numeric(10, 2) not null,
  currency text default 'usd' not null,
  status text default 'succeeded' not null, -- succeeded, pending, failed, refunded
  payment_method text default 'polar' not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on polar_payments
alter table public.polar_payments enable row level security;

-- Policies for polar_payments
drop policy if exists "Users can view their own polar payments" on public.polar_payments;
create policy "Users can view their own polar payments" on public.polar_payments
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own polar payments" on public.polar_payments;
create policy "Users can insert their own polar payments" on public.polar_payments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all polar payments" on public.polar_payments;
create policy "Admins can view all polar payments" on public.polar_payments
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Create ad_budget_transactions table for campaign budget logs
create table if not exists public.ad_budget_transactions (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.ad_campaigns(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  payment_id uuid references public.polar_payments(id) on delete set null,
  amount numeric(10, 2) not null,
  transaction_type text not null, -- topup, spend_deduction, refund, manual_override
  balance_after numeric(10, 2) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on ad_budget_transactions
alter table public.ad_budget_transactions enable row level security;

-- Policies for ad_budget_transactions
drop policy if exists "Users can view their campaign budget transactions" on public.ad_budget_transactions;
create policy "Users can view their campaign budget transactions" on public.ad_budget_transactions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert budget transactions" on public.ad_budget_transactions;
create policy "Users can insert budget transactions" on public.ad_budget_transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all budget transactions" on public.ad_budget_transactions;
create policy "Admins can view all budget transactions" on public.ad_budget_transactions
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Create Indexes for Scalability
create index if not exists idx_polar_payments_user_id on public.polar_payments(user_id);
create index if not exists idx_polar_payments_campaign_id on public.polar_payments(campaign_id);
create index if not exists idx_polar_payments_polar_checkout_id on public.polar_payments(polar_checkout_id);

create index if not exists idx_ad_budget_tx_campaign_id on public.ad_budget_transactions(campaign_id);
create index if not exists idx_ad_budget_tx_user_id on public.ad_budget_transactions(user_id);
