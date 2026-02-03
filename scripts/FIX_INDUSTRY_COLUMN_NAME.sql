-- ========================================
-- FIX: Rename 'industry' to 'industry_name'
-- ========================================

ALTER TABLE industry_research
RENAME COLUMN industry TO industry_name;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'industry_research'
ORDER BY ordinal_position;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Column renamed: industry → industry_name';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh your browser and try again!';
END $$;
