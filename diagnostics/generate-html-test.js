/**
 * סקריפט עזר: יוצר HTML עם משתני סביבה אמיתיים
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טען משתני סביבה
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔧 יוצר קובץ HTML לבדיקה...\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ שגיאה: לא נמצאו משתני סביבה ב-.env');
  console.error('   יש לוודא ש-VITE_SUPABASE_URL ו-VITE_SUPABASE_PUBLISHABLE_KEY מוגדרים');
  process.exit(1);
}

// קרא template
const templatePath = path.join(__dirname, 'test-html-simple.html');
let html = fs.readFileSync(templatePath, 'utf-8');

// החלף placeholders
html = html.replace('SUPABASE_URL_PLACEHOLDER', SUPABASE_URL);
html = html.replace('SUPABASE_KEY_PLACEHOLDER', SUPABASE_KEY);

// שמור
const outputPath = path.join(__dirname, 'test-html-generated.html');
fs.writeFileSync(outputPath, html, 'utf-8');

console.log(`✅ קובץ HTML נוצר בהצלחה!`);
console.log(`📄 נתיב: ${outputPath}\n`);
console.log('🌐 לפתיחה בדפדפן:');
console.log(`   file:///${outputPath.replace(/\\/g, '/')}\n`);
console.log('💡 או הרץ:');
console.log('   npm run diagnose:html\n');

export { SUPABASE_URL, SUPABASE_KEY };
