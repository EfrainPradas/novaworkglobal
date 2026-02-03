-- ============================================================================
-- TRIGGER: Auto-create user in public.users when auth.users is created
-- ============================================================================
-- This trigger automatically creates a record in public.users table
-- whenever a new user signs up via Supabase Auth (email/password or OAuth)
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get email from the new auth user
  user_email := NEW.email;

  -- Try to extract name from raw_user_meta_data (for OAuth users)
  user_name := NEW.raw_user_meta_data->>'full_name';

  -- If no full_name, try 'name' (Google OAuth uses this)
  IF user_name IS NULL THEN
    user_name := NEW.raw_user_meta_data->>'name';
  END IF;

  -- If still no name, try first_name + last_name (LinkedIn OAuth)
  IF user_name IS NULL THEN
    user_name := CONCAT(
      NEW.raw_user_meta_data->>'first_name',
      ' ',
      NEW.raw_user_meta_data->>'last_name'
    );
  END IF;

  -- If still no name, use email prefix
  IF user_name IS NULL OR TRIM(user_name) = '' THEN
    user_name := SPLIT_PART(user_email, '@', 1);
  END IF;

  -- Insert into public.users table
  -- Use the same UUID from auth.users as the id in public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    password_hash,
    preferred_language,
    subscription_tier,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, -- Same UUID as auth.users
    user_email,
    user_name,
    NULL, -- password_hash is NULL (managed by Supabase Auth)
    'en', -- Default language (will be updated by user preference)
    'free', -- Default subscription tier
    FALSE, -- onboarding not completed yet
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicates if trigger runs multiple times

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a user record in public.users when a new user signs up via Supabase Auth. '
  'Extracts user metadata from OAuth providers (Google, LinkedIn) or uses email for name fallback.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Trigger that calls handle_new_user() function after a new user is inserted into auth.users table';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this query after creating the trigger to verify it exists:
--
-- SELECT
--   trigger_name,
--   event_manipulation,
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
--
-- ============================================================================

-- ============================================================================
-- TEST THE TRIGGER
-- ============================================================================
-- To test if the trigger works, you can:
--
-- 1. Create a test user via Supabase Auth (from your app)
-- 2. Then check if the user appears in public.users:
--    SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;
--
-- 3. You can also check auth.users to compare:
--    SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 5;
--
-- ============================================================================

-- ============================================================================
-- CLEANUP (Optional - for development only)
-- ============================================================================
-- If you need to delete test users:
--
-- DELETE FROM auth.users WHERE email = 'test@example.com';
-- DELETE FROM public.users WHERE email = 'test@example.com';
--
-- ============================================================================
