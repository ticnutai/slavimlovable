/**
 * שלב 1: בדיקת חיבור Supabase
 * מנסה להתחבר ל-Supabase ומבצע בדיקות בסיסיות
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טען משתני סביבה
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * תוצאות בדיקות
 */
const results = {
  timestamp: new Date().toISOString(),
  phase: 1,
  title: 'בדיקת חיבור Supabase',
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  success: false,
  canProceedToPhase2: false
};

/**
 * הוסף תוצאת בדיקה
 */
function addTest(name, status, message, details = null) {
  results.tests.push({
    name,
    status, // 'pass', 'fail', 'warning'
    message,
    details,
    timestamp: new Date().toISOString()
  });
  
  results.summary.total++;
  if (status === 'pass') results.summary.passed++;
  if (status === 'fail') results.summary.failed++;
  if (status === 'warning') results.summary.warnings++;
}

/**
 * בדוק משתני סביבה
 */
function testEnvironmentVariables() {
  console.log('🔍 בודק משתני סביבה...');
  
  if (!SUPABASE_URL) {
    addTest(
      'VITE_SUPABASE_URL',
      'fail',
      'משתנה סביבה חסר: VITE_SUPABASE_URL',
      'יש להגדיר את ה-URL של פרויקט Supabase בקובץ .env'
    );
    return false;
  } else {
    addTest(
      'VITE_SUPABASE_URL',
      'pass',
      `URL תקין: ${SUPABASE_URL}`
    );
  }
  
  if (!SUPABASE_PUBLISHABLE_KEY) {
    addTest(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'fail',
      'משתנה סביבה חסר: VITE_SUPABASE_PUBLISHABLE_KEY',
      'יש להגדיר את המפתח הציבורי (anon key) בקובץ .env'
    );
    return false;
  } else {
    addTest(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'pass',
      'מפתח ציבורי נמצא (anon key)'
    );
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    addTest(
      'SUPABASE_SERVICE_ROLE_KEY',
      'warning',
      'מפתח service role לא נמצא',
      'לא חובה לבדיקות בסיסיות, אך נדרש לפעולות admin'
    );
  } else {
    addTest(
      'SUPABASE_SERVICE_ROLE_KEY',
      'pass',
      'מפתח service role נמצא'
    );
  }
  
  return true;
}

/**
 * נסה ליצור client
 */
function testClientCreation() {
  console.log('🔍 מנסה ליצור Supabase client...');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    addTest(
      'יצירת Client',
      'pass',
      'Supabase client נוצר בהצלחה'
    );
    
    return supabase;
  } catch (error) {
    addTest(
      'יצירת Client',
      'fail',
      'נכשל ליצור Supabase client',
      {
        error: error.message,
        stack: error.stack
      }
    );
    return null;
  }
}

/**
 * בדוק חיבור רשת בסיסי
 */
async function testNetworkConnection(supabase) {
  console.log('🔍 בודק חיבור רשת ל-Supabase...');
  
  try {
    // נסה לבצע health check פשוט
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('_health_check_dummy_')
      .select('*')
      .limit(1);
    
    const duration = Date.now() - startTime;
    
    // אפילו אם הטבלה לא קיימת, זה אומר שיש חיבור
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      addTest(
        'חיבור רשת',
        'pass',
        `חיבור ל-Supabase הצליח (${duration}ms)`,
        'השרת מגיב, אך הטבלה לא קיימת (זה בסדר לבדיקה)'
      );
      return true;
    }
    
    if (error) {
      // שגיאות אחרות
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        addTest(
          'חיבור רשת',
          'fail',
          'נכשל להתחבר ל-Supabase - בעיית רשת',
          {
            error: error.message,
            hint: 'בדוק חיבור אינטרנט או שה-URL תקין'
          }
        );
        return false;
      }
      
      if (error.message.includes('JWT') || error.message.includes('apikey')) {
        addTest(
          'חיבור רשת',
          'fail',
          'מפתח API לא תקין',
          {
            error: error.message,
            hint: 'בדוק שה-PUBLISHABLE_KEY תקין ב-.env'
          }
        );
        return false;
      }
      
      // שגיאה לא מזוהה אך יש תגובה מהשרת
      addTest(
        'חיבור רשת',
        'warning',
        'השרת מגיב אך יש שגיאה',
        {
          error: error.message,
          duration: `${duration}ms`
        }
      );
      return true;
    }
    
    // הכל תקין
    addTest(
      'חיבור רשת',
      'pass',
      `חיבור מלא ל-Supabase הצליח (${duration}ms)`
    );
    return true;
    
  } catch (error) {
    addTest(
      'חיבור רשת',
      'fail',
      'חריג לא צפוי בבדיקת חיבור',
      {
        error: error.message,
        stack: error.stack
      }
    );
    return false;
  }
}

