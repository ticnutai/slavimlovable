// Simple test to check folder management functionality
console.log('🧪 Starting Folder Management Test...');

// Wait for page to load
setTimeout(() => {
  console.log('📍 Checking for tabs...');
  
  // Check if we're on the dashboard
  const tabs = document.querySelectorAll('[role="tablist"]');
  console.log(`Found ${tabs.length} tab lists`);
  
  // Look for תיקיות tab
  const foldersTab = Array.from(document.querySelectorAll('button[role="tab"]')).find(
    el => el.textContent?.includes('תיקיות')
  );
  
  if (foldersTab) {
    console.log('✅ Found תיקיות tab:', foldersTab);
    console.log('Tab text:', foldersTab.textContent);
    console.log('Tab attributes:', {
      role: foldersTab.getAttribute('role'),
      'aria-selected': foldersTab.getAttribute('aria-selected'),
      'data-state': foldersTab.getAttribute('data-state'),
    });
    
    // Try to click it
    console.log('👆 Clicking תיקיות tab...');
    foldersTab.click();
    
    setTimeout(() => {
      // Check what's visible after click
      const folderManagement = document.querySelector('*');
      const bodyText = document.body.innerText;
      console.log('📄 Page contains "ניהול תיקיות":', bodyText.includes('ניהול תיקיות'));
      console.log('📄 Page contains "תיקייה חדשה":', bodyText.includes('תיקייה חדשה'));
      
      // Check active tab content
      const activeTabContent = document.querySelector('[role="tabpanel"]:not([hidden])');
      if (activeTabContent) {
        console.log('✅ Active tab content:', activeTabContent.innerHTML.substring(0, 200));
      } else {
        console.log('❌ No active tab content found');
      }
    }, 1000);
  } else {
    console.log('❌ תיקיות tab not found!');
    console.log('Available tabs:');
    document.querySelectorAll('button[role="tab"]').forEach((tab, i) => {
      console.log(`  ${i + 1}. ${tab.textContent}`);
    });
  }
}, 2000);
