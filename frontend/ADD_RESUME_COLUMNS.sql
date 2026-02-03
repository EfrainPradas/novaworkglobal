-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Solo agrega columnas si no existen
-- ============================================

-- Check and add columns to certifications table
DO $$
BEGIN
  -- Add resume_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications'
    AND column_name = 'resume_id'
  ) THEN
    ALTER TABLE certifications ADD COLUMN resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE;
  END IF;

  -- Add order_index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications'
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE certifications ADD COLUMN order_index INTEGER;
  END IF;
END $$;

-- Check and add columns to education table
DO $$
BEGIN
  -- Add resume_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education'
    AND column_name = 'resume_id'
  ) THEN
    ALTER TABLE education ADD COLUMN resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE;
  END IF;

  -- Add order_index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education'
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE education ADD COLUMN order_index INTEGER;
  END IF;
END $$;

SELECT '✅ Columns added successfully to existing tables!' as status;

-- Now run the safe schema creation
-- ============================================
-- CREATE NEW RESUME BUILDER TABLES
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

  -- Professional Profile
  profile_summary TEXT,
  areas_of_excellence TEXT[],

  -- Resume Metadata
  resume_type TEXT DEFAULT 'chronological',
  is_master BOOLEAN DEFAULT TRUE,
  tailored_for_job_title TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAR STORIES TABLE
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

-- 4. ACCOMPLISHMENTS TABLE
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

-- 5. JOB DESCRIPTION ANALYSIS TABLE
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

-- 6. TAILORED RESUMES TABLE
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
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON user_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_par_stories_user_id ON par_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_work_exp_resume_id ON work_experience(resume_id);
CREATE INDEX IF NOT EXISTS idx_accomplishments_work_exp_id ON accomplishments(work_experience_id);
CREATE INDEX IF NOT EXISTS idx_jd_analysis_user_id ON job_description_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_id ON tailored_resumes(user_id);

-- Try to create index on certifications only if resume_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certifications'
    AND column_name = 'resume_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_certs_resume_id ON certifications(resume_id);
  END IF;
END $$;

-- Try to create index on education only if resume_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'education'
    AND column_name = 'resume_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_education_resume_id ON education(resume_id);
  END IF;
END $$;

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE par_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_description_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP OLD POLICIES
-- ============================================

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

DROP POLICY IF EXISTS "Users can view own JD analysis" ON job_description_analysis;
DROP POLICY IF EXISTS "Users can insert own JD analysis" ON job_description_analysis;
DROP POLICY IF EXISTS "Users can update own JD analysis" ON job_description_analysis;
DROP POLICY IF EXISTS "Users can delete own JD analysis" ON job_description_analysis;

DROP POLICY IF EXISTS "Users can view own tailored resumes" ON tailored_resumes;
DROP POLICY IF EXISTS "Users can insert own tailored resumes" ON tailored_resumes;
DROP POLICY IF EXISTS "Users can update own tailored resumes" ON tailored_resumes;
DROP POLICY IF EXISTS "Users can delete own tailored resumes" ON tailored_resumes;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

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

SELECT '✅ Interview-Magnet Resume System™ setup complete!' as status;

-- Show all resume builder tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_resumes',
    'par_stories',
    'work_experience',
    'accomplishments',
    'education',
    'certifications',
    'job_description_analysis',
    'tailored_resumes'
  )
ORDER BY table_name;
