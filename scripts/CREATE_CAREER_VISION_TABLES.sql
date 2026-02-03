-- ============================================
-- Career Vision Feature - Database Setup
-- ============================================
-- This script creates all necessary tables and policies for the Career Vision feature
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Add Career Vision flags to user_profiles
-- ============================================

-- Add tracking columns to existing user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS career_vision_started BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS career_vision_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS career_vision_skipped BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_seen_career_vision_prompt BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_career_vision
  ON user_profiles(user_id, career_vision_completed);

-- ============================================
-- STEP 2: Create Career Vision Profile Table
-- ============================================

CREATE TABLE IF NOT EXISTS career_vision_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Core Career Vision Elements
  skills_knowledge TEXT[] DEFAULT '{}',
  core_values TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',

  -- AI-Generated Career Vision Statement
  career_vision_statement TEXT,

  -- Metadata
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_vision_profiles_user_id
  ON career_vision_profiles(user_id);

-- ============================================
-- STEP 3: Create Job History Analysis Table
-- ============================================

CREATE TABLE IF NOT EXISTS job_history_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Job Details
  job_title VARCHAR(255),
  company_name VARCHAR(255),
  duration VARCHAR(100), -- e.g., "2 years", "6 months"
  job_order INTEGER DEFAULT 1, -- Order: 1 = most recent, 4 = oldest

  -- Company Analysis
  company_liked TEXT,
  company_liked_why TEXT,
  company_disliked TEXT,
  company_disliked_why TEXT,

  -- Position Analysis
  position_liked TEXT,
  position_liked_why TEXT,
  position_disliked TEXT,
  position_disliked_why TEXT,

  -- Manager Analysis
  manager_liked TEXT,
  manager_liked_why TEXT,
  manager_disliked TEXT,
  manager_disliked_why TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_history_user_id
  ON job_history_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_job_history_user_order
  ON job_history_analysis(user_id, job_order);

-- ============================================
-- STEP 4: Create Ideal Work Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS ideal_work_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Industry
  industry_preference TEXT,
  industry_weight VARCHAR(10), -- 'M', '10', '9', ..., '1'

  -- Geographic Location
  geographic_preference TEXT,
  geographic_weight VARCHAR(10),

  -- Compensation Package
  compensation_preference TEXT,
  compensation_weight VARCHAR(10),

  -- Benefits
  benefits_preference TEXT,
  benefits_weight VARCHAR(10),

  -- Company Profile
  company_profile_preference TEXT,
  company_profile_weight VARCHAR(10),

  -- Position/Goals
  position_goals_preference TEXT,
  position_goals_weight VARCHAR(10),

  -- Basis of Promotion
  promotion_basis_preference TEXT,
  promotion_basis_weight VARCHAR(10),

  -- Company Culture
  company_culture_preference TEXT,
  company_culture_weight VARCHAR(10),

  -- Lifestyle/Workstyle
  lifestyle_preference TEXT,
  lifestyle_weight VARCHAR(10),

  -- Type of Boss
  boss_type_preference TEXT,
  boss_type_weight VARCHAR(10),

  -- Other Considerations
  other_preference TEXT,
  other_weight VARCHAR(10),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ideal_work_preferences_user_id
  ON ideal_work_preferences(user_id);

-- ============================================
-- STEP 5: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all Career Vision tables
ALTER TABLE career_vision_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_history_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideal_work_preferences ENABLE ROW LEVEL SECURITY;

-- Career Vision Profiles Policies
CREATE POLICY "Users can view own career vision profile"
  ON career_vision_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career vision profile"
  ON career_vision_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career vision profile"
  ON career_vision_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own career vision profile"
  ON career_vision_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Job History Analysis Policies
CREATE POLICY "Users can view own job history"
  ON job_history_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job history"
  ON job_history_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job history"
  ON job_history_analysis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job history"
  ON job_history_analysis FOR DELETE
  USING (auth.uid() = user_id);

-- Ideal Work Preferences Policies
CREATE POLICY "Users can view own work preferences"
  ON ideal_work_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work preferences"
  ON ideal_work_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work preferences"
  ON ideal_work_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work preferences"
  ON ideal_work_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: Create Updated At Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to career_vision_profiles
DROP TRIGGER IF EXISTS update_career_vision_profiles_updated_at ON career_vision_profiles;
CREATE TRIGGER update_career_vision_profiles_updated_at
  BEFORE UPDATE ON career_vision_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to job_history_analysis
DROP TRIGGER IF EXISTS update_job_history_analysis_updated_at ON job_history_analysis;
CREATE TRIGGER update_job_history_analysis_updated_at
  BEFORE UPDATE ON job_history_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to ideal_work_preferences
DROP TRIGGER IF EXISTS update_ideal_work_preferences_updated_at ON ideal_work_preferences;
CREATE TRIGGER update_ideal_work_preferences_updated_at
  BEFORE UPDATE ON ideal_work_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_profiles for Career Vision fields
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all tables were created
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles',
    'career_vision_profiles',
    'job_history_analysis',
    'ideal_work_preferences'
  )
ORDER BY table_name;

-- Verify user_profiles columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name LIKE '%career_vision%'
ORDER BY ordinal_position;

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'career_vision_profiles',
  'job_history_analysis',
  'ideal_work_preferences'
)
ORDER BY tablename;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Career Vision database setup completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created/Updated:';
  RAISE NOTICE '  ✓ user_profiles (added Career Vision flags)';
  RAISE NOTICE '  ✓ career_vision_profiles';
  RAISE NOTICE '  ✓ job_history_analysis';
  RAISE NOTICE '  ✓ ideal_work_preferences';
  RAISE NOTICE '';
  RAISE NOTICE '  ✓ RLS policies for all tables';
  RAISE NOTICE '  ✓ Updated_at triggers';
  RAISE NOTICE '  ✓ Indexes for performance';
END $$;
