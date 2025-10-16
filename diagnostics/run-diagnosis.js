/**
 * מערכת אבחון אוטומטית מלאה
 * מריצה את כל השלבים ברצף ומפיקה דוח מסכם
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('╔════════════════════════════════════════════════════╗');
console.log('║     🔍 מערכת אבחון אוטומטית לפרויקט               ║');
console.log('║     מערכת דו-שלבית לאיתור בעיות בSupabase         ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const fullResults = {
  timestamp: new Date().toISOString(),
  phases: [],
  overallSuccess: false,
  recommendations: []
};

/**
 * הרץ פקודה והחזר תוצאות
 */
function runCommand(command, args = [], cwd = __dirname) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  מריץ: ${command} ${args.join(' ')}\n`);
    
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      resolve(code);
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * שלב 1: בדיקת Supabase Connection
 */
async function runPhase1() {
  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│  שלב 1: בדיקת חיבור Supabase                      │');
  console.log('└────────────────────────────────────────────────────┘\n');
  
  try {
    const exitCode = await runCommand('node', ['test-supabase-connection.js']);
    
    // קרא תוצאות
    const reportsDir = path.join(__dirname, 'reports');
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir)
        .filter(f => f.startsWith('supabase-test-') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length > 0) {
        const latestReport = path.join(reportsDir, files[0]);
        const results = JSON.parse(fs.readFileSync(latestReport, 'utf-8'));
        fullResults.phases.push(results);
        
        return {
          success: exitCode === 0,
          canProceed: exitCode <= 1, // 0 = הצלחה, 1 = אזהרות
          results
        };
      }
    }
    
    return { success: false, canProceed: false, results: null };
  } catch (error) {
    console.error('❌ שגיאה בשלב 1:', error.message);
    return { success: false, canProceed: false, results: null };
  }
}

/**
 * שלב 2: בדיקת HTML
 */
async function runPhase2() {
  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│  שלב 2: בדיקת אינטגרציה עם HTML                   │');
  console.log('└────────────────────────────────────────────────────┘\n');
  
  try {
    // צור HTML עם משתנים אמיתיים
    console.log('🔧 יוצר קובץ HTML לבדיקה...\n');
    await runCommand('node', ['generate-html-test.js']);
    
    const htmlPath = path.join(__dirname, 'test-html-generated.html');
    
    if (!fs.existsSync(htmlPath)) {
      console.error('❌ קובץ HTML לא נוצר');
      return { success: false, htmlPath: null };
    }
    
    console.log('\n✅ קובץ HTML נוצר בהצלחה!');
    console.log(`📄 נתיב: ${htmlPath}\n`);
    console.log('🌐 פתח את הקובץ הבא בדפדפן לבדיקה ידנית:');
    console.log(`   file:///${htmlPath.replace(/\\/g, '/')}\n`);
    console.log('💡 הדף יריץ בדיקות אוטומטיות וידווח על תוצאות.\n');
    
    fullResults.phases.push({
      phase: 2,
      title: 'בדיקת HTML',
      status: 'manual_check_required',
      htmlPath,
      instructions: 'פתח את הקובץ בדפדפן לבדיקה ידנית'
    });
    
    return { success: true, htmlPath };
  } catch (error) {
    console.error('❌ שגיאה בשלב 2:', error.message);
    return { success: false, htmlPath: null };
  }
}

/**
 * צור המלצות
 */
function generateRecommendations(phase1Results) {
  const recommendations = [];
  
  if (!phase1Results || !phase1Results.results) {
    recommendations.push({
      priority: 'critical',
      title: 'לא ניתן היה להריץ בדיקות',
      action: 'בדוק שהסביבה מוכנה (npm install הורץ) ושקובץ .env קיים'
    });
    return recommendations;
  }
  
  const { results } = phase1Results;
  
  // המלצות לפי שגיאות
  results.tests.forEach(test => {
    if (test.status === 'fail') {
      if (test.name.includes('VITE_SUPABASE_URL')) {
        recommendations.push({
          priority: 'critical',
          title: 'URL של Supabase חסר',
          action: 'הוסף VITE_SUPABASE_URL לקובץ .env',
          example: 'VITE_SUPABASE_URL=https://your-project.supabase.co'
        });
      }
      
      if (test.name.includes('PUBLISHABLE_KEY')) {
        recommendations.push({
          priority: 'critical',
          title: 'מפתח ציבורי של Supabase חסר',
          action: 'הוסף VITE_SUPABASE_PUBLISHABLE_KEY לקובץ .env',
          example: 'VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key'
        });
      }
      
      if (test.name.includes('חיבור רשת')) {
        recommendations.push({
          priority: 'high',
          title: 'לא ניתן להתחבר ל-Supabase',
          action: 'בדוק: 1) חיבור אינטרנט, 2) ה-URL תקין, 3) הפרויקט פעיל ב-Supabase',
          url: 'https://app.supabase.com/projects'
        });
      }
      
      if (test.name.includes('מפתח API')) {
        recommendations.push({
          priority: 'high',
          title: 'מפתח API לא תקין',
          action: 'קבל מפתח חדש מ-Settings > API ב-Supabase Dashboard',
          url: 'https://app.supabase.com/project/_/settings/api'
        });
      }
    }
  });
  
  // המלצות כלליות
  if (results.summary.warnings > 0) {
    recommendations.push({
      priority: 'medium',
      title: `יש ${results.summary.warnings} אזהרות`,
      action: 'עיין בדוח המפורט לפרטים נוספים'
    });
  }
  
  if (results.success) {
    recommendations.push({
      priority: 'info',
      title: '✅ כל הבדיקות עברו בהצלחה',
      action: 'המערכת תקינה! אם יש בעיות באפליקציה, הן לא קשורות לחיבור Supabase'
    });
  }
  
  return recommendations;
}

