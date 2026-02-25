-- 1. FIX EDUCATION TABLE
-- Add missing columns or aliases to match WorkHistoryIntake.tsx extraction
DO $$ 
BEGIN
  -- Add degree if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='degree') THEN
    ALTER TABLE education ADD COLUMN degree TEXT;
  END IF;

  -- Add institution if missing (some schemas use institution_name)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='institution') THEN
    ALTER TABLE education ADD COLUMN institution TEXT;
  END IF;

  -- Add field_of_study if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='field_of_study') THEN
    ALTER TABLE education ADD COLUMN field_of_study TEXT;
  END IF;

  -- Add degree_title if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='degree_title') THEN
    ALTER TABLE education ADD COLUMN degree_title TEXT;
  END IF;

  -- Add graduation_year if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='graduation_year') THEN
    ALTER TABLE education ADD COLUMN graduation_year TEXT;
  END IF;

  -- Sync data from existing columns if they exist
  -- Try to populate 'degree' from 'degree_type' or 'degree_title'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='degree_type') THEN
    UPDATE education SET degree = degree_type WHERE degree IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='degree_title') THEN
    UPDATE education SET degree = degree_title WHERE degree IS NULL;
  END IF;

  -- Try to populate 'institution' from 'institution_name'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='institution_name') THEN
    UPDATE education SET institution = institution_name WHERE institution IS NULL;
  END IF;
END $$;

-- 2. FIX CERTIFICATIONS TABLE
DO $$
BEGIN
  -- Add certifications table if it doesn't exist at all (missing in some base schemas)
  CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    certification_name TEXT,
    name TEXT,
    issuing_organization TEXT,
    issue_date TEXT,
    year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Add name if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='certifications' AND column_name='name') THEN
    ALTER TABLE certifications ADD COLUMN name TEXT;
  END IF;

  -- Add year if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='certifications' AND column_name='year') THEN
    ALTER TABLE certifications ADD COLUMN year TEXT;
  END IF;

  -- Sync data
  UPDATE certifications SET name = certification_name WHERE name IS NULL AND certification_name IS NOT NULL;
  UPDATE certifications SET year = issue_date WHERE year IS NULL AND issue_date IS NOT NULL;
END $$;

-- 3. ENSURE RLS FOR ALL RELEVANT TABLES
-- Sometimes resume_id based policies are tricky if user_resumes is not searched correctly

-- Education
DROP POLICY IF EXISTS "Users can view own education" ON education;
CREATE POLICY "Users can view own education" ON education FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = education.resume_id AND user_resumes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own education" ON education;
CREATE POLICY "Users can insert own education" ON education FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = education.resume_id AND user_resumes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own education" ON education;
CREATE POLICY "Users can update own education" ON education FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = education.resume_id AND user_resumes.user_id = auth.uid()));

-- Certifications
DROP POLICY IF EXISTS "Users can view own certifications" ON certifications;
CREATE POLICY "Users can view own certifications" ON certifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = certifications.resume_id AND user_resumes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own certifications" ON certifications;
CREATE POLICY "Users can insert own certifications" ON certifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = certifications.resume_id AND user_resumes.user_id = auth.uid()));

-- Work Experience
DROP POLICY IF EXISTS "Users can view own work experience" ON work_experience;
CREATE POLICY "Users can view own work experience" ON work_experience FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = work_experience.resume_id AND user_resumes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own work experience" ON work_experience;
CREATE POLICY "Users can insert own work experience" ON work_experience FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = work_experience.resume_id AND user_resumes.user_id = auth.uid()));

-- Accomplishments
DROP POLICY IF EXISTS "Users can view own accomplishments" ON accomplishments;
CREATE POLICY "Users can view own accomplishments" ON accomplishments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishments.work_experience_id AND ur.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own accomplishments" ON accomplishments;
CREATE POLICY "Users can insert own accomplishments" ON accomplishments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishments.work_experience_id AND ur.user_id = auth.uid()
  ));

SELECT '✅ Schema sync and RLS check complete!' as status;
