-- Migration 25: Add search indexes for products and profiles (Trigram & B-tree)
create extension if not exists pg_trgm;

-- 1. Profiles Table Indexes for Instant Email / Username Search
create index if not exists idx_profiles_username_btree on public.profiles (username);
create index if not exists idx_profiles_work_email_btree on public.profiles (work_email);

-- Trigram index for partial/fuzzy profile searches
create index if not exists idx_profiles_username_trgm on public.profiles using gin (username gin_trgm_ops);
create index if not exists idx_profiles_work_email_trgm on public.profiles using gin (work_email gin_trgm_ops);

-- 2. Products Table Indexes for Instant Keyword / Tagline Search
create index if not exists idx_products_website_url_btree on public.products (website_url);

-- Trigram index for fuzzy searching products by name and tagline
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists idx_products_tagline_trgm on public.products using gin (tagline gin_trgm_ops);
