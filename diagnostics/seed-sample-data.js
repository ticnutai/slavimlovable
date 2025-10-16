/**
 * סקריפט למילוי טבלאות Supabase בנתונים לדוגמה
 * מוסיף משתמשים, פרופילים, פרויקטים, משימות ותזכורות
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טען משתני סביבה
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ חסרים משתני סביבה: VITE_SUPABASE_URL או SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// צור client עם service role (יכולות admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('╔════════════════════════════════════════╗');
console.log('║   מוסיף נתונים לדוגמה ל-Supabase     ║');
console.log('╚════════════════════════════════════════╝\n');

/**
 * נקה טבלה (אופציונלי)
 */
async function clearTable(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // מחק הכל
    
    if (error && !error.message.includes('does not exist')) {
      console.log(`⚠️  לא ניתן לנקות ${tableName}: ${error.message}`);
    } else {
      console.log(`🗑️  נוקה ${tableName}`);
    }
  } catch (err) {
    console.log(`⚠️  שגיאה בניקוי ${tableName}: ${err.message}`);
  }
}

/**
 * הוסף משתמשים
 */
async function addUsers() {
  console.log('\n👥 מוסיף משתמשים...');
  
  const users = [
    {
      email: 'john@example.com',
      name: 'ג\'ון דו',
      role: 'admin'
    },
    {
      email: 'jane@example.com',
      name: 'ג\'יין סמית',
      role: 'user'
    },
    {
      email: 'bob@example.com',
      name: 'בוב ג\'ונסון',
      role: 'user'
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(users)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ נוספו ${data.length} משתמשים`);
    return data;
  } catch (error) {
    console.log(`❌ שגיאה בהוספת משתמשים: ${error.message}`);
    return [];
  }
}

/**
 * הוסף פרופילים
 */
async function addProfiles(users) {
  console.log('\n👤 מוסיף פרופילים...');
  
  if (!users || users.length === 0) {
    console.log('⚠️  אין משתמשים, מדלג על פרופילים');
    return [];
  }
  
  const profiles = users.map((user, index) => ({
    user_id: user.id,
    bio: `זהו הביוגרפיה של ${user.name}. אני אוהב לעבוד על פרויקטים מעניינים!`,
    avatar_url: `https://i.pravatar.cc/150?img=${index + 1}`,
    phone: `050-${Math.floor(Math.random() * 9000000) + 1000000}`
  }));
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profiles)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ נוספו ${data.length} פרופילים`);
    return data;
  } catch (error) {
    console.log(`❌ שגיאה בהוספת פרופילים: ${error.message}`);
    return [];
  }
}

/**
 * הוסף פרויקטים
 */
async function addProjects(users) {
  console.log('\n📁 מוסיף פרויקטים...');
  
  if (!users || users.length === 0) {
    console.log('⚠️  אין משתמשים, מדלג על פרויקטים');
    return [];
  }
  
  const projects = [
    {
      name: 'אתר חדש',
      description: 'בניית אתר חדש לחברה',
      status: 'active',
      owner_id: users[0]?.id,
      start_date: '2025-10-01',
      end_date: '2025-12-31'
    },
    {
      name: 'אפליקציית מובייל',
      description: 'פיתוח אפליקציה למובייל iOS ו-Android',
      status: 'active',
      owner_id: users[1]?.id,
      start_date: '2025-09-15',
      end_date: '2025-11-30'
    },
    {
      name: 'שיפור תשתית',
      description: 'שדרוג תשתית השרתים והאבטחה',
      status: 'planning',
      owner_id: users[0]?.id,
      start_date: '2025-11-01',
      end_date: '2026-01-31'
    },
    {
      name: 'מערכת CRM',
      description: 'פיתוח מערכת ניהול לקוחות פנימית',
      status: 'completed',
      owner_id: users[2]?.id,
      start_date: '2025-07-01',
      end_date: '2025-09-30'
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(projects)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ נוספו ${data.length} פרויקטים`);
    return data;
  } catch (error) {
    console.log(`❌ שגיאה בהוספת פרויקטים: ${error.message}`);
    return [];
  }
}

/**
 * הוסף משימות
 */
