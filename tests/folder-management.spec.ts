import { test, expect } from '@playwright/test';

test.describe('Folder Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (auth bypass should be enabled)
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for React to render
    await page.waitForTimeout(2000);
  });

  test('should display folders tab', async ({ page }) => {
    console.log('Starting folders tab test...');
    
    // Look for the folders tab directly
    const foldersTab = page.getByRole('tab', { name: 'תיקיות' });
    await expect(foldersTab).toBeVisible({ timeout: 10000 });
    console.log('Folders tab is visible');
    
    // Click on folders tab
    await foldersTab.click();
    console.log('Clicked folders tab');
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check for folder management content
    await expect(page.getByText('ניהול תיקיות')).toBeVisible({ timeout: 5000 });
    console.log('Folder management content is visible');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/folders-tab.png', fullPage: true });
  });

  test('should be able to create a new folder', async ({ page }) => {
    console.log('Starting create folder test...');
    
    // Navigate to folders tab
    const foldersTab = page.getByRole('tab', { name: 'תיקיות' });
    await foldersTab.click();
    await page.waitForTimeout(500);
    
    // Click on "תיקייה חדשה" button
    const newFolderButton = page.getByRole('button', { name: /תיקייה חדשה/i });
    await expect(newFolderButton).toBeVisible({ timeout: 5000 });
    await newFolderButton.click();
    console.log('Clicked new folder button');
    
    // Wait for dialog
    await page.waitForTimeout(300);
    
    // Fill in folder name
    const nameInput = page.locator('input#folder-name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(`Test Folder ${Date.now()}`);
    console.log('Filled folder name');
    
    // Submit
    const createButton = page.getByRole('button', { name: /צור תיקייה/i });
    await createButton.click();
    console.log('Clicked create button');
    
    // Wait for success
    await page.waitForTimeout(1500);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/folder-created.png', fullPage: true });
  });

  test('should display console logs for debugging', async ({ page }) => {
    console.log('Starting console log test...');
    
    // Listen to console messages
    page.on('console', msg => {
      if (msg.text().includes('[FolderManagement]') || msg.text().includes('[DEBUG]') || msg.text().includes('BYPASS')) {
        console.log('BROWSER LOG:', msg.text());
      }
    });
    
    // Navigate to folders tab
    const foldersTab = page.getByRole('tab', { name: 'תיקיות' });
    await foldersTab.click();
    
    // Wait to capture logs
    await page.waitForTimeout(2000);
  });
});
