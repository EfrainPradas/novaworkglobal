-- ============================================
-- FIX: Add missing is_active column if it doesn't exist
-- Run this if you get "column is_active does not exist" error
-- ============================================

-- Check if column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'interview_questions'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE interview_questions
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

        RAISE NOTICE 'Added is_active column to interview_questions table';
    ELSE
        RAISE NOTICE 'is_active column already exists in interview_questions table';
    END IF;
END $$;

-- Drop the policy if it exists
DROP POLICY IF EXISTS "Everyone can view interview questions" ON interview_questions;

-- Recreate the policy
CREATE POLICY "Everyone can view interview questions"
ON interview_questions
FOR SELECT
USING (is_active = TRUE);

SELECT '✅ Fix applied successfully!' as status;

-- Verify the column exists now
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'interview_questions'
AND column_name = 'is_active';
