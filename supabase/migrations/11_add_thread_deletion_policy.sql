-- Migration 11: Add thread deletion policy
drop policy if exists "Thread owners and product makers can delete threads." on public.threads;
create policy "Thread owners and product makers can delete threads." on public.threads
  for delete using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.products
      where public.products.id = public.threads.product_id
        and public.products.maker_id = auth.uid()
    )
  );
