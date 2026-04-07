-- Migration: Allow admin users to share sticky notes between each other
-- Admins can see, edit, and delete each other's sticky notes

-- Helper function: check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_sticky_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('awoodw@gmail.com', 'efrain.pradas@gmail.com', 'isacriperez@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Replace SELECT policy: own notes OR admin sees all admin notes
DROP POLICY IF EXISTS "Users can view their own sticky notes" ON public.sticky_notes;
DROP POLICY IF EXISTS "Users can view sticky notes" ON public.sticky_notes;
CREATE POLICY "Users can view sticky notes"
    ON public.sticky_notes FOR SELECT
    USING (
      auth.uid() = user_id
      OR (
        public.is_sticky_admin()
        AND user_id IN (SELECT id FROM auth.users WHERE email IN ('awoodw@gmail.com', 'efrain.pradas@gmail.com', 'isacriperez@gmail.com'))
      )
    );

-- Replace UPDATE policy: own notes OR admin can update other admin notes
DROP POLICY IF EXISTS "Users can update their own sticky notes" ON public.sticky_notes;
CREATE POLICY "Users can update their own sticky notes"
    ON public.sticky_notes FOR UPDATE
    USING (
      auth.uid() = user_id
      OR (
        public.is_sticky_admin()
        AND user_id IN (SELECT id FROM auth.users WHERE email IN ('awoodw@gmail.com', 'efrain.pradas@gmail.com', 'isacriperez@gmail.com'))
      )
    )
    WITH CHECK (
      auth.uid() = user_id
      OR public.is_sticky_admin()
    );

-- Replace DELETE policy: own notes OR admin can delete other admin notes
DROP POLICY IF EXISTS "Users can delete their own sticky notes" ON public.sticky_notes;
CREATE POLICY "Users can delete their own sticky notes"
    ON public.sticky_notes FOR DELETE
    USING (
      auth.uid() = user_id
      OR (
        public.is_sticky_admin()
        AND user_id IN (SELECT id FROM auth.users WHERE email IN ('awoodw@gmail.com', 'efrain.pradas@gmail.com', 'isacriperez@gmail.com'))
      )
    );
