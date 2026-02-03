-- ============================================
-- Interview-Magnet Resume System™ - Database Schema (SAFE VERSION)
-- Solo crea las tablas que NO existen
-- CareerTipsAI 2025
-- ============================================

-- 1. MASTER RESUME TABLE
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Header Info
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location_city TEXT,
  location_country TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,

  -- Professional Profile (Step 1 - Capture & Position)
  profile_summary TEXT,
  areas_of_excellence TEXT[],

  -- Resume Metadata
  resume_type TEXT DEFAULT 'chronological',
  is_master BOOLEAN DEFAULT TRUE,
  tailored_for_job_title TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAR STORIES TABLE (Step 1 - Memory Exercise)
CREATE TABLE IF NOT EXISTS par_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE,

  -- PAR Framework
  role_company TEXT NOT NULL,
  year TEXT,
  problem_challenge TEXT NOT NULL,
  actions JSONB,
  result TEXT NOT NULL,
  metrics TEXT[],

  -- Filtering
  will_do_again BOOLEAN DEFAULT TRUE,
  competencies TEXT[],

  -- Conversion
  converted_to_bullet BOOLEAN DEFAULT FALSE,
  bullet_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORK EXPERIENCE TABLE
CREATE TABLE IF NOT EXISTS work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE NOT NULL,

  -- Company Info
  company_name TEXT NOT NULL,
  company_description TEXT,
  location_city TEXT,
  location_country TEXT,

  -- Role Info
  job_title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,

  -- Scope
  scope_description TEXT,
  budget TEXT,
  headcount TEXT,
  geographies TEXT[],
  vendors TEXT[],

  -- Tools
  tools_systems TEXT[],

  -- Display
  order_index INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACCOMPLISHMENTS/BULLETS TABLE (Step 2 - Craft & Structure)
CREATE TABLE IF NOT EXISTS accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_experience_id UUID REFERENCES work_experience(id) ON DELETE CASCADE NOT NULL,
  par_story_id UUID REFERENCES par_stories(id) ON DELETE SET NULL,

  -- Bullet Content
  bullet_text TEXT NOT NULL,
  raw_bullet TEXT,

  -- Components
  verb TEXT,
  scope TEXT,
  action TEXT,
  metric TEXT,

  -- Display
  order_index INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CERTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE NOT NULL,

  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  credential_id TEXT,
  credential_url TEXT,

  order_index INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. JOB DESCRIPTION ANALYSIS TABLE (Step 3 - Target & Launch)
CREATE TABLE IF NOT EXISTS job_description_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- JD Source
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description_text TEXT NOT NULL,
  jd_url TEXT,

  -- AI Extraction
  top_keywords JSONB,
  extracted_requirements JSONB,

  -- Mapping
  keyword_mapping JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TAILORED RESUMES TABLE
