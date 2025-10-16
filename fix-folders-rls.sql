-- ============================================
-- FIX: Supabase RLS for folders table
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.folders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.folders;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.folders;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.folders;

-- Step 2: Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Step 3: Create correct policies based on Supabase documentation
-- Reference: https://supabase.com/docs/guides/auth/row-level-security

-- SELECT: Allow authenticated users to view all folders
CREATE POLICY "Enable read access for authenticated users"
ON public.folders FOR SELECT
TO authenticated
USING (true);

-- INSERT: Allow authenticated users to insert folders with their own user_id
-- Key fix: auth.uid() = created_by in WITH CHECK clause
CREATE POLICY "Enable insert for authenticated users"
ON public.folders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- UPDATE: Allow users to update only their own folders
CREATE POLICY "Enable update for users based on user_id"
ON public.folders FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- DELETE: Allow users to delete only their own folders
CREATE POLICY "Enable delete for users based on user_id"
ON public.folders FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Step 4: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'folders';

-- Expected output: 4 policies (SELECT, INSERT, UPDATE, DELETE)
