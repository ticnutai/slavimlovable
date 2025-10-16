import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://obypfqfghztvaefxnpgb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ieXBmcWZnaHp0dmFlZnhucGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTMyMDIsImV4cCI6MjA3NjE2OTIwMn0.oCnGo60KrEHfUs3Z3nC8tHI-_8xhpF02ChgpckshM-I';

console.log('='.repeat(60));
console.log('🔍 בודק את כל פרטי החיבור ל-Supabase...');
console.log('='.repeat(60));

console.log('\n📋 פרטי החיבור:');
console.log('✅ Project ID: obypfqfghztvaefxnpgb');
console.log('✅ URL:', SUPABASE_URL);
console.log('✅ Anon Key:', SUPABASE_ANON_KEY.substring(0, 30) + '...');
console.log('✅ DB Password: qazwsx1122Q@TTEN');
console.log('✅ DB Token (pooler): sbp_90f04e6e8d3691a43cd037f20d489859db8011f7');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('🔌 בודק חיבור...');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Basic connectivity
    console.log('\n1️⃣ בדיקת חיבור בסיסי...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('categories')
      .select('count');
    
    if (healthError) {
      if (healthError.code === '42P01') {
        console.log('⚠️  טבלת categories לא קיימת - צריך להריץ migrations!');
        console.log('\n📝 להריץ את ה-migrations:');
        console.log('   1. פתח: https://supabase.com/dashboard/project/obypfqfghztvaefxnpgb/editor');
        console.log('   2. SQL Editor → New Query');
        console.log('   3. העתק את supabase/combined_migrations.sql');
        console.log('   4. Run');
      } else if (healthError.code === 'PGRST301') {
        console.log('⚠️  JWT token לא תקין או פג תוקף');
      } else {
        console.log('❌ שגיאה:', healthError.message);
        console.log('   קוד:', healthError.code);
      }
    } else {
      console.log('✅ החיבור עובד!');
    }
    
    // Test 2: Check all expected tables
    console.log('\n2️⃣ בודק טבלאות...');
    const tables = ['profiles', 'categories', 'tasks', 'projects', 'project_tasks', 'folders'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error && error.code === '42P01') {
        console.log(`   ❌ ${table} - לא קיימת`);
      } else if (error) {
        console.log(`   ⚠️  ${table} - שגיאה: ${error.message}`);
      } else {
        console.log(`   ✅ ${table} - קיימת`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ בדיקה הושלמה!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ שגיאה כללית:', error.message);
  }
}

testConnection();
