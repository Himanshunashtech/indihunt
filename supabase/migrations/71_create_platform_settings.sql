-- Migration 71: Platform Settings & Feature Flags
-- Needed for: Platform Settings admin module

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can manage feature flags"
  ON feature_flags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Seed default settings
INSERT INTO platform_settings (key, value, category, description) VALUES
  ('site_name', '"IndiHunt"', 'general', 'Platform name'),
  ('site_tagline', '"Discover & launch indie products built by Indian makers"', 'general', 'Platform tagline'),
  ('maintenance_mode', 'false', 'general', 'Enable maintenance mode'),
  ('max_products_per_user_per_day', '3', 'launch_rules', 'Max products a user can launch per day'),
  ('min_description_length', '50', 'launch_rules', 'Minimum product description length'),
  ('vote_cooldown_seconds', '0', 'voting', 'Cooldown between votes in seconds'),
  ('max_votes_per_user_per_day', '50', 'voting', 'Max votes per user per day'),
  ('auto_hide_report_threshold', '5', 'moderation', 'Number of reports before auto-hiding'),
  ('spam_keywords', '[]', 'moderation', 'JSON array of spam keywords to check')
ON CONFLICT (key) DO NOTHING;

-- Seed default feature flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('ai_moderation', false, 'AI-powered content moderation'),
  ('ad_engine', true, 'Self-serve advertising engine'),
  ('comments', true, 'Product comments'),
  ('product_reviews', true, 'Product reviews and ratings'),
  ('referral_system', false, 'User referral program'),
  ('new_leaderboard', false, 'New leaderboard ranking algorithm'),
  ('stories', true, 'Maker stories feature'),
  ('newsletter', true, 'Newsletter subscription')
ON CONFLICT (key) DO NOTHING;
