-- Migration 10: Add location column to profiles table
alter table public.profiles
  add column if not exists location text;
