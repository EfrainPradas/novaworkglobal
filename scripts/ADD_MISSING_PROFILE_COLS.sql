-- Add missing columns to user_profiles and ensure 1:1 relationship
-- Run this in Supabase SQL Editor

-- 1. Add last_company and last_role columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_company TEXT,
ADD COLUMN IF NOT EXISTS last_role TEXT;

-- 2. Ensure user_id is unique to support UPSERT operations correctly
-- First, handle potential duplicates (keep the most recent updated one)
DELETE FROM user_profiles a USING (
      SELECT MIN(ctid) as ctid, user_id
        FROM user_profiles 
        GROUP BY user_id HAVING COUNT(*) > 1
      ) b
      WHERE a.user_id = b.user_id 
      AND a.ctid <> b.ctid;

-- Now add the constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- 3. Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
