const fs = require('fs');
const path = require('path');

console.log('🧹 מתחיל ניקוי קבצים זמניים...\n');

// Directories to clean
const dirsToClean = [
  'node_modules/.vite',
  'node_modules/.cache',
  '.cache',
  'dist',
  'playwright-report',
  'test-results',
  '.playwright'
];

// Function to get directory size
function getDirSize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    });
  } catch (err) {
    // Directory doesn't exist or can't read
  }
  return size;
}

// Function to remove directory
function removeDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      const size = getDirSize(dir);
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✓ נמחק: ${dir} (${(size / 1024 / 1024).toFixed(2)} MB)`);
      return size;
    }
  } catch (err) {
    console.log(`⚠ לא ניתן למחוק: ${dir}`);
  }
  return 0;
}

let totalSaved = 0;

// Clean directories
console.log('🗑️  מוחק תיקיות זמניות...\n');
dirsToClean.forEach(dir => {
  totalSaved += removeDir(dir);
});

// Remove log files
console.log('\n🗑️  מוחק קבצי לוג...\n');
function removeLogs(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory() && !file.includes('node_modules')) {
        removeLogs(filePath);
      } else if (file.endsWith('.log')) {
        const size = stats.size;
        fs.unlinkSync(filePath);
        console.log(`✓ נמחק: ${filePath} (${(size / 1024).toFixed(2)} KB)`);
        totalSaved += size;
      }
    });
  } catch (err) {
    // Ignore errors
  }
}

removeLogs('.');

// Remove temp test files
['test-results.json', 'test-results.xml'].forEach(file => {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    fs.unlinkSync(file);
    console.log(`✓ נמחק: ${file} (${(size / 1024).toFixed(2)} KB)`);
    totalSaved += size;
  }
});

// Summary
console.log('\n════════════════════════════════════════');
console.log('📊 סיכום הניקוי');
console.log('════════════════════════════════════════');
console.log(`נחסך: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
console.log('════════════════════════════════════════');
console.log('\n✨ הניקוי הושלם בהצלחה!\n');
