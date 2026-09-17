-- Migration 05: Add unique constraint to website_url in products table

alter table public.products
  add constraint products_website_url_key unique (website_url);
