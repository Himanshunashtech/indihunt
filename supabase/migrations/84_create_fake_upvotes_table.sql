-- Migration 84: Create fake_upvotes table and settings for daily product growth boost
-- Needed for: Growth Engine / Daily Products Simulated Upvotes

CREATE TABLE IF NOT EXISTS fake_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  fake_count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 150,
  launch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  growth_rate INTEGER NOT NULL DEFAULT 7,
  last_incremented_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on product_id and launch_date for high performance lookups
CREATE INDEX IF NOT EXISTS idx_fake_upvotes_product_id ON fake_upvotes(product_id);
CREATE INDEX IF NOT EXISTS idx_fake_upvotes_launch_date ON fake_upvotes(launch_date);

-- Enable RLS
ALTER TABLE fake_upvotes ENABLE ROW LEVEL SECURITY;

-- Public can read fake upvotes (needed for combined feed counts)
CREATE POLICY "Public can view fake upvotes"
  ON fake_upvotes FOR SELECT
  USING (true);

-- Admins have full access
CREATE POLICY "Admins can manage fake upvotes"
  ON fake_upvotes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Seed feature flag and platform settings if not exists
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('fake_upvotes_enabled', true, 'Simulate and boost upvotes for daily launched products')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO platform_settings (key, value, category, description) VALUES
  ('fake_upvotes_min_target', '70', 'voting', 'Minimum target fake upvotes for a product'),
  ('fake_upvotes_max_target', '280', 'voting', 'Maximum target fake upvotes for a product'),
  ('fake_upvotes_start_hour', '2', 'voting', 'Start hour for daily upvote growth (0-23, e.g. 2 for 2 AM)'),
  ('fake_upvotes_end_hour', '20', 'voting', 'End hour for daily upvote growth (0-23, e.g. 20 for 8 PM)'),
  ('fake_upvotes_interval_mins', '30', 'voting', 'Interval in minutes between upvote increments')
ON CONFLICT (key) DO NOTHING;
