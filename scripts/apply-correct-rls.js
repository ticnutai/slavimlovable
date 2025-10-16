import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

console.log('🔧 Applying correct RLS policies for folders table...\n');

async function applyRLSPolicies() {
  // Drop all existing policies
  console.log('1️⃣ Dropping existing policies...');
  
  const dropPolicies = `
    DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.folders;
    DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.folders;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.folders;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.folders;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.folders;
  `;
  
  const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
  
  if (dropError) {
    console.error('⚠️  Could not drop policies:', dropError.message);
  } else {
    console.log('✅ Existing policies dropped');
  }
  
  // Enable RLS
  console.log('\n2️⃣ Ensuring RLS is enabled...');
  const { error: rlsError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;'
  });
  
  if (rlsError) {
    console.error('⚠️  RLS enable error:', rlsError.message);
  } else {
    console.log('✅ RLS enabled');
  }
  
  // Create new policies based on Supabase best practices
  console.log('\n3️⃣ Creating new RLS policies...');
  
  const createPolicies = `
    -- SELECT: Allow authenticated users to view all folders
    CREATE POLICY "Enable read access for authenticated users"
    ON public.folders FOR SELECT
    TO authenticated
    USING (true);
    
    -- INSERT: Allow authenticated users to insert folders with their own user_id
    CREATE POLICY "Enable insert for authenticated users"
    ON public.folders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);
    
    -- UPDATE: Allow users to update their own folders
    CREATE POLICY "Enable update for users based on user_id"
    ON public.folders FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
    
    -- DELETE: Allow users to delete their own folders
    CREATE POLICY "Enable delete for users based on user_id"
    ON public.folders FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
  `;
  
  const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
  
  if (createError) {
    console.error('❌ Failed to create policies:', createError.message);
    return false;
  }
  
  console.log('✅ All policies created successfully');
  
  // Test with a fake user ID
  console.log('\n4️⃣ Testing folder creation...');
  const testFolderId = `test-${Date.now()}`;
  const testUserId = '00000000-0000-0000-0000-000000000001';
  
  const { data: testFolder, error: testError } = await supabase
    .from('folders')
    .insert({ name: testFolderId, created_by: testUserId })
    .select()
    .single();
  
  if (testError) {
    console.error('❌ Test insert failed:', testError.message);
  } else {
    console.log('✅ Test insert succeeded:', testFolder);
    // Cleanup
    await supabase.from('folders').delete().eq('id', testFolder.id);
    console.log('🧹 Test folder cleaned up');
  }
  
  return true;
}

applyRLSPolicies()
  .then((success) => {
    if (success) {
      console.log('\n✅ RLS policies applied successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Try creating a folder in the app');
      console.log('2. Check browser console for debug logs');
      console.log('3. If still failing, check that user is authenticated (auth.uid() returns valid ID)');
    } else {
      console.log('\n❌ Failed to apply RLS policies');
      console.log('Try running the SQL manually in Supabase SQL Editor');
    }
  })
  .catch((e) => {
    console.error('❌ Script failed:', e.message);
    process.exit(1);
  });
