import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

// קריאת SQL מהקובץ
const sql = fs.readFileSync('./supabase/combined_migrations.sql', 'utf8');

// הגדרת חיבור
const client = new Client({
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'qazwsx1122Q@TTEN',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  console.log('🔌 מתחבר לדאטאבייס...');
  
  try {
    await client.connect();
    console.log('✅ התחברות הצליחה!\n');
    
    console.log('🚀 מריץ את המיגרציות...');
    console.log('📄 771 שורות SQL\n');
    
    // הרצת ה-SQL
    await client.query(sql);
    
    console.log('✅ כל המיגרציות רצו בהצלחה!\n');
    
    // בדיקה שהטבלאות נוצרו
    console.log('🔍 בודק טבלאות...');
    const tables = ['profiles', 'categories', 'tasks', 'projects', 'project_tasks', 'folders', 'task_attachments', 'task_reminders', 'project_backups', 'task_dependencies', 'task_notifications', 'kanban_statuses'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ✅ ${table}: ${result.rows[0].count} שורות`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 המערכת מוכנה לשימוש!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ שגיאה:', error.message);
    if (error.code) {
      console.error('   קוד שגיאה:', error.code);
    }
    if (error.detail) {
      console.error('   פרטים:', error.detail);
    }
  } finally {
    await client.end();
  }
}

runMigrations();
