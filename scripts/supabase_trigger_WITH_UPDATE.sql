-- ============================================================================
-- TRIGGER: Auto-create user in public.users (INSERT + UPDATE version)
-- ============================================================================
-- This version triggers on BOTH INSERT and UPDATE
-- Works with email confirmation enabled
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get email from the new/updated auth user
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

  -- Insert into public.users table (or do nothing if already exists)
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
    NEW.id,
    user_email,
    user_name,
    NULL,
    'en',
    'free',
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Set function owner
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Create trigger for INSERT (when user signs up)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for UPDATE (when user confirms email)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Grant INSERT and UPDATE permissions
GRANT INSERT, UPDATE ON public.users TO service_role;
GRANT INSERT, UPDATE ON public.users TO postgres;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates or updates user in public.users when auth.users is inserted or email is confirmed';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Trigger on INSERT - creates user in public.users immediately when user signs up';

COMMENT ON TRIGGER on_auth_user_confirmed ON auth.users IS
  'Trigger on UPDATE - creates/updates user in public.users when email is confirmed';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify both triggers exist:
--
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_confirmed');
--
-- Expected result:
-- on_auth_user_created  | INSERT | AFTER
-- on_auth_user_confirmed | UPDATE | AFTER
--
-- ============================================================================

-- ============================================================================
-- MANUAL FIX FOR EXISTING USER
-- ============================================================================
-- If you already have a user in auth.users that's not in public.users,
-- you can manually trigger the function:
--
-- SELECT public.handle_new_user()
-- FROM auth.users
-- WHERE email = 'efrain.pradas@gmail.com';
--
-- Or directly insert:
--
-- INSERT INTO public.users (id, email, full_name, password_hash, preferred_language, subscription_tier, onboarding_completed, created_at, updated_at)
-- SELECT
--   id,
--   email,
--   SPLIT_PART(email, '@', 1) as full_name,
--   NULL,
--   'en',
--   'free',
--   FALSE,
--   created_at,
--   NOW()
-- FROM auth.users
-- WHERE email = 'efrain.pradas@gmail.com'
-- ON CONFLICT (id) DO NOTHING;
--
-- ============================================================================
