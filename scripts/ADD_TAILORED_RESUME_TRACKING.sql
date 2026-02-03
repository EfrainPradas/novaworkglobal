-- Add tracking columns to tailored_resumes table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- Add company_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN company_name TEXT;
        RAISE NOTICE 'Added company_name column';
    END IF;

    -- Add job_title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'job_title'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN job_title TEXT;
        RAISE NOTICE 'Added job_title column';
    END IF;

    -- Add sent_to_company column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'sent_to_company'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN sent_to_company TEXT;
        RAISE NOTICE 'Added sent_to_company column';
    END IF;

    -- Add sent_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'sent_at'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN sent_at TIMESTAMPTZ;
        RAISE NOTICE 'Added sent_at column';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN status TEXT DEFAULT 'draft';
        RAISE NOTICE 'Added status column';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tailored_resumes'
ORDER BY ordinal_position;
