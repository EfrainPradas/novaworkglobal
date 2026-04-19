-- Smart Match CV Versions: tailored CV derived from a saved brief.
-- Generated when a user marks a brief as 'saved'. One row per brief.
-- Neutral vocabulary only (positioning_angle_used, what_they_seek_used).

CREATE TABLE IF NOT EXISTS smart_match_cv_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES smart_match_briefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  master_resume_id UUID REFERENCES user_resumes(id) ON DELETE SET NULL,
  profile_summary_tailored TEXT,
  bullets_tailored JSONB NOT NULL DEFAULT '[]'::jsonb,
  positioning_angle_used TEXT,
  what_they_seek_used TEXT,
  top_role_title_used TEXT,
  generation_prompt TEXT,
  generation_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT smart_match_cv_versions_brief_unique UNIQUE (brief_id)
);

CREATE INDEX IF NOT EXISTS idx_smart_match_cv_versions_user
  ON smart_match_cv_versions(user_id);

ALTER TABLE smart_match_cv_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cv versions" ON smart_match_cv_versions;
DROP POLICY IF EXISTS "Users can insert own cv versions" ON smart_match_cv_versions;
DROP POLICY IF EXISTS "Users can update own cv versions" ON smart_match_cv_versions;
DROP POLICY IF EXISTS "Users can delete own cv versions" ON smart_match_cv_versions;

CREATE POLICY "Users can view own cv versions"
  ON smart_match_cv_versions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cv versions"
  ON smart_match_cv_versions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cv versions"
  ON smart_match_cv_versions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cv versions"
  ON smart_match_cv_versions FOR DELETE USING (auth.uid() = user_id);
