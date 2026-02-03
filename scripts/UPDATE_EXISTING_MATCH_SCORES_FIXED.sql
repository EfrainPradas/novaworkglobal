-- Add match_score column and update existing tailored_resumes
-- Run this in Supabase SQL Editor

-- Step 1: Add match_score column if it doesn't exist
ALTER TABLE tailored_resumes
ADD COLUMN IF NOT EXISTS match_score INTEGER CHECK (match_score BETWEEN 0 AND 100);

-- Step 2: Update match_score by joining with job_description_analysis
UPDATE tailored_resumes tr
SET match_score = COALESCE(
    (
        SELECT (jda.extracted_requirements->>'match_score')::INTEGER
        FROM job_description_analysis jda
        WHERE jda.id = tr.jd_analysis_id
        AND jda.extracted_requirements->>'match_score' IS NOT NULL
    ),
    0
)
WHERE tr.match_score IS NULL OR tr.match_score = 0;

-- Step 3: Verify the update
SELECT
    tr.id,
    tr.company_name,
    tr.job_title,
    tr.match_score,
    jda.extracted_requirements->>'match_score' as analysis_match_score,
    tr.created_at
FROM tailored_resumes tr
LEFT JOIN job_description_analysis jda ON jda.id = tr.jd_analysis_id
ORDER BY tr.created_at DESC
LIMIT 10;
