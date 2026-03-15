-- Migration: Fix Education Table RLS
-- Description: Enables RLS and adds policies for the education table to allow users to manage their own records.

-- 1. Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.education ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own education records" ON public.education;
    DROP POLICY IF EXISTS "Users can view their own education" ON public.education;
    DROP POLICY IF EXISTS "Users can insert their own education" ON public.education;
    DROP POLICY IF EXISTS "Users can update their own education" ON public.education;
    DROP POLICY IF EXISTS "Users can delete their own education" ON public.education;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 3. Create a single comprehensive policy for users to manage their records
CREATE POLICY "Users can manage their own education records" 
ON public.education
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Grant access to authenticated users
GRANT ALL ON TABLE public.education TO authenticated;
GRANT ALL ON TABLE public.education TO service_role;
