-- Migration 02: Add onboarding and social media fields to profiles table
alter table public.profiles
  add column if not exists linkedin_url text,
  add column if not exists twitter_url text,
  add column if not exists headline text,
  add column if not exists onboarding_completed boolean default false;
