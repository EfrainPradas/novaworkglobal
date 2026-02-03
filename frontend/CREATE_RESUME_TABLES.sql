-- ============================================
-- Interview-Magnet Resume System™ - Database Schema
-- CareerTipsAI 2025
-- ============================================

-- 1. MASTER RESUME TABLE
-- Stores the base resume (master version before JD tailoring)
CREATE TABLE user_resumes (
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
  profile_summary TEXT, -- 2-3 line Professional Summary
  areas_of_excellence TEXT[], -- Array of 6-12 keywords

  -- Resume Metadata
  resume_type TEXT DEFAULT 'chronological', -- 'chronological' or 'functional'
  is_master BOOLEAN DEFAULT TRUE, -- Master vs tailored version
  tailored_for_job_title TEXT, -- NULL for master, filled for tailored

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PAR STORIES TABLE (Step 1 - Memory Exercise)
-- Problem-Action-Result framework for capturing accomplishments
CREATE TABLE par_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE,

  -- PAR Framework
  role_company TEXT NOT NULL, -- "Senior PM at Google"
  year TEXT, -- "2020"
  problem_challenge TEXT NOT NULL, -- The problem
  actions JSONB, -- Array of 2-3 actions taken
  result TEXT NOT NULL, -- Quantified outcome
  metrics TEXT[], -- ["25%", "$500K", "10 weeks"]

  -- Filtering
  will_do_again BOOLEAN DEFAULT TRUE, -- "Would I do this again?"
  competencies TEXT[], -- Skills demonstrated

  -- Conversion
  converted_to_bullet BOOLEAN DEFAULT FALSE,
  bullet_text TEXT, -- Final resume bullet

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORK EXPERIENCE TABLE
CREATE TABLE work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE NOT NULL,

  -- Company Info
  company_name TEXT NOT NULL,
  company_description TEXT, -- "Global tech company, $50B revenue, 125 countries"
  location_city TEXT,
  location_country TEXT,

  -- Role Info
  job_title TEXT NOT NULL,
  start_date TEXT NOT NULL, -- "YYYY" or "MM/YYYY"
  end_date TEXT, -- NULL = current
  is_current BOOLEAN DEFAULT FALSE,

  -- Scope (measurables)
  scope_description TEXT, -- "Led team of 36, $12M budget across LATAM"
  budget TEXT,
  headcount TEXT,
  geographies TEXT[],
  vendors TEXT[],

  -- Tools/Systems
  tools_systems TEXT[],

  -- Display order
  order_index INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACCOMPLISHMENTS/BULLETS TABLE (Step 2 - Craft & Structure)
-- Formula: Verb + Scope + Action + Metric
CREATE TABLE accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_experience_id UUID REFERENCES work_experience(id) ON DELETE CASCADE NOT NULL,
  par_story_id UUID REFERENCES par_stories(id) ON DELETE SET NULL, -- Link to source PAR

  -- Bullet Content
  bullet_text TEXT NOT NULL, -- Final polished bullet
  raw_bullet TEXT, -- Original draft before AI polish

  -- Components (for analysis)
  verb TEXT, -- "Increased", "Led", "Reduced"
  scope TEXT, -- "Across 12 product lines"
  action TEXT, -- "by implementing agile methodology"
  metric TEXT, -- "resulting in 40% faster delivery"

  -- Display
  order_index INTEGER,
  is_featured BOOLEAN DEFAULT FALSE, -- Highlight for functional resume

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EDUCATION TABLE
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE NOT NULL,

  degree_title TEXT NOT NULL, -- "BS in Computer Science"
  institution TEXT NOT NULL,
  location TEXT,
  graduation_year TEXT,

  order_index INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CERTIFICATIONS TABLE
CREATE TABLE certifications (
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

-- 7. JOB DESCRIPTION ANALYSIS TABLE (Step 3 - Target & Launch)
CREATE TABLE job_description_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- JD Source
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description_text TEXT NOT NULL,
  jd_url TEXT,

  -- AI Extraction
  top_keywords JSONB, -- Array of {keyword, count, category: "hard_skill" | "soft_skill" | "tool"}
  extracted_requirements JSONB,

  -- Mapping (Step 3)
  keyword_mapping JSONB, -- {keyword: "Python", where: "Skills", evidence: "Built 5 apps..."}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TAILORED RESUMES TABLE
-- Stores versions tailored to specific job descriptions
CREATE TABLE tailored_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  master_resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE NOT NULL,
  jd_analysis_id UUID REFERENCES job_description_analysis(id) ON DELETE SET NULL,

  -- Tailored Content
  tailored_profile TEXT,
  tailored_skills TEXT[],
  tailored_bullets JSONB, -- Modified bullets to match JD

  -- Export
  file_url TEXT, -- PDF/DOCX URL in Supabase Storage
  filename TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_resumes_user_id ON user_resumes(user_id);
CREATE INDEX idx_par_stories_user_id ON par_stories(user_id);
CREATE INDEX idx_work_exp_resume_id ON work_experience(resume_id);
CREATE INDEX idx_accomplishments_work_exp_id ON accomplishments(work_experience_id);
CREATE INDEX idx_education_resume_id ON education(resume_id);
CREATE INDEX idx_certs_resume_id ON certifications(resume_id);
CREATE INDEX idx_jd_analysis_user_id ON job_description_analysis(user_id);
CREATE INDEX idx_tailored_resumes_user_id ON tailored_resumes(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE par_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_description_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see/edit their own data

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

-- education
CREATE POLICY "Users can view own education" ON education FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = education.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can insert own education" ON education FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = education.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can update own education" ON education FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = education.resume_id AND user_resumes.user_id = auth.uid()));
CREATE POLICY "Users can delete own education" ON education FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_resumes WHERE user_resumes.id = education.resume_id AND user_resumes.user_id = auth.uid()));

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

CREATE TRIGGER trigger_update_resume_updated_at
  BEFORE UPDATE ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Interview-Magnet Resume System™ tables created successfully!' as status;

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_resumes', 'par_stories', 'work_experience', 'accomplishments',
    'education', 'certifications', 'job_description_analysis', 'tailored_resumes'
  )
ORDER BY table_name;
