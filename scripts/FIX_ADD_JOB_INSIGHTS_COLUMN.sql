-- Fix: Add job_history_insights column if it doesn't exist
-- Run this in Supabase SQL Editor NOW

DO $$
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'career_vision_profiles'
        AND column_name = 'job_history_insights'
    ) THEN
        ALTER TABLE career_vision_profiles
        ADD COLUMN job_history_insights JSONB DEFAULT NULL;

        RAISE NOTICE '✅ Column job_history_insights added successfully';
    ELSE
        RAISE NOTICE '✅ Column job_history_insights already exists';
    END IF;
END $$;

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'career_vision_profiles'
AND column_name = 'job_history_insights';
