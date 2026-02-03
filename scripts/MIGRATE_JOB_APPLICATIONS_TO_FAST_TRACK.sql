-- ========================================
-- MIGRATE EXISTING job_applications TO FAST-TRACK VERSION
-- This script safely migrates your old job_applications table to the new Fast-Track version
-- ========================================

DO $$
BEGIN
    -- Step 1: Check if old job_applications table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        RAISE NOTICE '📋 Found existing job_applications table';

        -- Step 2: Rename old table to backup
        ALTER TABLE job_applications RENAME TO job_applications_backup_old;
        RAISE NOTICE '✅ Renamed old table to job_applications_backup_old';

    ELSE
        RAISE NOTICE '📋 No existing job_applications table found. Will create new one.';
    END IF;
END $$;

-- Step 3: Create new Fast-Track job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Link to tailored resume (if generated through JD Analyzer)
  tailored_resume_id UUID REFERENCES tailored_resumes(id) ON DELETE SET NULL,
  company_shortlist_id UUID REFERENCES company_shortlist(id) ON DELETE SET NULL,

  -- Job details from workbook
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  where_found TEXT, -- 'Google Jobs', 'LinkedIn', 'Company Portal', 'Referral', etc.
  date_found DATE DEFAULT CURRENT_DATE,
  link_to_posting TEXT,

  -- Resume tailoring from workbook
  top_keywords TEXT[], -- Keywords identified from JD
  resume_adapted BOOLEAN DEFAULT FALSE,
  cover_letter_needed BOOLEAN DEFAULT FALSE,
  file_name_saved_as TEXT,

  -- Referral system (80% success rate vs 1-2% without referral)
  referral_requested BOOLEAN DEFAULT FALSE,
  referral_contact_name TEXT,
  referral_contact_role TEXT,
  referral_contact_linkedin TEXT,
  referral_date_reached_out DATE,
  referral_response TEXT,
  referral_made BOOLEAN DEFAULT FALSE,

  -- Application status
  application_status TEXT DEFAULT 'found', -- found, tailoring, applied, followed_up, interviewing, offer, rejected
  date_applied DATE,
  application_method TEXT, -- 'Company Portal', 'LinkedIn Easy Apply', 'Email to Recruiter'

  -- Follow-up system (THIS WAS MISSING IN YOUR OLD TABLE!)
  auto_follow_up_date DATE, -- Auto-calculated: 7 days after application
  last_follow_up_date DATE,
  follow_up_count INTEGER DEFAULT 0,
  follow_up_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

RAISE NOTICE '✅ Created new job_applications table with all Fast-Track columns';

-- Step 4: Migrate data from old table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_applications_backup_old') THEN
        RAISE NOTICE '📊 Migrating data from old table...';

        -- Insert data from old table, mapping columns that exist
        INSERT INTO job_applications (
            id,
            user_id,
            tailored_resume_id,
            job_title,
            company,
            date_applied,
            application_status,
            created_at
        )
        SELECT
            id,
            user_id,
            tailored_resume_id,
            job_title,
            company,
            date_applied,
            COALESCE(application_status, 'applied') AS application_status,
            created_at
        FROM job_applications_backup_old;

        RAISE NOTICE '✅ Data migrated successfully';
        RAISE NOTICE '⚠️  Old table kept as job_applications_backup_old for safety';
        RAISE NOTICE '   You can drop it later with: DROP TABLE job_applications_backup_old CASCADE;';
    END IF;
END $$;

-- Step 5: Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Users can view their own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can insert their own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update their own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can delete their own job applications" ON job_applications;

CREATE POLICY "Users can view their own job applications" ON job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own job applications" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job applications" ON job_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job applications" ON job_applications FOR DELETE USING (auth.uid() = user_id);

RAISE NOTICE '✅ RLS policies created';

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(user_id, application_status);
CREATE INDEX IF NOT EXISTS idx_job_applications_follow_up ON job_applications(user_id, auto_follow_up_date) WHERE auto_follow_up_date IS NOT NULL;

RAISE NOTICE '✅ Indexes created';

-- Step 8: Create trigger for auto-updates
CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION update_job_applications_updated_at();

RAISE NOTICE '✅ Trigger created';

-- Step 9: Create auto-follow-up trigger
CREATE OR REPLACE FUNCTION create_job_application_follow_up()
RETURNS TRIGGER AS $$
BEGIN
    -- When application is submitted, create auto follow-up reminder for 7 days later
    IF NEW.application_status = 'applied' AND NEW.date_applied IS NOT NULL THEN
        NEW.auto_follow_up_date := NEW.date_applied + INTERVAL '7 days';

        -- Create auto reminder (only if auto_reminders table exists)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auto_reminders') THEN
            INSERT INTO auto_reminders (
                user_id,
                reminder_type,
                related_entity_type,
                related_entity_id,
                reminder_date,
                reminder_message,
                reminder_action,
                priority
            ) VALUES (
                NEW.user_id,
                'job_application_follow_up',
                'job_application',
                NEW.id,
                NEW.auto_follow_up_date,
                'Follow up on your application to ' || NEW.company || ' for ' || NEW.job_title,
                'Send a follow-up email or LinkedIn message to the hiring manager',
                'high'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_application_auto_follow_up ON job_applications;
CREATE TRIGGER job_application_auto_follow_up
BEFORE INSERT OR UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION create_job_application_follow_up();

RAISE NOTICE '✅ Auto-follow-up trigger created';

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ job_applications MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '1. Old table renamed to job_applications_backup_old';
    RAISE NOTICE '2. New Fast-Track table created with all columns';
    RAISE NOTICE '3. Data migrated (if any existed)';
    RAISE NOTICE '4. RLS policies enabled';
    RAISE NOTICE '5. Indexes created';
    RAISE NOTICE '6. Triggers configured';
    RAISE NOTICE '';
    RAISE NOTICE 'NEW COLUMNS ADDED:';
    RAISE NOTICE '- auto_follow_up_date (auto-calculated 7 days after apply)';
    RAISE NOTICE '- last_follow_up_date';
    RAISE NOTICE '- follow_up_count';
    RAISE NOTICE '- follow_up_notes';
    RAISE NOTICE '- referral_requested, referral_contact_name, etc.';
    RAISE NOTICE '- where_found, top_keywords, etc.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Continue with CREATE_FAST_TRACK_SYSTEM_TABLES.sql';
    RAISE NOTICE '      (Skip the job_applications creation part - it is done!)';
    RAISE NOTICE '========================================';
END $$;
