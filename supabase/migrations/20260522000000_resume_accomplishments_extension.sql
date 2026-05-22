-- Migration: Extend accomplishments table for selective accomplishments / CAR stories
-- Created: 2026-05-22

-- 1. Add columns to accomplishments
ALTER TABLE accomplishments ADD COLUMN IF NOT EXISTS accomplishment_bank_id UUID REFERENCES accomplishment_bank(id) ON DELETE SET NULL;
ALTER TABLE accomplishments ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
ALTER TABLE accomplishments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Populate user_id for existing accomplishment records based on work_experience -> user_resumes
UPDATE accomplishments a
SET user_id = r.user_id
FROM work_experience w
JOIN user_resumes r ON w.resume_id = r.id
WHERE a.work_experience_id = w.id
AND a.user_id IS NULL;

-- 3. Enable RLS
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can perform CRUD on their own accomplishments" ON accomplishments;
DROP POLICY IF EXISTS "Users can read own accomplishments" ON accomplishments;
DROP POLICY IF EXISTS "Users can insert own accomplishments" ON accomplishments;
DROP POLICY IF EXISTS "Users can update own accomplishments" ON accomplishments;
DROP POLICY IF EXISTS "Users can delete own accomplishments" ON accomplishments;

-- Create direct policies based on user_id
CREATE POLICY "Users can read own accomplishments" ON accomplishments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accomplishments" ON accomplishments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accomplishments" ON accomplishments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accomplishments" ON accomplishments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '✅ accomplishments table extended and RLS policies created successfully!';
END $$;
