import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('❌ Missing SUPABASE envs');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

async function addFoldersRLS() {
  console.log('🔧 Adding RLS policies for folders table...');

  const policies = [
    {
      name: 'Authenticated users can view folders',
      sql: `
        CREATE POLICY IF NOT EXISTS "Authenticated users can view folders"
        ON public.folders
        FOR SELECT
        TO authenticated
        USING (true);
      `
    },
    {
      name: 'Authenticated users can create folders',
      sql: `
        CREATE POLICY IF NOT EXISTS "Authenticated users can create folders"
        ON public.folders
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
      `
    },
    {
      name: 'Users can update their own folders',
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can update their own folders"
        ON public.folders
        FOR UPDATE
        TO authenticated
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
      `
    },
    {
      name: 'Users can delete their own folders',
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can delete their own folders"
        ON public.folders
        FOR DELETE
        TO authenticated
        USING (created_by = auth.uid());
      `
    }
  ];

  for (const policy of policies) {
    console.log(`  Adding: ${policy.name}...`);
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) throw error;
      console.log(`  ✅ ${policy.name}`);
    } catch (err) {
      console.log(`  ⚠️  ${policy.name} - ${err.message}`);
    }
  }

  console.log('\n✅ Done!');
}

addFoldersRLS().catch((e) => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
