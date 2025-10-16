import { test, expect } from '@playwright/test';

test.describe('Folder Tab Debug', () => {
  test('should click folders tab and capture logs', async ({ page }) => {
    // Listen to all console messages
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Listen to page errors
    page.on('pageerror', error => {
      console.log('[PAGE ERROR]:', error.message);
    });

    // Navigate to the app
    console.log('Navigating to http://localhost:6500');
    await page.goto('http://localhost:6500', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-load.png', fullPage: true });
    console.log('Took initial screenshot');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    
    // Try to find the tabs
    const tabs = await page.locator('[role="tablist"]').count();
    console.log('Found', tabs, 'tablists');
    
    // Try to find פרויקטים or תיקיות
    const projectsText = await page.locator('text=פרויקטים').count();
    const foldersText = await page.locator('text=תיקיות').count();
    console.log('Found "פרויקטים":', projectsText, 'times');
    console.log('Found "תיקיות":', foldersText, 'times');
    
    if (foldersText > 0) {
      console.log('Clicking on תיקיות tab...');
      await page.locator('text=תיקיות').first().click();
      await page.waitForTimeout(2000);
      
      // Take screenshot after click
      await page.screenshot({ path: 'test-results/02-after-folders-click.png', fullPage: true });
      console.log('Took screenshot after clicking folders tab');
      
      // Check what's visible now
      const folderManagementVisible = await page.locator('text=ניהול תיקיות').count();
      console.log('Found "ניהול תיקיות":', folderManagementVisible, 'times');
    } else {
      console.log('תיקיות tab not found!');
      // Take screenshot of what we see
      await page.screenshot({ path: 'test-results/02-no-folders-tab.png', fullPage: true });
    }
  });
});
