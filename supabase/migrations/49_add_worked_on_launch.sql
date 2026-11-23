-- Add worked_on_launch column to products table to track Maker vs Hunter role
alter table public.products
  add column if not exists worked_on_launch boolean default true;
