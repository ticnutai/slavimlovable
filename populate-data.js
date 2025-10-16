import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use server-only env var (do NOT expose service role to Vite/browser)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔄 Starting data population...\n');

async function populateData() {
  try {
    // Check if categories already exist
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*');
    
    if (existingCategories && existingCategories.length > 0) {
      console.log('⚠️  Categories already exist, skipping...');
      return;
    }

    // Insert categories
    console.log('📝 Inserting categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .insert([
        { name: 'details', display_name: 'פרטים', order_index: 1, color: '#3B82F6' },
        { name: 'info_file', display_name: 'תיק מידע', order_index: 2, color: '#10B981' },
        { name: 'plans', display_name: 'תוכניות', order_index: 3, color: '#F59E0B' },
        { name: 'permit_request', display_name: 'בקשת היתר', order_index: 4, color: '#EF4444' }
      ])
      .select();

    if (catError) {
      console.error('❌ Error inserting categories:', catError);
      return;
    }

    console.log(`✅ Inserted ${categories.length} categories`);

    // Insert tasks for each category
    const detailsCat = categories.find(c => c.name === 'details');
    const infoFileCat = categories.find(c => c.name === 'info_file');
    const plansCat = categories.find(c => c.name === 'plans');
    const permitCat = categories.find(c => c.name === 'permit_request');

    console.log('\n📝 Inserting tasks...');

    // Details tasks
    const detailsTasks = [
      { category_id: detailsCat.id, name: 'שם הפרויקט', description: 'הזנת שם הפרויקט', order_index: 1, is_required: true },
      { category_id: detailsCat.id, name: 'כתובת', description: 'הזנת כתובת הנכס', order_index: 2, is_required: true },
      { category_id: detailsCat.id, name: 'גוש', description: 'מספר גוש', order_index: 3, is_required: true },
      { category_id: detailsCat.id, name: 'חלקה', description: 'מספר חלקה', order_index: 4, is_required: true },
      { category_id: detailsCat.id, name: 'מגרש', description: 'מספר מגרש', order_index: 5, is_required: true },
      { category_id: detailsCat.id, name: 'שם לקוח', description: 'שם הלקוח', order_index: 6, is_required: true },
      { category_id: detailsCat.id, name: 'טלפון', description: 'מספר טלפון ליצירת קשר', order_index: 7, is_required: true },
      { category_id: detailsCat.id, name: 'אימייל', description: 'כתובת אימייל', order_index: 8, is_required: false },
      { category_id: detailsCat.id, name: 'מייל נוסף', description: 'כתובת אימייל נוספת', order_index: 9, is_required: false }
    ];

    // Info file tasks
    const infoFileTasks = [
      { category_id: infoFileCat.id, name: 'מסמכי בעלות', description: 'תעודת בעלות ומסמכים נלווים', order_index: 1, is_required: true },
      { category_id: infoFileCat.id, name: 'תב״ע', description: 'תכנית בנין עיר', order_index: 2, is_required: true },
      { category_id: infoFileCat.id, name: 'היסטוריית הנכס', description: 'מידע היסטורי על הנכס', order_index: 3, is_required: false },
      { category_id: infoFileCat.id, name: 'סקר', description: 'סקר מודד מוסמך', order_index: 4, is_required: true },
      { category_id: infoFileCat.id, name: 'תנאי פריסה', description: 'תנאים להיתר', order_index: 5, is_required: true },
      { category_id: infoFileCat.id, name: 'הערות לקוח', description: 'הערות והעדפות הלקוח', order_index: 6, is_required: false },
      { category_id: infoFileCat.id, name: 'בדיקת זכויות', description: 'בדיקת זכויות בנייה', order_index: 7, is_required: true },
      { category_id: infoFileCat.id, name: 'תצ״ר', description: 'תכנית צמודת קרקע', order_index: 8, is_required: false },
      { category_id: infoFileCat.id, name: 'מפה', description: 'מפות רלוונטיות', order_index: 9, is_required: false }
    ];

    // Plans tasks
    const plansTasks = [
      { category_id: plansCat.id, name: 'הצעת תכנון', description: 'הצגת הצעת תכנון ללקוח', order_index: 1, is_required: true },
      { category_id: plansCat.id, name: 'אישור לקוח', description: 'קבלת אישור לקוח על התכנון', order_index: 2, is_required: true },
      { category_id: plansCat.id, name: 'תכנית אדריכלית', description: 'הכנת תכנית אדריכלית מפורטת', order_index: 3, is_required: true },
      { category_id: plansCat.id, name: 'תכנית קונסטרוקציה', description: 'תכנון קונסטרוקטיבי', order_index: 4, is_required: true },
      { category_id: plansCat.id, name: 'תכנית חשמל', description: 'תכנון מערכת חשמל', order_index: 5, is_required: true },
      { category_id: plansCat.id, name: 'תכנית אינסטלציה', description: 'תכנון מערכת אינסטלציה', order_index: 6, is_required: true },
      { category_id: plansCat.id, name: 'תכנית ניקוז', description: 'תכנון מערכת ניקוז', order_index: 7, is_required: true },
      { category_id: plansCat.id, name: 'תכנית תיאום', description: 'תיאום בין כל המערכות', order_index: 8, is_required: true },
      { category_id: plansCat.id, name: 'חתכים', description: 'חתכים אדריכליים', order_index: 9, is_required: true },
      { category_id: plansCat.id, name: 'חזיתות', description: 'תכנון חזיתות', order_index: 10, is_required: true },
      { category_id: plansCat.id, name: 'פרטים', description: 'פרטים אדריכליים', order_index: 11, is_required: false },
      { category_id: plansCat.id, name: 'תלת מימד', description: 'תכנון תלת מימדי', order_index: 12, is_required: false },
      { category_id: plansCat.id, name: 'רנדרים', description: 'הדמיות ויזואליות', order_index: 13, is_required: false },
      { category_id: plansCat.id, name: 'סרטון', description: 'סרטון הדמיה', order_index: 14, is_required: false }
    ];

    // Permit tasks
    const permitTasks = [
      { category_id: permitCat.id, name: 'הכנת מסמכים', description: 'הכנת כל המסמכים לבקשה', order_index: 1, is_required: true },
      { category_id: permitCat.id, name: 'טופס 4', description: 'מילוי טופס 4', order_index: 2, is_required: true },
      { category_id: permitCat.id, name: 'הצהרות', description: 'הצהרות נדרשות', order_index: 3, is_required: true },
      { category_id: permitCat.id, name: 'חתימות', description: 'איסוף חתימות', order_index: 4, is_required: true },
      { category_id: permitCat.id, name: 'תשלום אגרות', description: 'תשלום אגרות עירייה', order_index: 5, is_required: true },
      { category_id: permitCat.id, name: 'הגשה', description: 'הגשת הבקשה', order_index: 6, is_required: true },
      { category_id: permitCat.id, name: 'קבלת אישור עקרוני', description: 'קבלת אישור עקרוני מהעירייה', order_index: 7, is_required: true },
      { category_id: permitCat.id, name: 'טיפול בהערות', description: 'מענה להערות הועדה', order_index: 8, is_required: false },
      { category_id: permitCat.id, name: 'אישור ועדה', description: 'קבלת אישור ועדת תכנון', order_index: 9, is_required: true },
      { category_id: permitCat.id, name: 'היתר בנייה', description: 'קבלת היתר בנייה סופי', order_index: 10, is_required: true },
      { category_id: permitCat.id, name: 'העתק היתר ללקוח', description: 'העברת העתק היתר ללקוח', order_index: 11, is_required: true },
      { category_id: permitCat.id, name: 'סיום פרויקט', description: 'סגירת תיק הפרויקט', order_index: 12, is_required: true },
      { category_id: permitCat.id, name: 'מעקב ביצוע', description: 'מעקב אחר ביצוע בפועל', order_index: 13, is_required: false },
      { category_id: permitCat.id, name: 'תיקונים', description: 'תיקונים במידת הצורך', order_index: 14, is_required: false },
      { category_id: permitCat.id, name: 'אחריות', description: 'אחריות לתקופה מוגדרת', order_index: 15, is_required: false },
      { category_id: permitCat.id, name: 'ארכיון', description: 'העברה לארכיון', order_index: 16, is_required: false }
    ];

    const allTasks = [...detailsTasks, ...infoFileTasks, ...plansTasks, ...permitTasks];

    const { data: insertedTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(allTasks)
      .select();

    if (tasksError) {
      console.error('❌ Error inserting tasks:', tasksError);
      return;
    }

    console.log(`✅ Inserted ${insertedTasks.length} tasks`);
    console.log('\n✅ Data population completed successfully!');
    
    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Tasks: ${insertedTasks.length}`);
    console.log(`   - פרטים: ${detailsTasks.length} tasks`);
    console.log(`   - תיק מידע: ${infoFileTasks.length} tasks`);
    console.log(`   - תוכניות: ${plansTasks.length} tasks`);
    console.log(`   - בקשת היתר: ${permitTasks.length} tasks`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateData();