/**
 * בדוק טבלאות קיימות
 */
async function testDatabaseTables(supabase) {
  console.log('🔍 בודק טבלאות במסד נתונים...');
  
  const commonTables = ['users', 'profiles', 'projects', 'tasks', 'reminders'];
  const foundTables = [];
  const missingTables = [];
  
  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          missingTables.push(tableName);
        } else {
          // שגיאה אחרת - אולי הרשאות
          addTest(
            `טבלה: ${tableName}`,
            'warning',
            `לא ניתן לגשת לטבלה`,
            { error: error.message }
          );
        }
      } else {
        foundTables.push(tableName);
      }
    } catch (err) {
      // שגיאה כללית
    }
  }
  
  if (foundTables.length > 0) {
    addTest(
      'טבלאות במסד נתונים',
      'pass',
      `נמצאו ${foundTables.length} טבלאות: ${foundTables.join(', ')}`
    );
  } else {
    addTest(
      'טבלאות במסד נתונים',
      'warning',
      'לא נמצאו טבלאות ידועות',
      {
        searched: commonTables,
        hint: 'ייתכן שהמסד נתונים ריק או שאין הרשאות קריאה'
      }
    );
  }
}

/**
 * בדוק Auth (אימות)
 */
async function testAuth(supabase) {
  console.log('🔍 בודק מערכת אימות...');
  
  try {
    // נסה לקבל session (בלי להתחבר)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      addTest(
        'מערכת אימות',
        'warning',
        'לא ניתן לבדוק session',
        { error: error.message }
      );
    } else {
      addTest(
        'מערכת אימות',
        'pass',
        session ? 'יש session פעיל' : 'אין session (זה תקין לבדיקה)'
      );
    }
  } catch (error) {
    addTest(
      'מערכת אימות',
      'fail',
      'שגיאה במערכת אימות',
      {
        error: error.message,
        stack: error.stack
      }
    );
  }
}

/**
 * הפעל את כל הבדיקות
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   מערכת אבחון אוטומטית - שלב 1       ║');
  console.log('║   בדיקת חיבור Supabase                ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  // בדיקה 1: משתני סביבה
  const envOk = testEnvironmentVariables();
  if (!envOk) {
    console.log('❌ נכשל בבדיקת משתני סביבה - לא ניתן להמשיך\n');
    return results;
  }
  
  // בדיקה 2: יצירת client
  const supabase = testClientCreation();
  if (!supabase) {
    console.log('❌ נכשל ליצור Supabase client - לא ניתן להמשיך\n');
    return results;
  }
  
  // בדיקה 3: חיבור רשת
  const networkOk = await testNetworkConnection(supabase);
  if (!networkOk) {
    console.log('❌ נכשל בבדיקת חיבור רשת - לא ניתן להמשיך\n');
    return results;
  }
  
  // בדיקה 4: טבלאות
  await testDatabaseTables(supabase);
  
  // בדיקה 5: אימות
  await testAuth(supabase);
  
  // סיכום
  results.success = results.summary.failed === 0;
  results.canProceedToPhase2 = results.success || (results.summary.failed === 0 && results.summary.warnings > 0);
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   סיכום תוצאות                        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ הצליחו: ${results.summary.passed}`);
  console.log(`❌ נכשלו: ${results.summary.failed}`);
  console.log(`⚠️  אזהרות: ${results.summary.warnings}`);
  console.log(`📊 סה"כ: ${results.summary.total}\n`);
  
  if (results.canProceedToPhase2) {
    console.log('✅ ניתן להמשיך לשלב 2 (בדיקת HTML)\n');
  } else {
    console.log('❌ לא ניתן להמשיך לשלב 2 - יש לתקן שגיאות\n');
  }
  
  return results;
}

/**
 * שמור דוח
 */
