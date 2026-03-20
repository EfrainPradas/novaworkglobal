-- ============================================================
-- RLS Policies for coach_clients table
-- ============================================================

-- 1. Enable RLS
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their coach-client relations" ON public.coach_clients;
DROP POLICY IF EXISTS "Users can create coach-client relations" ON public.coach_clients;
DROP POLICY IF EXISTS "Users can update their coach-client relations" ON public.coach_clients;
DROP POLICY IF EXISTS "Users can delete their coach-client relations" ON public.coach_clients;

-- 3. View: Users can see relations where they are the coach OR the client
CREATE POLICY "Users can view their coach-client relations" 
ON public.coach_clients
FOR SELECT
USING (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 4. Insert: Users can create relations where they are the coach OR the client
CREATE POLICY "Users can create coach-client relations" 
ON public.coach_clients
FOR INSERT
WITH CHECK (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 5. Update: Users can update relations where they are the coach OR the client
CREATE POLICY "Users can update their coach-client relations" 
ON public.coach_clients
FOR UPDATE
USING (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 6. Delete: Users can delete relations where they are the coach OR the client
CREATE POLICY "Users can delete their coach-client relations" 
ON public.coach_clients
FOR DELETE
USING (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 7. Grant access to authenticated users
GRANT ALL ON TABLE public.coach_clients TO authenticated;
GRANT ALL ON TABLE public.coach_clients TO anon;

-- ============================================================
-- RLS Policies for coaching_sessions table
-- ============================================================

-- 1. Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can view their coaching sessions" ON public.coaching_sessions;
DROP POLICY IF EXISTS "Users can create coaching sessions" ON public.coaching_sessions;
DROP POLICY IF EXISTS "Users can update their coaching sessions" ON public.coaching_sessions;
DROP POLICY IF EXISTS "Users can delete their coaching sessions" ON public.coaching_sessions;

-- 3. View: Users can see sessions where they are the coach OR the client
CREATE POLICY "Users can view their coaching sessions" 
ON public.coaching_sessions
FOR SELECT
USING (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 4. Insert: Users can create sessions where they are the coach OR the client
CREATE POLICY "Users can create coaching sessions" 
ON public.coaching_sessions
FOR INSERT
WITH CHECK (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 5. Update: Users can update sessions where they are the coach OR the client
CREATE POLICY "Users can update their coaching sessions" 
ON public.coaching_sessions
FOR UPDATE
USING (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 6. Delete: Users can delete sessions where they are the coach OR the client
CREATE POLICY "Users can delete their coaching sessions" 
ON public.coaching_sessions
FOR DELETE
USING (
    auth.uid() = coach_id 
    OR 
    auth.uid() = client_id
);

-- 7. Grant access
GRANT ALL ON TABLE public.coaching_sessions TO authenticated;
GRANT ALL ON TABLE public.coaching_sessions TO anon;
