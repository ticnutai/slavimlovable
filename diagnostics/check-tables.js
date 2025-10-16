/**
 * בדיקה מהירה - אילו טבלאות באמת קיימות
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 בודק אילו טבלאות קיימות...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_KEY);

const tables = ['users', 'profiles', 'projects', 'tasks', 'reminders', 'task_assignments', 'project_members'];

async function checkTables() {
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.log(`❌ ${table}: לא קיימת`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: קיימת (${count || 0} רשומות)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n📊 מנסה לקבל רשימת טבלאות מ-information_schema...\n');
  
  try {
    const { data, error } = await supabase
      .rpc('get_tables_list');
    
    if (data) {
      console.log('טבלאות שנמצאו:', data);
    }
  } catch (err) {
    console.log('לא ניתן לקבל רשימה דרך RPC');
  }
}

checkTables();
