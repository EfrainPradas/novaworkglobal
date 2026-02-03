-- Add enhanced tracking columns to tailored_resumes table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- Add application_status column with detailed tracking options
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'application_status'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN application_status TEXT DEFAULT 'draft';
        RAISE NOTICE 'Added application_status column';
    END IF;

    -- Add last_status_update column to track when status changed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'last_status_update'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN last_status_update TIMESTAMPTZ;
        RAISE NOTICE 'Added last_status_update column';
    END IF;

    -- Add interview_date column for scheduled interviews
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'interview_date'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN interview_date TIMESTAMPTZ;
        RAISE NOTICE 'Added interview_date column';
    END IF;

    -- Add notes column for tracking communication and updates
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;

    -- Add recruiter_contact column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tailored_resumes'
        AND column_name = 'recruiter_contact'
    ) THEN
        ALTER TABLE tailored_resumes
        ADD COLUMN recruiter_contact TEXT;
        RAISE NOTICE 'Added recruiter_contact column';
    END IF;
END $$;

-- Migrate existing 'sent' status to 'application_status' if needed
UPDATE tailored_resumes
SET application_status = status
WHERE status IS NOT NULL AND application_status = 'draft';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tailored_resumes'
ORDER BY ordinal_position;
