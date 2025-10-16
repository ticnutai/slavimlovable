const { execSync } = require('child_process');
const path = require('path');

// Configuration
const INTERVAL_HOURS = 1; // Run every 1 hour
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

console.log(`🔄 Auto-commit service started`);
console.log(`📅 Will commit every ${INTERVAL_HOURS} hour(s)`);
console.log(`⏰ Started at: ${new Date().toLocaleString('he-IL')}\n`);

function autoCommit() {
  try {
    const timestamp = new Date().toLocaleString('he-IL');
    
    // Check git status
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    if (status.trim()) {
      console.log(`\n✅ Changes detected at ${timestamp}`);
      
      // Add all changes
      execSync('git add .', { stdio: 'inherit' });
      
      // Commit with timestamp
      const commitMessage = `Auto-save: ${timestamp}`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      console.log(`✨ Auto-commit completed: ${commitMessage}`);
      
      // Optional: Auto-push to remote
      // Uncomment the following lines to enable auto-push
      // console.log('📤 Pushing to remote...');
      // execSync('git push origin main', { stdio: 'inherit' });
      
    } else {
      console.log(`ℹ️  No changes to commit at ${timestamp}`);
    }
  } catch (error) {
    console.error(`❌ Error during auto-commit: ${error.message}`);
  }
}

// Run immediately on start
autoCommit();

// Then run every interval
setInterval(autoCommit, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Auto-commit service stopped');
  process.exit(0);
});
