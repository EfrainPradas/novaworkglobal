-- ============================================================================
-- COMPLETE SCHEMA UPDATE SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- 1. UPDATE 'users' TABLE
-- Adding potential missing fields to the core users table for consistency
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. UPDATE 'user_profiles' TABLE
-- Syncing schema with Onboarding.tsx requirements
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT, -- Often useful to have cached in profile
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS last_company TEXT,
ADD COLUMN IF NOT EXISTS last_role TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. DATA CLEANUP & CONSTRAINTS
-- Ensure one profile per user to fix UPSERT issues

-- A. Remove duplicate profiles, keeping the most recently updated one
DELETE FROM user_profiles a USING (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rnum
      FROM user_profiles
) b
WHERE a.id = b.id AND b.rnum > 1;

-- B. Add UNIQUE constraint on user_id
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- 4. VERIFICATION
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('users', 'user_profiles') 
    AND column_name IN ('phone', 'linkedin_url', 'last_company', 'last_role', 'full_name')
ORDER BY 
    table_name, column_name;
