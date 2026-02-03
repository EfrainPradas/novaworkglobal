-- Add missing columns to job_description_analysis table
-- Run this in Supabase SQL Editor

-- Check if columns exist and add them if not
DO $$
BEGIN
    -- Add extracted_keywords column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_description_analysis'
        AND column_name = 'extracted_keywords'
    ) THEN
        ALTER TABLE job_description_analysis
        ADD COLUMN extracted_keywords JSONB;
        RAISE NOTICE 'Added extracted_keywords column';
    END IF;

    -- Add keyword_mapping column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_description_analysis'
        AND column_name = 'keyword_mapping'
    ) THEN
        ALTER TABLE job_description_analysis
        ADD COLUMN keyword_mapping JSONB;
        RAISE NOTICE 'Added keyword_mapping column';
    END IF;

    -- Add match_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_description_analysis'
        AND column_name = 'match_score'
    ) THEN
        ALTER TABLE job_description_analysis
        ADD COLUMN match_score INTEGER;
        RAISE NOTICE 'Added match_score column';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'job_description_analysis'
ORDER BY ordinal_position;
