-- ========================================
-- DIAGNOSE INDUSTRY RESEARCH TABLE
-- Run this to see what's wrong
-- ========================================

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'industry_research'
) AS table_exists;

-- 2. Check all columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'industry_research'
ORDER BY ordinal_position;

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'industry_research';

-- 4. Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'industry_research';

-- 5. Try to select (should work if RLS is OK)
SELECT COUNT(*) as row_count FROM industry_research;

-- 6. Check if user_id column type matches auth.users
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.udt_name
FROM information_schema.columns c
WHERE c.table_name = 'industry_research'
AND c.column_name = 'user_id';
