-- ============================================================================
-- Supabase Storage Configuration - CareerTipsAI
-- ============================================================================
-- Version: 1.0
-- Date: November 18, 2025
-- Description: Storage bucket policies for resumes, certificates, and avatars
-- ============================================================================

-- NOTE: Run this AFTER creating storage buckets in Supabase Dashboard
-- Buckets to create manually in Dashboard → Storage:
--   1. resumes (private)
--   2. certificates (private)
--   3. avatars (public)

-- ============================================================================
-- RESUMES BUCKET POLICIES
-- ============================================================================

-- Policy 1: Users can upload their own resumes
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can read their own resumes
CREATE POLICY "Users can read own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own resumes
CREATE POLICY "Users can update own resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- CERTIFICATES BUCKET POLICIES
-- ============================================================================

-- Policy 1: Users can upload their own certificates
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can read their own certificates
CREATE POLICY "Users can read own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own certificates
CREATE POLICY "Users can update own certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- AVATARS BUCKET POLICIES (Public Bucket)
-- ============================================================================

-- Policy 1: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Avatars are publicly accessible (anyone can view)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 3: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFY STORAGE POLICIES
-- ============================================================================

-- View all storage policies
SELECT
  policyname,
  tablename,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- ============================================================================
-- HELPER FUNCTIONS FOR STORAGE
-- ============================================================================

-- Function to get user's resume storage path
CREATE OR REPLACE FUNCTION get_user_resume_path(user_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN user_id::text || '/' || filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_resume_path IS 'Returns storage path for user resume: {user_id}/{filename}';

-- Function to generate unique filename with timestamp
CREATE OR REPLACE FUNCTION generate_storage_filename(original_filename TEXT)
RETURNS TEXT AS $$
DECLARE
  extension TEXT;
  base_name TEXT;
  timestamp_str TEXT;
BEGIN
  -- Extract file extension
  extension := substring(original_filename from '\.([^.]+)$');

  -- Get base name without extension
  base_name := substring(original_filename from '^(.+)\.[^.]+$');

  -- Generate timestamp
  timestamp_str := to_char(NOW(), 'YYYYMMDD_HH24MISS');

  -- Return: basename_timestamp.extension
  RETURN base_name || '_' || timestamp_str || '.' || extension;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_storage_filename IS 'Generates unique filename with timestamp to prevent overwrites';

-- Example usage:
-- SELECT generate_storage_filename('my_resume.pdf');
-- Returns: my_resume_20251118_143022.pdf

-- ============================================================================
-- STORAGE USAGE TRACKING (Optional)
-- ============================================================================

-- Create a view to track storage usage per user
CREATE OR REPLACE VIEW user_storage_usage AS
SELECT
  (storage.foldername(name))[1]::uuid AS user_id,
  bucket_id,
  COUNT(*) AS file_count,
  SUM((metadata->>'size')::bigint) AS total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) AS total_mb
FROM storage.objects
WHERE bucket_id IN ('resumes', 'certificates', 'avatars')
GROUP BY user_id, bucket_id
ORDER BY total_bytes DESC;

COMMENT ON VIEW user_storage_usage IS 'Track storage usage per user and bucket';

-- Query to check your own storage usage:
-- SELECT * FROM user_storage_usage WHERE user_id = auth.uid();

-- ============================================================================
-- STORAGE LIMITS (Enforce via Application Logic)
-- ============================================================================

-- Create a function to check if user has exceeded storage quota
CREATE OR REPLACE FUNCTION check_storage_quota(p_user_id UUID, p_bucket_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage_mb NUMERIC;
  quota_mb NUMERIC;
BEGIN
  -- Get current usage
  SELECT COALESCE(total_mb, 0)
  INTO current_usage_mb
  FROM user_storage_usage
  WHERE user_id = p_user_id AND bucket_id = p_bucket_id;

  -- Set quota based on bucket
  CASE p_bucket_id
    WHEN 'resumes' THEN quota_mb := 100; -- 100 MB per user
    WHEN 'certificates' THEN quota_mb := 50; -- 50 MB per user
    WHEN 'avatars' THEN quota_mb := 5; -- 5 MB per user
    ELSE quota_mb := 0;
  END CASE;

  -- Return TRUE if under quota, FALSE if over
  RETURN current_usage_mb < quota_mb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_storage_quota IS 'Check if user is under storage quota for bucket';

-- Example usage in application:
-- SELECT check_storage_quota(auth.uid(), 'resumes');
-- Returns: true (can upload) or false (quota exceeded)

-- ============================================================================
-- END OF STORAGE CONFIGURATION
-- ============================================================================

-- Verify setup
SELECT 'Storage policies configured successfully!' AS status;
