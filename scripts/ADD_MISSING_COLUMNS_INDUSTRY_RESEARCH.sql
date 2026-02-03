-- ========================================
-- ADD MISSING COLUMNS TO industry_research
-- ========================================

-- Check what columns exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing columns in industry_research...';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'industry_research'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS cons TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS pros TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS skills_needed TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS salary_ranges TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS job_demand TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS growth_outlook TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS major_players TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS key_trends TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE industry_research
ADD COLUMN IF NOT EXISTS industry_name TEXT;

-- Show final columns
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All columns added to industry_research!';
    RAISE NOTICE '========================================';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'industry_research'
ORDER BY ordinal_position;
