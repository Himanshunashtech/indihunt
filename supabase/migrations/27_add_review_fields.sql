-- Add advanced review fields to reviews table
alter table public.reviews
  add column if not exists easy_to_use integer check (easy_to_use >= 1 and easy_to_use <= 5),
  add column if not exists customizable integer check (customizable >= 1 and customizable <= 5),
  add column if not exists reliable integer check (reliable >= 1 and reliable <= 5),
  add column if not exists value_for_money integer check (value_for_money >= 1 and value_for_money <= 5),
  add column if not exists pros text[] default '{}',
  add column if not exists cons text[] default '{}',
  add column if not exists helpful_votes integer default 0,
  add column if not exists views integer default 0,
  add column if not exists alternatives_vs text;
