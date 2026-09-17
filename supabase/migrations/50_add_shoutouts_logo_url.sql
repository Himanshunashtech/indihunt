-- Add logo_url column to product_shoutouts table
alter table public.product_shoutouts
  add column if not exists logo_url text;
