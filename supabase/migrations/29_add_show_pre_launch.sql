-- Migration 29: Add show_pre_launch column to products table

alter table public.products add column if not exists show_pre_launch boolean default false not null;
