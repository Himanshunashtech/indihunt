-- Migration 72: Add IndiHunt Page fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS indie_page_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS indie_page_theme TEXT DEFAULT 'light',
ADD COLUMN IF NOT EXISTS indie_page_font TEXT DEFAULT 'inter',
ADD COLUMN IF NOT EXISTS monthly_revenue TEXT DEFAULT NULL;
