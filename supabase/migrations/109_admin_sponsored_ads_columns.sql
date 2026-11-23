-- Migration 109: Ensure ad_campaigns has metadata columns for admin sponsored ads
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS placement_product_pages BOOLEAN DEFAULT true;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS placement_feed BOOLEAN DEFAULT true;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS placement_search BOOLEAN DEFAULT true;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS placement_category BOOLEAN DEFAULT true;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS placement_forums BOOLEAN DEFAULT true;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS target_device TEXT DEFAULT 'all';
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS target_country TEXT;

