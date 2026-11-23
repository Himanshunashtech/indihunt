-- Migration 66: Add vote tracking & trust scoring fields
-- Needed for: Voting / Anti-Fraud admin module

-- Add tracking fields to upvotes
ALTER TABLE upvotes ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE upvotes ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

-- Add trust/spam scores to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0;

-- Add vote velocity flag to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS vote_velocity_flag BOOLEAN DEFAULT FALSE;

-- Index for fraud queries
CREATE INDEX IF NOT EXISTS idx_upvotes_risk_score ON upvotes(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_upvotes_created_at_product ON upvotes(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score ON profiles(trust_score);
CREATE INDEX IF NOT EXISTS idx_profiles_spam_score ON profiles(spam_score DESC);
