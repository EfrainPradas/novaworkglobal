-- ============================================
-- CareerTipsAI - Initial Supabase Setup
-- ============================================
-- Run this script in Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query -> Paste and Run
-- ============================================

-- Step 1: Check if tables exist
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- If no tables are returned, you need to run the full schema.sql first!
-- The schema.sql file is located at: /home/efraiprada/carreerstips/schema.sql

-- Step 2: If tables exist, check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 3: Check existing RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- QUICK FIX: Allow anonymous read access for testing
-- ============================================
-- WARNING: This is for DEVELOPMENT/TESTING only!
-- Remove these policies before going to production!
-- ============================================

-- Option 1: Create temporary policies for testing (RECOMMENDED for dev)
-- Run this AFTER creating tables with schema.sql

-- Allow anonymous read access to users table (for connection test)
DROP POLICY IF EXISTS "temp_allow_anon_read_users" ON users;
CREATE POLICY "temp_allow_anon_read_users"
  ON users
  FOR SELECT
  USING (true);

-- Allow anonymous read access to user_profiles (for testing)
DROP POLICY IF EXISTS "temp_allow_anon_read_profiles" ON user_profiles;
CREATE POLICY "temp_allow_anon_read_profiles"
  ON user_profiles
  FOR SELECT
  USING (true);

-- ============================================
-- Option 2: Temporarily disable RLS (NOT RECOMMENDED)
-- ============================================
-- ONLY use this if you're having trouble and want to test quickly
-- Remember to re-enable RLS afterwards!

-- Disable RLS on users table (TEMPORARY - for testing only!)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable when done testing:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 4: Verify the fix worked
-- ============================================

-- Try to query users table
SELECT COUNT(*) as user_count FROM users;

-- Check RLS policies again
SELECT
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename IN ('users', 'user_profiles')
ORDER BY tablename, policyname;

-- ============================================
-- PRODUCTION RLS POLICIES
-- ============================================
-- These are proper RLS policies for production
-- Replace the temporary policies above with these when ready
-- ============================================

-- Users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Step 5: Test Authentication Flow
-- ============================================

-- After setting up RLS policies, test the flow:

-- 1. Sign up a test user in your app
-- 2. Check if user was created:
SELECT
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if user_profiles record exists:
SELECT
  user_id,
  full_name,
  preferred_language,
  created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you see "relation does not exist" errors:
-- 1. Make sure you ran schema.sql first
-- 2. Check that tables were created successfully

-- If you see 401 "Invalid API key" errors:
-- 1. Verify your anon key in Supabase Dashboard -> Settings -> API
-- 2. Update .env.local with the correct key
-- 3. Restart your dev server

-- If you see RLS policy violations:
-- 1. For testing: Use the temporary policies above
-- 2. For production: Implement proper RLS policies
-- 3. Make sure auth.uid() matches the user_id in your queries

-- ============================================
-- CLEANUP (when moving to production)
-- ============================================

-- Remove all temporary testing policies:
DROP POLICY IF EXISTS "temp_allow_anon_read_users" ON users;
DROP POLICY IF EXISTS "temp_allow_anon_read_profiles" ON user_profiles;

-- Ensure RLS is enabled on all tables:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
-- ... (enable for all other tables)

-- ============================================
-- END OF SCRIPT
-- ============================================

-- Summary of what this script does:
-- 1. ✅ Checks if tables exist
-- 2. ✅ Checks RLS status
-- 3. ✅ Creates temporary policies for testing
-- 4. ✅ Provides production-ready policies
-- 5. ✅ Includes troubleshooting queries
-- 6. ✅ Includes cleanup instructions

-- REMEMBER:
-- - Run schema.sql first if tables don't exist
-- - Use temporary policies for development
-- - Replace with production policies before launch
-- - Always test authentication flow after setup
