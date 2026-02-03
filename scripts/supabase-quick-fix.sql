-- ============================================
-- CareerTipsAI - Quick Fix Script
-- ============================================
-- This script checks if tables exist and creates them if needed
-- Run this BEFORE the initial-setup.sql script
-- ============================================

-- Step 1: Check if tables exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'users'
    ) THEN
        RAISE NOTICE 'Tables do not exist. You need to run schema.sql first!';
        RAISE NOTICE 'Location: /home/efraiprada/carreerstips/schema.sql';
        RAISE NOTICE 'Or copy from: C:\CarrersA\schema.sql';
    ELSE
        RAISE NOTICE 'Tables exist. Checking structure...';
    END IF;
END $$;

-- Step 2: List existing tables (if any)
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- TEMPORARY FIX: Create minimal tables for testing
-- ============================================
-- This creates just enough to test the connection
-- You should still run the full schema.sql afterwards!
-- ============================================

-- Create users table (minimal version)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table (minimal version)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    preferred_language TEXT DEFAULT 'en',
    phone TEXT,
    country TEXT,
    timezone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create temporary policies for testing (anonymous read access)
DROP POLICY IF EXISTS "temp_allow_anon_read_users" ON users;
CREATE POLICY "temp_allow_anon_read_users"
    ON users
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "temp_allow_anon_read_profiles" ON user_profiles;
CREATE POLICY "temp_allow_anon_read_profiles"
    ON user_profiles
    FOR SELECT
    USING (true);

-- Create auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification
-- ============================================

-- Check tables were created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_name IN ('users', 'user_profiles')
ORDER BY table_name;

-- Check RLS is enabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'user_profiles');

-- Check policies exist
SELECT
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'user_profiles');

-- Test query (should work now)
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as profile_count FROM user_profiles;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Quick fix applied successfully!';
    RAISE NOTICE '✅ Minimal tables created: users, user_profiles';
    RAISE NOTICE '✅ RLS enabled with temporary test policies';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANT: This is a minimal setup for testing only!';
    RAISE NOTICE '📋 TODO: Run the full schema.sql to create all 25+ tables';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Refresh your frontend: http://localhost:5173';
    RAISE NOTICE '✅ The 401 error should now be resolved!';
END $$;
