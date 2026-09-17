-- Migration 21: Add tags column to products and seed/update existing products with tags for analytics
alter table public.products
  add column if not exists tags text[] default '{}';

-- Seed tags for existing products so they show up beautifully on the analytics/insights charts
update public.products
set tags = array['AI', 'Productivity']
where name ilike '%AI%' or name ilike '%doc%' or name ilike '%fast%';

update public.products
set tags = array['Productivity', 'Developer Tools']
where name ilike '%cli%' or name ilike '%code%' or name ilike '%needle%';

update public.products
set tags = array['Developer Tools', 'SaaS']
where tags = '{}' or tags is null;
