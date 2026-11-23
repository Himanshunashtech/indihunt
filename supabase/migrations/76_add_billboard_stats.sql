-- Migration to add analytics stats to billboard_ads table

ALTER TABLE public.billboard_ads 
ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks_count INT DEFAULT 0;
