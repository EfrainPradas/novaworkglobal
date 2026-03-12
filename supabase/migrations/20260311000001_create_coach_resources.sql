-- 1. Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    resource_type TEXT NOT NULL, -- 'pdf', 'video', 'link', 'document', etc.
    file_url TEXT,
    external_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create resource_shares table
CREATE TABLE IF NOT EXISTS public.resource_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'shared', -- 'shared', 'viewed', 'completed'
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 3. Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_shares ENABLE ROW LEVEL SECURITY;

-- 4. RLS for resources
-- Coaches can manage their own resources
CREATE POLICY "Coaches can manage their own resources" 
ON public.resources
FOR ALL
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- Clients can view resources shared with them
CREATE POLICY "Clients can view resources shared with them" 
ON public.resources
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.resource_shares 
        WHERE resource_shares.resource_id = resources.id 
        AND resource_shares.client_id = auth.uid()
    )
);

-- 5. RLS for resource_shares
-- Coaches can manage their own shares
CREATE POLICY "Coaches can manage their own shares" 
ON public.resource_shares
FOR ALL
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- Clients can view and update shares assigned to them
CREATE POLICY "Clients can view their shares" 
ON public.resource_shares
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can update their shares" 
ON public.resource_shares
FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- 6. Updated time triggers
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Storage Bucket setup for coach resources
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('coach_resources', 'coach_resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for coach_resources bucket
-- 1. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload resources" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'coach_resources');

-- 2. Allow anyone to read the resources (since the bucket is public, but let's be explicit)
CREATE POLICY "Anyone can read coach resources" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'coach_resources');

-- 3. Allow owners to update/delete their own files
CREATE POLICY "Users can manage their own uploaded files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'coach_resources' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own uploaded files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'coach_resources' AND auth.uid() = owner);
