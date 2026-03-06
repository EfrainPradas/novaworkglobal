-- ============================================================================
-- NovaWork — Coach RLS Policies for Client Data Access
-- ============================================================================
-- Allows coaches to READ data from their assigned clients' tables.
-- Coach assignment is verified through the coach_clients table.
-- Run this in Supabase SQL Editor AFTER CREATE_COACHING_TABLES.sql
-- ============================================================================

-- Helper function: Returns TRUE if the current user is the assigned coach for a given client
CREATE OR REPLACE FUNCTION is_coach_of(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_id = auth.uid()
      AND client_id = p_client_id
      AND status IN ('active', 'paused')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── user_profiles ──────────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client profiles"
  ON user_profiles FOR SELECT
  USING (is_coach_of(user_id));

-- ── user_resumes ───────────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client resumes"
  ON user_resumes FOR SELECT
  USING (is_coach_of(user_id));

-- ── work_experience ────────────────────────────────────────────
-- work_experience uses resume_id which can be either a resume UUID or user UUID (legacy)
-- We need a broader policy that checks both cases
CREATE POLICY "Coaches can view assigned client work experience"
  ON work_experience FOR SELECT
  USING (
    is_coach_of(resume_id) OR
    EXISTS (
      SELECT 1 FROM user_resumes ur
      WHERE ur.id = work_experience.resume_id
        AND is_coach_of(ur.user_id)
    )
  );

-- ── education ──────────────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client education"
  ON education FOR SELECT
  USING (is_coach_of(user_id));

-- ── certifications ─────────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client certifications"
  ON certifications FOR SELECT
  USING (is_coach_of(user_id));

-- ── par_stories (CAR stories) ──────────────────────────────────
CREATE POLICY "Coaches can view assigned client par stories"
  ON par_stories FOR SELECT
  USING (is_coach_of(user_id));

-- ── accomplishment_bank ────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client accomplishment bank"
  ON accomplishment_bank FOR SELECT
  USING (is_coach_of(user_id));

-- ── positioning_questionnaire (may not exist yet) ──────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positioning_questionnaire') THEN
    EXECUTE 'CREATE POLICY "Coaches can view assigned client questionnaire" ON positioning_questionnaire FOR SELECT USING (is_coach_of(user_id))';
  END IF;
END $$;

-- ── generated_professional_profile (may not exist yet) ─────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_professional_profile') THEN
    EXECUTE 'CREATE POLICY "Coaches can view assigned client generated profile" ON generated_professional_profile FOR SELECT USING (is_coach_of(user_id))';
  END IF;
END $$;

-- ── tailored_resumes ───────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client tailored resumes"
  ON tailored_resumes FOR SELECT
  USING (is_coach_of(user_id));

-- ── user_skills ────────────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client skills"
  ON user_skills FOR SELECT
  USING (is_coach_of(user_id));

-- ── user_interests ─────────────────────────────────────────────
CREATE POLICY "Coaches can view assigned client interests"
  ON user_interests FOR SELECT
  USING (is_coach_of(user_id));

-- ── ideal_work_preferences ─────────────────────────────────────
CREATE POLICY "Coaches can view assigned client work preferences"
  ON ideal_work_preferences FOR SELECT
  USING (is_coach_of(user_id));

-- ── career_vision_profiles ─────────────────────────────────────
CREATE POLICY "Coaches can view assigned client vision profiles"
  ON career_vision_profiles FOR SELECT
  USING (is_coach_of(user_id));

-- ── job_history_analysis ───────────────────────────────────────
CREATE POLICY "Coaches can view assigned client job history analysis"
  ON job_history_analysis FOR SELECT
  USING (is_coach_of(user_id));

-- ── users (coaches need basic info from user table) ────────────
CREATE POLICY "Coaches can view assigned client user info"
  ON users FOR SELECT
  USING (is_coach_of(id));

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE 'Coaches can view assigned%'
ORDER BY tablename;
