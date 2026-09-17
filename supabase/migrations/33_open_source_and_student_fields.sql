-- Add is_open_source and school columns to products table
alter table public.products
  add column if not exists is_open_source boolean default false,
  add column if not exists school text;

-- Create indexes for quick filtering
create index if not exists products_open_source_idx on public.products(is_open_source);
create index if not exists products_school_idx on public.products(school);
