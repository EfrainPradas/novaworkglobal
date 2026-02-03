-- ========================================
-- FIX: Add missing column to job_applications table
-- Run this if you got error about "auto_follow_up_date" not existing
-- ========================================

-- Check if job_applications table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        RAISE NOTICE 'job_applications table exists. Checking for missing columns...';

        -- Add auto_follow_up_date if it doesn''t exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'auto_follow_up_date') THEN
            ALTER TABLE job_applications ADD COLUMN auto_follow_up_date DATE;
            RAISE NOTICE '✅ Added auto_follow_up_date column';
        ELSE
            RAISE NOTICE 'auto_follow_up_date column already exists';
        END IF;

        -- Add last_follow_up_date if it doesn''t exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'last_follow_up_date') THEN
            ALTER TABLE job_applications ADD COLUMN last_follow_up_date DATE;
            RAISE NOTICE '✅ Added last_follow_up_date column';
        ELSE
            RAISE NOTICE 'last_follow_up_date column already exists';
        END IF;

        -- Add follow_up_count if it doesn''t exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'follow_up_count') THEN
            ALTER TABLE job_applications ADD COLUMN follow_up_count INTEGER DEFAULT 0;
            RAISE NOTICE '✅ Added follow_up_count column';
        ELSE
            RAISE NOTICE 'follow_up_count column already exists';
        END IF;

        -- Add follow_up_notes if it doesn''t exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'follow_up_notes') THEN
            ALTER TABLE job_applications ADD COLUMN follow_up_notes TEXT;
            RAISE NOTICE '✅ Added follow_up_notes column';
        ELSE
            RAISE NOTICE 'follow_up_notes column already exists';
        END IF;

    ELSE
        RAISE NOTICE '⚠️  job_applications table does not exist. You need to run CREATE_FAST_TRACK_SYSTEM_TABLES.sql first';
    END IF;
END $$;

-- Now try to create the index again
CREATE INDEX IF NOT EXISTS idx_job_applications_follow_up ON job_applications(user_id, auto_follow_up_date) WHERE auto_follow_up_date IS NOT NULL;

RAISE NOTICE '✅ Index created successfully!';
RAISE NOTICE 'You can now continue with CREATE_FAST_TRACK_SYSTEM_TABLES.sql';
