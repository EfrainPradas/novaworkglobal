-- ============================================
-- Resume Builder V2 — Schema Migration
-- New tables + extensions for the 4-step workflow
-- ============================================

-- ============================================
-- 1. USER CONTACT PROFILE
-- ============================================
CREATE TABLE IF NOT EXISTS user_contact_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  contact_info_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_contact_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contact profile" ON user_contact_profile;
DROP POLICY IF EXISTS "Users can insert own contact profile" ON user_contact_profile;
DROP POLICY IF EXISTS "Users can update own contact profile" ON user_contact_profile;
DROP POLICY IF EXISTS "Users can delete own contact profile" ON user_contact_profile;

CREATE POLICY "Users can view own contact profile"
  ON user_contact_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contact profile"
  ON user_contact_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contact profile"
  ON user_contact_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contact profile"
  ON user_contact_profile FOR DELETE USING (auth.uid() = user_id);

SELECT '✅ 1/6 user_contact_profile created' as status;

-- ============================================
-- 2. POSITIONING QUESTIONNAIRE
-- ============================================
CREATE TABLE IF NOT EXISTS positioning_questionnaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  identity_current_title TEXT,
  identity_target_title TEXT,
  identity_one_phrase TEXT,
  years_experience_bucket TEXT CHECK (years_experience_bucket IN ('0-2','3-5','6-10','10-15','15+')),
  industries TEXT[],
  environments TEXT[],
  functions TEXT[],
  trusted_problems TEXT,
  impact_types TEXT[],
  scale_team_size TEXT,
  scale_budget TEXT,
  scale_geo_scope TEXT,
  scale_project_scale TEXT,
  strengths TEXT[],
  complexity_moment TEXT,
  colleagues_describe TEXT,
  differentiator TEXT,
  job_descriptions TEXT[],
  technical_skills_tools TEXT[],
  certifications_advanced_training TEXT[],
  platforms_systems TEXT[],
  methodologies TEXT[],
  languages_spoken TEXT[],
  top5_accomplishment_ids UUID[],
  largest_result TEXT,
  most_complex_project TEXT,
  stakeholder_exposure TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE positioning_questionnaire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own questionnaire" ON positioning_questionnaire;
DROP POLICY IF EXISTS "Users can insert own questionnaire" ON positioning_questionnaire;
DROP POLICY IF EXISTS "Users can update own questionnaire" ON positioning_questionnaire;
DROP POLICY IF EXISTS "Users can delete own questionnaire" ON positioning_questionnaire;

CREATE POLICY "Users can view own questionnaire"
  ON positioning_questionnaire FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own questionnaire"
  ON positioning_questionnaire FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questionnaire"
  ON positioning_questionnaire FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own questionnaire"
  ON positioning_questionnaire FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_user_id ON positioning_questionnaire(user_id);

SELECT '✅ 2/6 positioning_questionnaire created' as status;

-- ============================================
-- 3. GENERATED PROFESSIONAL PROFILE (versioned)
-- ============================================
CREATE TABLE IF NOT EXISTS generated_professional_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  questionnaire_id UUID REFERENCES positioning_questionnaire(id) ON DELETE SET NULL,
  output_identity_sentence TEXT,
  output_blended_value_sentence TEXT,
  output_competency_paragraph TEXT,
  output_areas_of_excellence TEXT,
  output_skills_section JSONB,
  edited_by_user BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_professional_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generated profile" ON generated_professional_profile;
DROP POLICY IF EXISTS "Users can insert own generated profile" ON generated_professional_profile;
DROP POLICY IF EXISTS "Users can update own generated profile" ON generated_professional_profile;
DROP POLICY IF EXISTS "Users can delete own generated profile" ON generated_professional_profile;

CREATE POLICY "Users can view own generated profile"
  ON generated_professional_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated profile"
  ON generated_professional_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generated profile"
  ON generated_professional_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated profile"
  ON generated_professional_profile FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gen_profile_user_id ON generated_professional_profile(user_id);

SELECT '✅ 3/6 generated_professional_profile created' as status;

-- ============================================
-- 4. ACCOMPLISHMENT-WORK EXPERIENCE LINK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accomplishment_work_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accomplishment_id UUID NOT NULL,
  work_experience_id UUID REFERENCES work_experience(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accomplishment_work_link ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own accomplishment links" ON accomplishment_work_link;
DROP POLICY IF EXISTS "Users can insert own accomplishment links" ON accomplishment_work_link;
DROP POLICY IF EXISTS "Users can delete own accomplishment links" ON accomplishment_work_link;

CREATE POLICY "Users can view own accomplishment links"
  ON accomplishment_work_link FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishment_work_link.work_experience_id
    AND ur.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own accomplishment links"
  ON accomplishment_work_link FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishment_work_link.work_experience_id
    AND ur.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own accomplishment links"
  ON accomplishment_work_link FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishment_work_link.work_experience_id
    AND ur.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_acc_work_link_acc ON accomplishment_work_link(accomplishment_id);
CREATE INDEX IF NOT EXISTS idx_acc_work_link_we ON accomplishment_work_link(work_experience_id);

SELECT '✅ 4/6 accomplishment_work_link created' as status;

-- ============================================
-- 5. EXTEND EXISTING TABLES
-- ============================================

-- Add columns to work_experience
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_experience' AND column_name = 'role_explanation'
  ) THEN
    ALTER TABLE work_experience ADD COLUMN role_explanation TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_experience' AND column_name = 'scope_metrics'
  ) THEN
    ALTER TABLE work_experience ADD COLUMN scope_metrics JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_experience' AND column_name = 'industry_tags'
  ) THEN
    ALTER TABLE work_experience ADD COLUMN industry_tags TEXT[];
  END IF;
END $$;

-- Add columns to par_stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'par_stories' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE par_stories ADD COLUMN source_type TEXT DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'par_stories' AND column_name = 'status'
  ) THEN
    ALTER TABLE par_stories ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'par_stories' AND column_name = 'skills_tags'
  ) THEN
    ALTER TABLE par_stories ADD COLUMN skills_tags TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'par_stories' AND column_name = 'title'
  ) THEN
    ALTER TABLE par_stories ADD COLUMN title TEXT;
  END IF;
END $$;

SELECT '✅ 5/6 Existing tables extended' as status;

-- ============================================
-- 6. UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_contact_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_profile_updated_at ON user_contact_profile;
CREATE TRIGGER trigger_update_contact_profile_updated_at
  BEFORE UPDATE ON user_contact_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_profile_updated_at();

CREATE OR REPLACE FUNCTION update_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_questionnaire_updated_at ON positioning_questionnaire;
CREATE TRIGGER trigger_update_questionnaire_updated_at
  BEFORE UPDATE ON positioning_questionnaire
  FOR EACH ROW
  EXECUTE FUNCTION update_questionnaire_updated_at();

CREATE OR REPLACE FUNCTION update_gen_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gen_profile_updated_at ON generated_professional_profile;
CREATE TRIGGER trigger_update_gen_profile_updated_at
  BEFORE UPDATE ON generated_professional_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_gen_profile_updated_at();

SELECT '✅ 6/6 Triggers created' as status;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT '🎉 Resume Builder V2 Migration Complete!' as status;
