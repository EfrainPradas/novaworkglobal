-- Smart Matches pilot: stores curated company matches per user
-- Neutral vocabulary enforced at write time (snapshot_neutral JSONB).

CREATE TABLE IF NOT EXISTS smart_match_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  match_score NUMERIC NOT NULL,
  match_rationale TEXT,
  snapshot_neutral JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT smart_match_briefs_status_check
    CHECK (status IN ('proposed','saved','dismissed')),
  CONSTRAINT smart_match_briefs_user_company_unique
    UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_smart_match_briefs_user
  ON smart_match_briefs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_smart_match_briefs_user_score
  ON smart_match_briefs(user_id, match_score DESC);

ALTER TABLE smart_match_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own smart match briefs" ON smart_match_briefs;
DROP POLICY IF EXISTS "Users can insert own smart match briefs" ON smart_match_briefs;
DROP POLICY IF EXISTS "Users can update own smart match briefs" ON smart_match_briefs;
DROP POLICY IF EXISTS "Users can delete own smart match briefs" ON smart_match_briefs;

CREATE POLICY "Users can view own smart match briefs"
  ON smart_match_briefs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smart match briefs"
  ON smart_match_briefs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart match briefs"
  ON smart_match_briefs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart match briefs"
  ON smart_match_briefs FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_smart_match_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_smart_match_briefs_updated_at ON smart_match_briefs;
CREATE TRIGGER trg_smart_match_briefs_updated_at
  BEFORE UPDATE ON smart_match_briefs
  FOR EACH ROW EXECUTE FUNCTION set_smart_match_briefs_updated_at();
