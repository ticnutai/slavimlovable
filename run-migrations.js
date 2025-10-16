import fs from 'fs';
import https from 'https';

// Read the SQL file
const sqlContent = fs.readFileSync('./supabase/combined_migrations.sql', 'utf8');

// Supabase configuration
const SUPABASE_URL = 'https://obypfqfghztvaefxnpgb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ieXBmcWZnaHp0dmFlZnhucGdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzIwMiwiZXhwIjoyMDc2MTY5MjAyfQ.klqozniMA_APIFdTRQTYnySP1ZvfnJU939b_Rc768Rk';

// Execute SQL via Supabase REST API
const data = JSON.stringify({ query: sqlContent });

const options = {
  hostname: 'obypfqfghztvaefxnpgb.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': data.length
  }
};

console.log('🚀 מריץ את ה-migrations על Supabase...\n');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ הצלחה! כל ה-migrations רצו בהצלחה!\n');
      console.log('📊 התוצאה:', responseData);
    } else {
      console.error('❌ שגיאה בהרצת ה-migrations:');
      console.error('סטטוס:', res.statusCode);
      console.error('תשובה:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ שגיאה בחיבור:', error.message);
});

req.write(data);
req.end();
