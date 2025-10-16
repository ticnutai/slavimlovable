import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// Extract connection details from Supabase URL
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Supabase connection string format:
// postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref');
  process.exit(1);
}

console.log('🔧 Fixing folders RLS policies via direct PostgreSQL connection...\n');
console.log('📍 Project:', projectRef);
console.log('⚠️  Note: This requires database password from Supabase Dashboard\n');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  How to get your database password:                       ║');
console.log('║  1. Go to https://app.supabase.com                        ║');
console.log('║  2. Select your project                                    ║');
console.log('║  3. Go to Project Settings → Database                      ║');
console.log('║  4. Look for "Connection string" or "Connection pooling"   ║');
console.log('║  5. Copy the password                                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// For now, we'll provide the SQL to run manually
console.log('📋 SQL to run in Supabase SQL Editor:');
console.log('=====================================\n');

const sql = `
-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.folders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.folders;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.folders;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.folders;

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON public.folders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.folders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for users based on user_id"
ON public.folders FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable delete for users based on user_id"
ON public.folders FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'folders';
`;

console.log(sql);

console.log('\n✨ Quick Guide:');
console.log('═══════════════');
console.log('1. Copy the SQL above (from DROP POLICY to SELECT)');
console.log('2. Go to: https://app.supabase.com');
console.log('3. Select your project');
console.log('4. Click "SQL Editor" in the left sidebar');
console.log('5. Click "New query"');
console.log('6. Paste the SQL');
console.log('7. Click "Run" or press Ctrl+Enter');
console.log('8. You should see 4 policies in the results');
console.log('\n🔗 Direct link: https://app.supabase.com/project/' + projectRef + '/sql/new');
