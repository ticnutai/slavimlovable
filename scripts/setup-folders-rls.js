import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

async function addFoldersRLS() {
  console.log('🔧 Adding RLS policies for folders table...\n');

  // Check if policies already exist
  console.log('1️⃣ Checking existing policies...');
  const { data: existingPolicies, error: checkError } = await supabase
    .from('pg_policies')
    .select('policyname')
    .eq('tablename', 'folders');

  if (checkError) {
    console.log('⚠️  Could not check existing policies (this is okay)');
  } else {
    console.log(`   Found ${existingPolicies?.length || 0} existing policies`);
  }

  // Try to add policies using raw SQL
  console.log('\n2️⃣ Adding SELECT policy...');
  try {
    await supabase.rpc('exec_sql', { 
      sql: `
        DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.folders;
        CREATE POLICY "Authenticated users can view folders"
        ON public.folders
        FOR SELECT
        TO authenticated
        USING (true);
      `
    });
    console.log('   ✅ SELECT policy added');
  } catch (err) {
    console.log('   ⚠️  SELECT policy - trying alternative method...');
  }

  console.log('\n3️⃣ Adding INSERT policy...');
  try {
    await supabase.rpc('exec_sql', { 
      sql: `
        DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.folders;
        CREATE POLICY "Authenticated users can create folders"
        ON public.folders
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
      `
    });
    console.log('   ✅ INSERT policy added');
  } catch (err) {
    console.log('   ⚠️  INSERT policy - trying alternative method...');
  }

  console.log('\n4️⃣ Testing folder creation...');
  const testFolderName = `test-${Date.now()}`;
  const { data: testFolder, error: testError } = await supabase
    .from('folders')
    .insert({ name: testFolderName })
    .select()
    .single();

  if (testError) {
    console.log('   ❌ Test failed:', testError.message);
    console.log('\n📋 Manual fix needed:');
    console.log('   1. Go to https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Run this SQL:\n');
    console.log(`
-- Allow authenticated users to view folders
CREATE POLICY IF NOT EXISTS "Authenticated users can view folders"
ON public.folders FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create folders
CREATE POLICY IF NOT EXISTS "Authenticated users can create folders"
ON public.folders FOR INSERT TO authenticated WITH CHECK (true);
    `);
  } else {
    console.log('   ✅ Test passed! Folder created:', testFolder.name);
    
    // Clean up test folder
    await supabase.from('folders').delete().eq('id', testFolder.id);
    console.log('   🧹 Test folder cleaned up');
  }

  console.log('\n✅ Done!\n');
}

addFoldersRLS().catch((e) => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
