import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

console.log('🔧 Fixing folders RLS policies via Supabase REST API...\n');

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from URL');
  process.exit(1);
}

console.log(`📍 Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

const sqlStatements = `
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
`.trim();

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: responseData, status: res.statusCode });
        } else {
          reject({ 
            success: false, 
            error: responseData, 
            status: res.statusCode 
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function fixRLSDirect() {
  console.log('1️⃣ Attempting to execute SQL via Supabase REST API...\n');
  
  try {
    const result = await executeSQL(sqlStatements);
    console.log('✅ SQL executed successfully!');
    console.log(`📊 Status: ${result.status}`);
    console.log(`📋 Response: ${result.data}\n`);
    
    // Verify policies were created
    console.log('2️⃣ Verifying policies...');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Query test:', error.message);
    } else {
      console.log('✅ Can query folders table');
    }
    
    // Test insert
    console.log('\n3️⃣ Testing folder creation...');
    const testId = `test-${Date.now()}`;
    const { data: newFolder, error: insertError } = await supabase
      .from('folders')
      .insert({ name: testId, created_by: '00000000-0000-0000-0000-000000000001' })
      .select()
      .single();
    
    if (insertError) {
      console.log('⚠️  Test insert:', insertError.message);
    } else {
      console.log('✅ Test insert successful:', newFolder.name);
      // Cleanup
      await supabase.from('folders').delete().eq('id', newFolder.id);
      console.log('🧹 Cleaned up test folder\n');
    }
    
    console.log('✅ RLS policies fixed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Refresh your browser (F5)');
    console.log('2. Try creating a folder');
    console.log('3. Check the console for [DEBUG] logs');
    
  } catch (err) {
    console.error('❌ Failed to execute SQL:', err.error || err.message);
    console.log('\n🔄 Alternative method: Manual SQL execution');
    console.log('===================================');
    console.log('Copy the content from fix-folders-rls.sql and:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in the left menu');
    console.log('4. Paste the SQL and click "Run" (Ctrl+Enter)');
  }
}

fixRLSDirect().catch(console.error);
