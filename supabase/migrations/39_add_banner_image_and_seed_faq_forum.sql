-- Migration 39: Add banner_image to forums table and seed the FAQ forum

-- Create forums table if it does not exist to ensure resilience
create table if not exists public.forums (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  is_product_forum boolean default false,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add banner_image column to forums table
alter table public.forums
  add column if not exists banner_image text;

-- Seed the FAQ forum into forums table
insert into public.forums (slug, name, description, icon, banner_image, is_product_forum)
values
  ('faq', 'FAQ', 'Frequently Asked Questions about IndiHunt', '❓', '/faq_banner.png', false)
on conflict (slug) do update
set
  banner_image = excluded.banner_image,
  description = excluded.description;
