import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('❌ Missing SUPABASE envs');
  process.exit(1);
}

const supabase = createClient(url, serviceRole);

async function main() {
  console.log('🔧 Adding RLS policies for folders table...');

  const sql = fs.readFileSync('./supabase/migrations/20251016201300_add_folders_rls.sql', 'utf-8');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('✅ RLS policies added successfully!');
}

main().catch((e) => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
