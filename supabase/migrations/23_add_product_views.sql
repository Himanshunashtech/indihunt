-- Migration 23: Add views_count column to products table
alter table public.products add column if not exists views_count integer default 0 not null;