CREATE TABLE IF NOT EXISTS tailored_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  master_resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE NOT NULL,
  jd_analysis_id UUID REFERENCES job_description_analysis(id) ON DELETE SET NULL,

  -- Tailored Content
  tailored_profile TEXT,
  tailored_skills TEXT[],
  tailored_bullets JSONB,

  -- Export
  file_url TEXT,
  filename TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (only create if not exists)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resumes_user_id') THEN
    CREATE INDEX idx_resumes_user_id ON user_resumes(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_par_stories_user_id') THEN
    CREATE INDEX idx_par_stories_user_id ON par_stories(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_work_exp_resume_id') THEN
    CREATE INDEX idx_work_exp_resume_id ON work_experience(resume_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_accomplishments_work_exp_id') THEN
    CREATE INDEX idx_accomplishments_work_exp_id ON accomplishments(work_experience_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_certs_resume_id') THEN
    CREATE INDEX idx_certs_resume_id ON certifications(resume_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_jd_analysis_user_id') THEN
    CREATE INDEX idx_jd_analysis_user_id ON job_description_analysis(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tailored_resumes_user_id') THEN
    CREATE INDEX idx_tailored_resumes_user_id ON tailored_resumes(user_id);
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE par_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_description_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON user_resumes;

DROP POLICY IF EXISTS "Users can view own PAR stories" ON par_stories;
DROP POLICY IF EXISTS "Users can insert own PAR stories" ON par_stories;
DROP POLICY IF EXISTS "Users can update own PAR stories" ON par_stories;
DROP POLICY IF EXISTS "Users can delete own PAR stories" ON par_stories;

DROP POLICY IF EXISTS "Users can view own work experience" ON work_experience;
DROP POLICY IF EXISTS "Users can insert own work experience" ON work_experience;
DROP POLICY IF EXISTS "Users can update own work experience" ON work_experience;
DROP POLICY IF EXISTS "Users can delete own work experience" ON work_experience;

DROP POLICY IF EXISTS "Users can view own accomplishments" ON accomplishments;
DROP POLICY IF EXISTS "Users can insert own accomplishments" ON accomplishments;
DROP POLICY IF EXISTS "Users can update own accomplishments" ON accomplishments;
DROP POLICY IF EXISTS "Users can delete own accomplishments" ON accomplishments;

DROP POLICY IF EXISTS "Users can view own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can insert own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can update own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can delete own certifications" ON certifications;

DROP POLICY IF EXISTS "Users can view own JD analysis" ON job_description_analysis;
DROP POLICY IF EXISTS "Users can insert own JD analysis" ON job_description_analysis;
DROP POLICY IF EXISTS "Users can update own JD analysis" ON job_description_analysis;
DROP POLICY IF EXISTS "Users can delete own JD analysis" ON job_description_analysis;

DROP POLICY IF EXISTS "Users can view own tailored resumes" ON tailored_resumes;
DROP POLICY IF EXISTS "Users can insert own tailored resumes" ON tailored_resumes;
DROP POLICY IF EXISTS "Users can update own tailored resumes" ON tailored_resumes;
DROP POLICY IF EXISTS "Users can delete own tailored resumes" ON tailored_resumes;

-- Create policies
-- user_resumes
CREATE POLICY "Users can view own resumes" ON user_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON user_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON user_resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON user_resumes FOR DELETE USING (auth.uid() = user_id);

-- par_stories
CREATE POLICY "Users can view own PAR stories" ON par_stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PAR stories" ON par_stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own PAR stories" ON par_stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own PAR stories" ON par_stories FOR DELETE USING (auth.uid() = user_id);

-- work_experience
CREATE POLICY "Users can view own work experience" ON work_experience FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = work_experience.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can insert own work experience" ON work_experience FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = work_experience.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can update own work experience" ON work_experience FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = work_experience.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can delete own work experience" ON work_experience FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = work_experience.resume_id AND user_resumes.user_id = auth.uid()));

-- accomplishments
CREATE POLICY "Users can view own accomplishments" ON accomplishments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishments.work_experience_id AND ur.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own accomplishments" ON accomplishments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishments.work_experience_id AND ur.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own accomplishments" ON accomplishments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishments.work_experience_id AND ur.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own accomplishments" ON accomplishments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE we.id = accomplishments.work_experience_id AND ur.user_id = auth.uid()
  ));

-- certifications
CREATE POLICY "Users can view own certifications" ON certifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = certifications.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can insert own certifications" ON certifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = certifications.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can update own certifications" ON certifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = certifications.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can delete own certifications" ON certifications FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = certifications.resume_id AND user_resumes.user_id = auth.uid()));

-- job_description_analysis
CREATE POLICY "Users can view own JD analysis" ON job_description_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own JD analysis" ON job_description_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own JD analysis" ON job_description_analysis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own JD analysis" ON job_description_analysis FOR DELETE USING (auth.uid() = user_id);

-- tailored_resumes
CREATE POLICY "Users can view own tailored resumes" ON tailored_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tailored resumes" ON tailored_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tailored resumes" ON tailored_resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tailored resumes" ON tailored_resumes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on user_resumes
CREATE OR REPLACE FUNCTION update_resume_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_resume_updated_at ON user_resumes;
CREATE TRIGGER trigger_update_resume_updated_at
  BEFORE UPDATE ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Interview-Magnet Resume System™ schema updated successfully!' as status;

-- Count tables
SELECT
  'user_resumes' as table_name,
  COUNT(*) as row_count
FROM user_resumes
UNION ALL
SELECT 'par_stories', COUNT(*) FROM par_stories
UNION ALL
SELECT 'work_experience', COUNT(*) FROM work_experience
UNION ALL
SELECT 'accomplishments', COUNT(*) FROM accomplishments
UNION ALL
SELECT 'certifications', COUNT(*) FROM certifications
UNION ALL
SELECT 'job_description_analysis', COUNT(*) FROM job_description_analysis
UNION ALL
SELECT 'tailored_resumes', COUNT(*) FROM tailored_resumes;
