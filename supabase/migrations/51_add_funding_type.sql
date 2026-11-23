-- Add funding_type column to products table
alter table public.products
  add column if not exists funding_type text default 'bootstrapped';
