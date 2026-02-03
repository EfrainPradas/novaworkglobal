-- ========================================
-- FIX: Remove old 'industry' column, keep 'industry_name'
-- ========================================

-- First, check what columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'industry_research'
ORDER BY ordinal_position;

-- Drop the old 'industry' column
ALTER TABLE industry_research
DROP COLUMN IF EXISTS industry;

-- Make sure industry_name is NOT NULL
ALTER TABLE industry_research
ALTER COLUMN industry_name SET NOT NULL;

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'industry_research'
ORDER BY ordinal_position;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Removed old "industry" column';
    RAISE NOTICE '✅ Kept "industry_name" as NOT NULL';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh your browser and try again!';
END $$;
