-- Add RLS policies for folders table

-- Allow authenticated users to view all folders
CREATE POLICY "Authenticated users can view folders"
ON public.folders
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create folders
CREATE POLICY "Authenticated users can create folders"
ON public.folders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own folders
CREATE POLICY "Users can update their own folders"
ON public.folders
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own folders
CREATE POLICY "Users can delete their own folders"
ON public.folders
FOR DELETE
TO authenticated
USING (created_by = auth.uid());