async function addTasks(projects, users) {
  console.log('\n✓ מוסיף משימות...');
  
  if (!projects || projects.length === 0) {
    console.log('⚠️  אין פרויקטים, מדלג על משימות');
    return [];
  }
  
  const tasks = [
    {
      title: 'עיצוב ממשק משתמש',
      description: 'עיצוב ממשק המשתמש הראשי של האתר',
      status: 'in_progress',
      priority: 'high',
      project_id: projects[0]?.id,
      assigned_to: users[0]?.id,
      due_date: '2025-10-25'
    },
    {
      title: 'פיתוח API',
      description: 'בניית REST API לשרת',
      status: 'todo',
      priority: 'high',
      project_id: projects[0]?.id,
      assigned_to: users[1]?.id,
      due_date: '2025-10-30'
    },
    {
      title: 'בדיקות אבטחה',
      description: 'ביצוע בדיקות penetration testing',
      status: 'todo',
      priority: 'medium',
      project_id: projects[0]?.id,
      assigned_to: users[2]?.id,
      due_date: '2025-11-10'
    },
    {
      title: 'אינטגרציה עם Firebase',
      description: 'חיבור האפליקציה ל-Firebase',
      status: 'in_progress',
      priority: 'high',
      project_id: projects[1]?.id,
      assigned_to: users[1]?.id,
      due_date: '2025-10-20'
    },
    {
      title: 'עיצוב אייקונים',
      description: 'יצירת אייקונים לאפליקציה',
      status: 'completed',
      priority: 'low',
      project_id: projects[1]?.id,
      assigned_to: users[0]?.id,
      due_date: '2025-10-10'
    },
    {
      title: 'כתיבת מסמכים',
      description: 'כתיבת documentation למפתחים',
      status: 'todo',
      priority: 'medium',
      project_id: projects[2]?.id,
      assigned_to: users[2]?.id,
      due_date: '2025-11-15'
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ נוספו ${data.length} משימות`);
    return data;
  } catch (error) {
    console.log(`❌ שגיאה בהוספת משימות: ${error.message}`);
    return [];
  }
}

/**
 * הוסף תזכורות
 */
async function addReminders(users, tasks) {
  console.log('\n🔔 מוסיף תזכורות...');
  
  if (!users || users.length === 0) {
    console.log('⚠️  אין משתמשים, מדלג על תזכורות');
    return [];
  }
  
  const reminders = [
    {
      title: 'ישיבת צוות שבועית',
      description: 'ישיבה שבועית עם כל הצוות',
      remind_at: '2025-10-18T10:00:00Z',
      user_id: users[0]?.id,
      task_id: tasks[0]?.id,
      is_sent: false
    },
    {
      title: 'הגשת דוח חודשי',
      description: 'יש להגיש דוח התקדמות חודשי',
      remind_at: '2025-10-31T16:00:00Z',
      user_id: users[0]?.id,
      task_id: null,
      is_sent: false
    },
    {
      title: 'סקירת קוד',
      description: 'סקירת הקוד החדש שנכתב השבוע',
      remind_at: '2025-10-19T14:00:00Z',
      user_id: users[1]?.id,
      task_id: tasks[1]?.id,
      is_sent: false
    },
    {
      title: 'עדכון ספריות',
      description: 'לעדכן את כל ה-dependencies',
      remind_at: '2025-10-20T09:00:00Z',
      user_id: users[2]?.id,
      task_id: tasks[2]?.id,
      is_sent: false
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminders)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ נוספו ${data.length} תזכורות`);
    return data;
  } catch (error) {
    console.log(`❌ שגיאה בהוספת תזכורות: ${error.message}`);
    return [];
  }
}

/**
 * הצג סיכום
 */
async function showSummary() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   סיכום נתונים במסד הנתונים          ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const tables = ['users', 'profiles', 'projects', 'tasks', 'reminders'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: שגיאה - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} רשומות`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

/**
 * נקודת כניסה ראשית
 */
async function main() {
  try {
    // בחר: לנקות או לא לנקות טבלאות קודם
    const shouldClear = process.argv.includes('--clear');
    
    if (shouldClear) {
      console.log('🗑️  מנקה טבלאות קיימות...\n');
      await clearTable('reminders');
      await clearTable('tasks');
      await clearTable('projects');
      await clearTable('profiles');
      await clearTable('users');
    }
    
    // הוסף נתונים
    const users = await addUsers();
    const profiles = await addProfiles(users);
    const projects = await addProjects(users);
    const tasks = await addTasks(projects, users);
    const reminders = await addReminders(users, tasks);
    
    // הצג סיכום
    await showSummary();
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   ✅ הושלם בהצלחה!                    ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log('🌐 עכשיו פתח את: diagnostics/view-data.html\n');
    
  } catch (error) {
    console.error('\n❌ שגיאה:', error.message);
    process.exit(1);
  }
}

// הרץ
main();
