-- ============================================================================
-- TRIGGER: Auto-create user in public.users when auth.users is created
-- ============================================================================
-- FIXED VERSION: Adds proper permissions for the trigger function
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run with the privileges of the function owner
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
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth.users insert
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated and service role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Ensure the function owner can access both schemas
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Make sure the trigger can insert into public.users

-- Grant INSERT permission on public.users to service_role
GRANT INSERT ON public.users TO service_role;
GRANT INSERT ON public.users TO postgres;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the trigger was created:
--
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
--
-- ============================================================================

-- ============================================================================
-- TEST THE TRIGGER
-- ============================================================================
-- After running this SQL:
-- 1. Go to your app: http://localhost:5174/signup
-- 2. Register with email: test@example.com, password: Test1234!
-- 3. Run this query to verify:
--
-- SELECT id, email, full_name, created_at
-- FROM public.users
-- WHERE email = 'test@example.com';
--
-- ============================================================================
