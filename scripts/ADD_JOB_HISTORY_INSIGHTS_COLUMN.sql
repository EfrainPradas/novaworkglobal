-- Add job_history_insights column to career_vision_profiles
-- This stores the AI-generated insights to avoid regenerating them

ALTER TABLE career_vision_profiles
ADD COLUMN IF NOT EXISTS job_history_insights JSONB DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'career_vision_profiles'
AND column_name = 'job_history_insights';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ job_history_insights column added to career_vision_profiles';
END $$;
