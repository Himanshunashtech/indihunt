-- Migration 70: Editorial Features system
-- Needed for: Featured / Editorial admin module

CREATE TABLE IF NOT EXISTS editorial_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('todays_featured', 'weekly_featured', 'editors_pick', 'staff_pick', 'rising', 'trending')),
  admin_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate features of same type for same product on same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_features_unique
  ON editorial_features(product_id, feature_type, start_date);

CREATE INDEX IF NOT EXISTS idx_editorial_features_type_date
  ON editorial_features(feature_type, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_editorial_features_product
  ON editorial_features(product_id);

-- RLS
ALTER TABLE editorial_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read editorial features"
  ON editorial_features FOR SELECT USING (true);

CREATE POLICY "Admins can manage editorial features"
  ON editorial_features FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
