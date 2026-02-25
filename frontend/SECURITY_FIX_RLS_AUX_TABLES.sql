-- ============================================
-- SECURITY FIX: RLS FOR AUXILIARY TABLES
-- Phase 2 of Security Remediation Plan
-- ============================================

-- 1. ENABLE RLS on Education Table
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES for Education
-- Users can only see/modify education items linked to their own resumes

DROP POLICY IF EXISTS "Users can view own education" ON education;
CREATE POLICY "Users can view own education" ON education
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = education.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own education" ON education;
CREATE POLICY "Users can insert own education" ON education
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = education.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own education" ON education;
CREATE POLICY "Users can update own education" ON education
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = education.resume_id
    AND user_resumes.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = education.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own education" ON education;
CREATE POLICY "Users can delete own education" ON education
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = education.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

-- 3. ENABLE RLS on Certifications Table
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES for Certifications
-- Same logic: link via resume_id -> user_id

DROP POLICY IF EXISTS "Users can view own certifications" ON certifications;
CREATE POLICY "Users can view own certifications" ON certifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = certifications.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own certifications" ON certifications;
CREATE POLICY "Users can insert own certifications" ON certifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = certifications.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own certifications" ON certifications;
CREATE POLICY "Users can update own certifications" ON certifications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = certifications.resume_id
    AND user_resumes.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = certifications.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own certifications" ON certifications;
CREATE POLICY "Users can delete own certifications" ON certifications
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_resumes
    WHERE user_resumes.id = certifications.resume_id
    AND user_resumes.user_id = auth.uid()
  )
);

-- 5. Verification Query
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('education', 'certifications');

SELECT '✅ RLS enabled and policies created for education & certifications' as status;
