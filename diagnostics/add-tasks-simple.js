/**
 * הוסף נתונים לדוגמה רק לטבלה tasks (שאנחנו יודעים שעובדת)
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✓ מוסיף משימות נוספות לדוגמה...\n');

const newTasks = [
  {
    title: 'לתכנן ארכיטקטורה',
    description: 'לתכנן את הארכיטקטורה הכללית של המערכת',
    status: 'todo',
    priority: 'high',
    due_date: '2025-10-25T00:00:00Z'
  },
  {
    title: 'לכתוב בדיקות יחידה',
    description: 'להוסיף כיסוי בדיקות של 80% לפחות',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2025-10-30T00:00:00Z'
  },
  {
    title: 'לשפר ביצועים',
    description: 'לאופטימיזציה של שאילתות SQL',
    status: 'todo',
    priority: 'low',
    due_date: '2025-11-10T00:00:00Z'
  },
  {
    title: 'לעדכן תיעוד',
    description: 'לעדכן את כל התיעוד הטכני',
    status: 'completed',
    priority: 'medium',
    due_date: '2025-10-15T00:00:00Z'
  },
  {
    title: 'סקירת אבטחה',
    description: 'לבצע סקירת אבטחה מקיפה',
    status: 'todo',
    priority: 'high',
    due_date: '2025-10-28T00:00:00Z'
  }
];

async function addTasks() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(newTasks)
      .select();
    
    if (error) {
      console.error('❌ שגיאה:', error.message);
      return;
    }
    
    console.log(`✅ נוספו ${data.length} משימות חדשות!\n`);
    console.log('המשימות שנוספו:');
    data.forEach((task, i) => {
      console.log(`  ${i + 1}. ${task.title} - ${task.status} (${task.priority})`);
    });
    
    // בדוק סה"כ
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 סה"כ משימות בטבלה: ${count}\n`);
    console.log('🌐 עכשיו פתח: diagnostics/view-data.html\n');
    
  } catch (err) {
    console.error('❌ שגיאה:', err.message);
  }
}

addTasks();