/**
 * שמור דוח מסכם
 */
function saveFinalReport() {
  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `full-diagnosis-${timestamp}.json`);
  const reportPathReadable = path.join(reportDir, `full-diagnosis-${timestamp}.txt`);
  
  // JSON
  fs.writeFileSync(reportPath, JSON.stringify(fullResults, null, 2), 'utf-8');
  
  // טקסט קריא
  let readable = '';
  readable += '═══════════════════════════════════════════════════════════\n';
  readable += '   דוח אבחון מלא - מערכת אוטומטית\n';
  readable += '═══════════════════════════════════════════════════════════\n\n';
  readable += `תאריך: ${fullResults.timestamp}\n`;
  readable += `סטטוס כללי: ${fullResults.overallSuccess ? '✅ הצליח' : '❌ נכשל'}\n\n`;
  
  readable += '───────────────────────────────────────────────────────────\n';
  readable += 'סיכום שלבים:\n';
  readable += '───────────────────────────────────────────────────────────\n\n';
  
  fullResults.phases.forEach((phase, index) => {
    readable += `שלב ${index + 1}: ${phase.title}\n`;
    if (phase.summary) {
      readable += `  ✅ הצליחו: ${phase.summary.passed}\n`;
      readable += `  ❌ נכשלו: ${phase.summary.failed}\n`;
      readable += `  ⚠️  אזהרות: ${phase.summary.warnings}\n`;
    }
    if (phase.status) {
      readable += `  סטטוס: ${phase.status}\n`;
    }
    readable += '\n';
  });
  
  readable += '───────────────────────────────────────────────────────────\n';
  readable += 'המלצות לפעולה:\n';
  readable += '───────────────────────────────────────────────────────────\n\n';
  
  if (fullResults.recommendations.length === 0) {
    readable += 'אין המלצות מיוחדות.\n\n';
  } else {
    fullResults.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'critical' ? '🔴' :
                          rec.priority === 'high' ? '🟠' :
                          rec.priority === 'medium' ? '🟡' : '🔵';
      
      readable += `${index + 1}. ${priorityIcon} [${rec.priority.toUpperCase()}] ${rec.title}\n`;
      readable += `   פעולה: ${rec.action}\n`;
      if (rec.example) {
        readable += `   דוגמה: ${rec.example}\n`;
      }
      if (rec.url) {
        readable += `   קישור: ${rec.url}\n`;
      }
      readable += '\n';
    });
  }
  
  readable += '═══════════════════════════════════════════════════════════\n';
  readable += 'סוף הדוח\n';
  readable += '═══════════════════════════════════════════════════════════\n';
  
  fs.writeFileSync(reportPathReadable, readable, 'utf-8');
  
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   📊 דוחות נשמרו                                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log(`📄 דוח JSON: ${reportPath}`);
  console.log(`📄 דוח קריא: ${reportPathReadable}\n`);
  
  return { json: reportPath, text: reportPathReadable };
}

/**
 * נקודת כניסה ראשית
 */
async function main() {
  const startTime = Date.now();
  
  try {
    // שלב 1
    const phase1 = await runPhase1();
    
    if (!phase1.canProceed) {
      console.log('\n❌ שלב 1 נכשל - לא ניתן להמשיך לשלב 2\n');
      fullResults.overallSuccess = false;
      fullResults.recommendations = generateRecommendations(phase1);
      saveFinalReport();
      process.exit(1);
    }
    
    console.log('\n✅ שלב 1 הושלם - ממשיך לשלב 2\n');
    
    // שלב 2
    const phase2 = await runPhase2();
    
    fullResults.overallSuccess = phase1.success && phase2.success;
    fullResults.recommendations = generateRecommendations(phase1);
    
    const reportPaths = saveFinalReport();
    
    // סיכום סופי
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   ✅ אבחון הושלם!                                  ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`⏱️  זמן ריצה: ${duration} שניות\n`);
    
    if (fullResults.overallSuccess) {
      console.log('✅ כל השלבים עברו בהצלחה!\n');
    } else {
      console.log('⚠️  יש בעיות שדורשות תיקון.\n');
    }
    
    console.log('📋 סיכום המלצות:\n');
    fullResults.recommendations.forEach((rec, index) => {
      const icon = rec.priority === 'critical' ? '🔴' :
                  rec.priority === 'high' ? '🟠' :
                  rec.priority === 'medium' ? '🟡' : '🔵';
      console.log(`${index + 1}. ${icon} ${rec.title}`);
      console.log(`   ${rec.action}\n`);
    });
    
    console.log('📖 לדוח המלא, פתח:');
    console.log(`   ${reportPaths.text}\n`);
    
    process.exit(fullResults.overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ שגיאה קריטית במערכת האבחון:');
    console.error(error);
    
    fullResults.overallSuccess = false;
    fullResults.recommendations.push({
      priority: 'critical',
      title: 'שגיאה קריטית',
      action: error.message
    });
    
    saveFinalReport();
    process.exit(2);
  }
}

// הרץ
main();
