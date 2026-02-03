-- CREATE ONBOARDING PROFILE TABLES
-- This script creates or updates tables to store Skills, Interests, and Values from the new onboarding flow

-- 1. Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  source TEXT DEFAULT 'onboarding', -- 'onboarding', 'resume', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- 2. Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_name TEXT NOT NULL,
  source TEXT DEFAULT 'onboarding',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest_name)
);

-- 3. Create user_values table
CREATE TABLE IF NOT EXISTS user_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_id TEXT NOT NULL, -- 'autonomy', 'impact', 'growth', etc.
  value_label TEXT NOT NULL, -- Human-readable label
  reasoning TEXT, -- Optional: Why this value is important
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, value_id)
);

-- 4. Update onboarding_responses table to include new fields
-- Check if columns exist first, then add if they don't
DO $$ 
BEGIN
  -- Add skills column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_responses' 
    AND column_name = 'skills'
  ) THEN
    ALTER TABLE onboarding_responses ADD COLUMN skills JSONB;
  END IF;

  -- Add interests column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_responses' 
    AND column_name = 'interests'
  ) THEN
    ALTER TABLE onboarding_responses ADD COLUMN interests JSONB;
  END IF;

  -- Add values column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_responses' 
    AND column_name = 'values'
  ) THEN
    ALTER TABLE onboarding_responses ADD COLUMN values JSONB;
  END IF;

  -- Add values_reasoning column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_responses' 
    AND column_name = 'values_reasoning'
  ) THEN
    ALTER TABLE onboarding_responses ADD COLUMN values_reasoning TEXT;
  END IF;
END $$;

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_values_user_id ON user_values(user_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_values ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- user_skills policies
DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;
CREATE POLICY "Users can view their own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
CREATE POLICY "Users can insert their own skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
CREATE POLICY "Users can update their own skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON user_skills;
CREATE POLICY "Users can delete their own skills"
  ON user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- user_interests policies
DROP POLICY IF EXISTS "Users can view their own interests" ON user_interests;
CREATE POLICY "Users can view their own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interests" ON user_interests;
CREATE POLICY "Users can insert their own interests"
  ON user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interests" ON user_interests;
CREATE POLICY "Users can update their own interests"
  ON user_interests FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interests" ON user_interests;
CREATE POLICY "Users can delete their own interests"
  ON user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- user_values policies
DROP POLICY IF EXISTS "Users can view their own values" ON user_values;
CREATE POLICY "Users can view their own values"
  ON user_values FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own values" ON user_values;
CREATE POLICY "Users can insert their own values"
  ON user_values FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own values" ON user_values;
CREATE POLICY "Users can update their own values"
  ON user_values FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own values" ON user_values;
CREATE POLICY "Users can delete their own values"
  ON user_values FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Create helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_skills_updated_at ON user_skills;
CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_interests_updated_at ON user_interests;
CREATE TRIGGER update_user_interests_updated_at
  BEFORE UPDATE ON user_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_values_updated_at ON user_values;
CREATE TRIGGER update_user_values_updated_at
  BEFORE UPDATE ON user_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Onboarding profile tables created successfully!';
  RAISE NOTICE 'Tables: user_skills, user_interests, user_values';
  RAISE NOTICE 'Updated: onboarding_responses (added skills, interests, values columns)';
END $$;
