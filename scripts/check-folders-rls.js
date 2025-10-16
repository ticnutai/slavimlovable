import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !serviceRole || !anonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

console.log('🔍 Checking folders table RLS policies and permissions...\n');

// Test with service role (bypasses RLS)
const supabaseAdmin = createClient(url, serviceRole);

// Test with anon key (affected by RLS)
const supabaseAnon = createClient(url, anonKey);

async function checkRLSStatus() {
  console.log('1️⃣ Checking if RLS is enabled on folders table...');
  
  const { data: tables, error: tablesError } = await supabaseAdmin
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'folders');
  
  if (tablesError) {
    console.error('❌ Error checking table:', tablesError.message);
  } else {
    console.log('✅ Table exists:', tables);
  }
  
  // Check RLS policies
  console.log('\n2️⃣ Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
    sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
          FROM pg_policies 
          WHERE tablename = 'folders';`
  });
  
  if (policiesError) {
    console.error('⚠️  Cannot check policies via RPC:', policiesError.message);
  } else {
    console.log('📋 Policies found:', JSON.stringify(policies, null, 2));
  }
}

async function testInsertWithAdmin() {
  console.log('\n3️⃣ Testing INSERT with service role (bypasses RLS)...');
  const testName = `test-admin-${Date.now()}`;
  
  const { data, error } = await supabaseAdmin
    .from('folders')
    .insert({ name: testName, created_by: '00000000-0000-0000-0000-000000000000' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Admin insert failed:', error);
  } else {
    console.log('✅ Admin insert succeeded:', data);
    // Cleanup
    await supabaseAdmin.from('folders').delete().eq('id', data.id);
    console.log('🧹 Cleaned up test folder');
  }
}

async function testInsertWithAnon() {
  console.log('\n4️⃣ Testing INSERT with anon key (affected by RLS)...');
  console.log('⚠️  Note: This should fail because anon user is not authenticated');
  
  const testName = `test-anon-${Date.now()}`;
  
  const { data, error } = await supabaseAnon
    .from('folders')
    .insert({ name: testName })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Anon insert failed (expected):', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  } else {
    console.log('✅ Anon insert succeeded (unexpected!):', data);
    await supabaseAdmin.from('folders').delete().eq('id', data.id);
  }
}

async function checkAuthUser() {
  console.log('\n5️⃣ Checking current authenticated user with anon key...');
  
  const { data: { user }, error } = await supabaseAnon.auth.getUser();
  
  if (error) {
    console.log('ℹ️  No authenticated user (expected for anon key):', error.message);
  } else if (!user) {
    console.log('ℹ️  No authenticated user');
  } else {
    console.log('✅ Authenticated user found:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
  }
}

async function suggestFix() {
  console.log('\n6️⃣ Suggested Fix:');
  console.log('====================');
  console.log('Based on common Supabase RLS issues, try this SQL in Supabase SQL Editor:');
  console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all folders
CREATE POLICY "Enable read access for authenticated users"
ON public.folders FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert folders with their own user_id
CREATE POLICY "Enable insert for authenticated users"
ON public.folders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own folders
CREATE POLICY "Enable update for users based on user_id"
ON public.folders FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own folders
CREATE POLICY "Enable delete for users based on user_id"
ON public.folders FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
  `);
}

async function main() {
  await checkRLSStatus();
  await testInsertWithAdmin();
  await testInsertWithAnon();
  await checkAuthUser();
  await suggestFix();
  
  console.log('\n✅ Diagnostic complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Check the console output in your browser when clicking "הוסף תיקייה"');
  console.log('2. Copy the SQL fix above and run it in Supabase SQL Editor');
  console.log('3. Try creating a folder again');
}

main().catch(console.error);
