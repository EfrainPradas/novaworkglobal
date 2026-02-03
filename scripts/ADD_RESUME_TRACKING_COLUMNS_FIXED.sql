-- Add enhanced tracking columns to tailored_resumes table
-- Run this in Supabase SQL Editor

-- Add application_status column with detailed tracking options
ALTER TABLE tailored_resumes
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'draft';

-- Add last_status_update column to track when status changed
ALTER TABLE tailored_resumes
ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ;

-- Add interview_date column for scheduled interviews
ALTER TABLE tailored_resumes
ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ;

-- Add notes column for tracking communication and updates
ALTER TABLE tailored_resumes
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add recruiter_contact column
ALTER TABLE tailored_resumes
ADD COLUMN IF NOT EXISTS recruiter_contact TEXT;

-- Migrate existing 'sent' status to 'application_status' if needed
UPDATE tailored_resumes
SET application_status = status
WHERE status IS NOT NULL AND (application_status IS NULL OR application_status = 'draft');

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tailored_resumes'
ORDER BY ordinal_position;
