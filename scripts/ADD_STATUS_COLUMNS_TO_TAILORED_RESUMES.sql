-- ========================================
-- ADD STATUS TRACKING TO TAILORED_RESUMES
-- ========================================

-- Add missing columns to tailored_resumes for application tracking
ALTER TABLE tailored_resumes
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft', -- draft, sent, reviewed
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'found', -- found, tailoring, applied, followed_up, interviewing, offer, rejected
ADD COLUMN IF NOT EXISTS sent_to_company TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_status
ON tailored_resumes(user_id, application_status);

CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_created
ON tailored_resumes(user_id, created_at DESC);

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Status columns added to tailored_resumes';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Columns added:';
    RAISE NOTICE '  - company_name (TEXT)';
    RAISE NOTICE '  - job_title (TEXT)';
    RAISE NOTICE '  - match_score (INTEGER)';
    RAISE NOTICE '  - status (TEXT): draft, sent, reviewed';
    RAISE NOTICE '  - application_status (TEXT): found, tailoring, applied, followed_up, interviewing, offer, rejected';
    RAISE NOTICE '  - sent_to_company (TEXT)';
    RAISE NOTICE '  - sent_at (TIMESTAMPTZ)';
    RAISE NOTICE '  - last_status_update (TIMESTAMPTZ)';
    RAISE NOTICE '  - updated_at (TIMESTAMPTZ)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh your application!';
END $$;
