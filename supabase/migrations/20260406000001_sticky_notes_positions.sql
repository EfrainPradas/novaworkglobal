-- Migration: Ensure sticky_notes has position columns and UPDATE RLS policy
-- Fix: positions weren't persisting because the UPDATE RLS policy was missing

-- 1. Add position columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'sticky_notes'
      AND column_name  = 'position_x'
  ) THEN
    ALTER TABLE public.sticky_notes ADD COLUMN position_x real NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'sticky_notes'
      AND column_name  = 'position_y'
  ) THEN
    ALTER TABLE public.sticky_notes ADD COLUMN position_y real NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;

-- 3. Add UPDATE policy if missing (idempotent: DROP IF EXISTS + CREATE)
DROP POLICY IF EXISTS "Users can update their own sticky notes" ON public.sticky_notes;
CREATE POLICY "Users can update their own sticky notes"
    ON public.sticky_notes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Also ensure DELETE policy exists
DROP POLICY IF EXISTS "Users can delete their own sticky notes" ON public.sticky_notes;
CREATE POLICY "Users can delete their own sticky notes"
    ON public.sticky_notes FOR DELETE
    USING (auth.uid() = user_id);
