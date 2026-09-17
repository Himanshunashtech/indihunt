-- Migration 62: Add maker delete policy for products table
-- Allows makers to delete their own products (useful for pre-launch or scheduled launches)

DROP POLICY IF EXISTS "Makers can delete their own products" ON public.products;
CREATE POLICY "Makers can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = maker_id);
