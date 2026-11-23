-- Migration 67: Leaderboard manual overrides
-- Needed for: Leaderboard Management admin module

CREATE TABLE IF NOT EXISTS leaderboard_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL CHECK (reason IN ('editorial_selection', 'fraud_correction', 'other')),
  override_type TEXT NOT NULL CHECK (override_type IN ('pin', 'boost', 'suppress')),
  rank_position INTEGER,
  notes TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active overrides
CREATE INDEX IF NOT EXISTS idx_leaderboard_overrides_active
  ON leaderboard_overrides(expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_overrides_product
  ON leaderboard_overrides(product_id);

-- RLS
ALTER TABLE leaderboard_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leaderboard overrides"
  ON leaderboard_overrides FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
