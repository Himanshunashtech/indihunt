-- Migration 90: Make product_id nullable in ad_campaigns so custom campaigns can be created without a pre-existing product
ALTER TABLE public.ad_campaigns ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_product_id_fkey;
ALTER TABLE public.ad_campaigns ADD CONSTRAINT ad_campaigns_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
