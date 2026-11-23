-- Migration 04: Add multi-step wizard fields to products table

alter table public.products
  add column if not exists pricing_type text default 'free',
  add column if not exists promo_offer text,
  add column if not exists promo_code text,
  add column if not exists promo_expiry text,
  add column if not exists video_url text,
  add column if not exists demo_url text,
  add column if not exists status text default 'live',
  add column if not exists scheduled_for timestamp with time zone,
  add column if not exists makers uuid[] default '{}';
