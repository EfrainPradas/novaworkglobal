-- Check if job_applications table exists and show its columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'job_applications'
ORDER BY ordinal_position;

-- If it returns rows, the table exists
-- If it returns no rows, the table doesn't exist
