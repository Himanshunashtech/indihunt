-- Migration 36: Add product scoring and featuring columns
alter table public.products
  add column if not exists featured boolean default false,
  add column if not exists quality_score integer default 0,
  add column if not exists engagement_score integer default 0,
  add column if not exists editor_pick boolean default false,
  add column if not exists never_feature boolean default false,
  add column if not exists featured_at timestamp with time zone;
