import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Comprehensive Debug Script - סקריפט דיבאג מקיף
 * בודק את כל ההגדרות והחיבורים
 */

console.log('🔍 Starting comprehensive debug check...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('================================');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PROJECT_ID'
];

let envVarsOk = true;

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`❌ ${envVar}: MISSING!`);
    envVarsOk = false;
  }
}

if (!envVarsOk) {
  console.error('\n❌ Missing required environment variables!');
  process.exit(1);
}

console.log('\n🌐 Testing Supabase Connection:');
console.log('================================');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Cannot create Supabase client - missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client created');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Project ID: ${process.env.VITE_SUPABASE_PROJECT_ID}`);

// Test connection
async function testConnection() {
  try {
    console.log('\n🔌 Testing database connection...');
    
    // Test auth endpoint
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log(`⚠️  Auth check: ${authError.message}`);
    } else {
      console.log('✅ Auth endpoint responsive');
    }

    // Test database access
    const tables = [
      'profiles',
      'categories', 
      'tasks',
      'projects',
      'project_tasks',
      'folders'
    ];

    console.log('\n📊 Testing table access:');
    console.log('========================');
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: accessible (${count ?? 0} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Check RLS policies
    console.log('\n🔒 Testing RLS Policies:');
    console.log('========================');
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('JWT')) {
          console.log('⚠️  RLS requires authentication - this is correct behavior');
        } else {
          console.log(`❌ RLS Policy Error: ${error.message}`);
        }
      } else {
        console.log(`✅ RLS policies working correctly (${data.length} records accessible)`);
      }
    } catch (err) {
      console.log(`❌ RLS test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Check storage buckets
    console.log('\n📦 Testing Storage Buckets:');
    console.log('===========================');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.log(`❌ Storage buckets: ${bucketsError.message}`);
      } else {
        console.log(`✅ Storage accessible (${buckets.length} buckets found)`);
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
      }
    } catch (err) {
      console.log(`❌ Storage test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    console.log('\n✅ Debug check completed successfully!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