function saveReport(results) {
  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `supabase-test-${timestamp}.json`);
  const reportPathReadable = path.join(reportDir, `supabase-test-${timestamp}.txt`);
  
  // שמור JSON
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  
  // שמור קריא
  let readable = '';
  readable += '═══════════════════════════════════════════════════════\n';
  readable += '   דוח בדיקת חיבור Supabase (שלב 1)\n';
  readable += '═══════════════════════════════════════════════════════\n\n';
  readable += `תאריך: ${results.timestamp}\n`;
  readable += `סטטוס כללי: ${results.success ? '✅ הצליח' : '❌ נכשל'}\n`;
  readable += `המשך לשלב 2: ${results.canProceedToPhase2 ? '✅ כן' : '❌ לא'}\n\n`;
  
  readable += '───────────────────────────────────────────────────────\n';
  readable += 'סיכום:\n';
  readable += '───────────────────────────────────────────────────────\n';
  readable += `  ✅ הצליחו: ${results.summary.passed}\n`;
  readable += `  ❌ נכשלו: ${results.summary.failed}\n`;
  readable += `  ⚠️  אזהרות: ${results.summary.warnings}\n`;
  readable += `  📊 סה"כ: ${results.summary.total}\n\n`;
  
  readable += '───────────────────────────────────────────────────────\n';
  readable += 'פירוט בדיקות:\n';
  readable += '───────────────────────────────────────────────────────\n\n';
  
  results.tests.forEach((test, index) => {
    const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️';
    readable += `${index + 1}. ${icon} ${test.name}\n`;
    readable += `   סטטוס: ${test.status.toUpperCase()}\n`;
    readable += `   הודעה: ${test.message}\n`;
    if (test.details) {
      readable += `   פרטים נוספים:\n`;
      readable += `   ${JSON.stringify(test.details, null, 2).split('\n').join('\n   ')}\n`;
    }
    readable += '\n';
  });
  
  readable += '═══════════════════════════════════════════════════════\n';
  readable += 'סוף הדוח\n';
  readable += '═══════════════════════════════════════════════════════\n';
  
  fs.writeFileSync(reportPathReadable, readable, 'utf-8');
  
  console.log(`📄 דוח נשמר ב: ${reportPath}`);
  console.log(`📄 דוח קריא נשמר ב: ${reportPathReadable}\n`);
  
  return { json: reportPath, text: reportPathReadable };
}

/**
 * נקודת כניסה
 */
async function main() {
  try {
    const results = await runAllTests();
    const reportPaths = saveReport(results);
    
    // החזר exit code בהתאם לתוצאה
    if (results.success) {
      process.exit(0);
    } else if (results.canProceedToPhase2) {
      process.exit(1); // אזהרות אך אפשר להמשיך
    } else {
      process.exit(2); // שגיאות קריטיות
    }
  } catch (error) {
    console.error('❌ שגיאה קריטית בהרצת הבדיקות:');
    console.error(error);
    process.exit(3);
  }
}

// הרץ אם זה קובץ ראשי
const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
                     import.meta.url.endsWith(path.basename(process.argv[1]));

if (isMainModule) {
  main();
}

export { runAllTests, saveReport };
