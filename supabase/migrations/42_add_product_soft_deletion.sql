-- Migration 42: Add product soft-deletion columns and cleanup routine
alter table public.products
add column if not exists is_deleted boolean default false,
add column if not exists deleted_at timestamp with time zone,
add column if not exists scheduled_deletion_date timestamp with time zone,
add column if not exists deletion_reason text,
add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

-- Index for fast soft-delete queries
create index if not exists idx_products_is_deleted on public.products(is_deleted);
create index if not exists idx_products_scheduled_deletion on public.products(scheduled_deletion_date) where scheduled_deletion_date is not null;

-- Function: mark scheduled products as soft-deleted after 7 days
create or replace function public.process_scheduled_product_deletions()
returns void as $$
begin
  update public.products
  set is_deleted = true,
      deleted_at = now()
  where scheduled_deletion_date <= now()
    and is_deleted = false
    and scheduled_deletion_date is not null;
end;
$$ language plpgsql security definer;

-- Schedule with pg_cron (runs every hour — enable pg_cron extension first if not already)
-- Uncomment the line below after enabling the pg_cron extension in Supabase dashboard:
-- select cron.schedule('process-product-deletions', '0 * * * *', 'select public.process_scheduled_product_deletions()');
