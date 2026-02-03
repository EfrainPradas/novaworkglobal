-- ========================================
-- ADD MISSING COLUMNS TO company_shortlist TABLE
-- For Google Jobs Integration & Extended Tracking
-- ========================================

-- Add new columns to match frontend component and Google Jobs data
ALTER TABLE company_shortlist
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS headquarters TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS apply_link TEXT, -- Link where user can apply to the job
  ADD COLUMN IF NOT EXISTS job_description TEXT, -- Full job description from Google Jobs
  ADD COLUMN IF NOT EXISTS job_title TEXT, -- Specific job title found
  ADD COLUMN IF NOT EXISTS match_score INTEGER CHECK (match_score BETWEEN 0 AND 100), -- How well job matches user criteria
  ADD COLUMN IF NOT EXISTS salary_range TEXT, -- e.g., "$100K-$140K a year"
  ADD COLUMN IF NOT EXISTS posted_date TEXT, -- When the job was posted
  ADD COLUMN IF NOT EXISTS location TEXT; -- Job location

-- Rename why_fits_criteria to why_target for consistency with frontend
ALTER TABLE company_shortlist
  RENAME COLUMN why_fits_criteria TO why_target;

COMMENT ON COLUMN company_shortlist.website IS 'Company website URL';
COMMENT ON COLUMN company_shortlist.linkedin_url IS 'Company LinkedIn page URL';
COMMENT ON COLUMN company_shortlist.headquarters IS 'Company headquarters location';
COMMENT ON COLUMN company_shortlist.company_size IS 'Company size (e.g., "50-200 employees", "1000+")';
COMMENT ON COLUMN company_shortlist.revenue_range IS 'Company revenue range (e.g., "$10M-$50M")';
COMMENT ON COLUMN company_shortlist.notes IS 'User notes about this company';
COMMENT ON COLUMN company_shortlist.apply_link IS 'Direct link to job application page (from Google Jobs)';
COMMENT ON COLUMN company_shortlist.job_description IS 'Full job description text (from Google Jobs)';
COMMENT ON COLUMN company_shortlist.job_title IS 'Specific job title user is targeting at this company';
COMMENT ON COLUMN company_shortlist.match_score IS 'AI-calculated match score (0-100) between job and user profile';
COMMENT ON COLUMN company_shortlist.salary_range IS 'Salary range for the job (e.g., "$100K-$140K a year")';
COMMENT ON COLUMN company_shortlist.posted_date IS 'When the job was posted (e.g., "2 days ago")';
COMMENT ON COLUMN company_shortlist.location IS 'Job location (city, state, or "Remote")';

-- Create index for apply_link lookups
CREATE INDEX IF NOT EXISTS idx_company_shortlist_apply_link ON company_shortlist(apply_link) WHERE apply_link IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully added missing columns to company_shortlist table';
    RAISE NOTICE '📊 New columns: website, linkedin_url, headquarters, company_size, revenue_range, notes';
    RAISE NOTICE '🔗 Google Jobs integration: apply_link, job_description, job_title, match_score, salary_range, posted_date, location';
    RAISE NOTICE '📝 Renamed: why_fits_criteria → why_target';
END $$;
