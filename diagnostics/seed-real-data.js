import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// טען את קובץ ה-.env מתיקיית הפרויקט
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// משתמש ב-service_role_key כדי לעקוף RLS למטרות זריעת נתונים
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🌱 מתחיל זריעת נתונים...\n');
console.log('🔑 משתמש במפתח ניהולי (service_role) לזריעת נתונים\n');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ חסרים משתני סביבה!');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    try {
        // שלב 1: בדיקת קטגוריות קיימות
        console.log('📂 בודק קטגוריות קיימות...');
        const { data: existingCategories, error: catCheckError } = await supabase
            .from('categories')
            .select('id, name, display_name');
        
        if (catCheckError) {
            console.error('❌ שגיאה בבדיקת קטגוריות:', catCheckError.message);
            throw catCheckError;
        }

        console.log(`   נמצאו ${existingCategories?.length || 0} קטגוריות קיימות`);

        let categoryIds = [];

        // שלב 2: הוספת קטגוריות אם אין
        if (!existingCategories || existingCategories.length === 0) {
            console.log('\n📂 מוסיף קטגוריות חדשות...');
            const categories = [
                { name: 'development', display_name: 'פיתוח', order_index: 1 },
                { name: 'design', display_name: 'עיצוב', order_index: 2 },
                { name: 'testing', display_name: 'בדיקות', order_index: 3 },
                { name: 'documentation', display_name: 'תיעוד', order_index: 4 }
            ];

            const { data: newCategories, error: catError } = await supabase
                .from('categories')
                .insert(categories)
                .select('id, name, display_name');

            if (catError) {
                console.error('❌ שגיאה בהוספת קטגוריות:', catError.message);
                throw catError;
            }

            console.log(`   ✅ נוספו ${newCategories.length} קטגוריות`);
            newCategories.forEach(cat => {
                console.log(`      - ${cat.display_name} (${cat.name})`);
            });
            categoryIds = newCategories.map(c => c.id);
        } else {
            console.log('   ✓ משתמש בקטגוריות קיימות');
            existingCategories.forEach(cat => {
                console.log(`      - ${cat.display_name || cat.name} (${cat.name})`);
            });
            categoryIds = existingCategories.map(c => c.id);
        }

        // שלב 3: בדיקת משימות קיימות
        console.log('\n✅ בודק משימות קיימות...');
        const { data: existingTasks, error: taskCheckError, count: taskCount } = await supabase
            .from('tasks')
            .select('id, name, category_id', { count: 'exact' });
        
        if (taskCheckError) {
            console.error('❌ שגיאה בבדיקת משימות:', taskCheckError.message);
            throw taskCheckError;
        }

        console.log(`   נמצאו ${taskCount || 0} משימות קיימות`);

        if (taskCount && taskCount > 0) {
            console.log('   הצגת 5 משימות ראשונות:');
            existingTasks.slice(0, 5).forEach((task, i) => {
                console.log(`      ${i + 1}. ${task.name} (קטגוריה: ${task.category_id.substring(0, 8)}...)`);
            });
        }

        // שלב 4: הוספת משימות לדוגמה (רק אם אין משימות)
        if (!taskCount || taskCount === 0) {
            console.log('\n✅ מוסיף משימות לדוגמה...');
            
            // השתמש בקטגוריה הראשונה כברירת מחדל
            const defaultCategoryId = categoryIds[0];
            
            const tasks = [
                {
                    category_id: defaultCategoryId,
                    name: 'משימת בדיקה ראשונה',
                    description: 'זו משימה לדוגמה שנוספה על ידי הסקריפט',
                    priority: 'high',
                    is_required: true,
                    order_index: 1,
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // עוד שבוע
                    estimated_hours: 5
                },
                {
                    category_id: categoryIds[1] || defaultCategoryId,
                    name: 'משימת בדיקה שנייה',
                    description: 'עוד משימה לדוגמה',
                    priority: 'medium',
                    is_required: false,
                    order_index: 2,
                    estimated_hours: 3
                },
                {
                    category_id: categoryIds[2] || defaultCategoryId,
                    name: 'משימת בדיקה שלישית',
                    description: 'משימה אחרונה לבדיקה',
                    priority: 'low',
                    is_required: false,
                    order_index: 3,
                    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // עוד שבועיים
                    estimated_hours: 2
                }
            ];

            const { data: newTasks, error: taskError } = await supabase
                .from('tasks')
                .insert(tasks)
                .select('id, name, category_id, priority');

            if (taskError) {
                console.error('❌ שגיאה בהוספת משימות:', taskError.message);
                throw taskError;
            }

            console.log(`   ✅ נוספו ${newTasks.length} משימות`);
            newTasks.forEach((task, i) => {
                console.log(`      ${i + 1}. ${task.name} - עדיפות: ${task.priority}`);
            });
        } else {
            console.log('   ✓ קיימות כבר משימות במערכת');
        }

        // שלב 5: סיכום
        console.log('\n📊 סיכום:');
        
        // קבל מספרים מעודכנים
        const { count: finalCatCount } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true });
        
        const { count: finalTaskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true });

        console.log(`   📂 קטגוריות: ${finalCatCount || 0}`);
        console.log(`   ✅ משימות: ${finalTaskCount || 0}`);

        console.log('\n✅ זריעת נתונים הושלמה בהצלחה!');
        console.log('\n💡 כדי לצפות בנתונים, הרץ: npm run db:view');
        
    } catch (error) {
        console.error('\n❌ שגיאה כללית:', error.message);
        if (error.details) console.error('   פרטים:', error.details);
        if (error.hint) console.error('   רמז:', error.hint);
        process.exit(1);
    }
}

seedData();
