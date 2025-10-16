import { test, expect } from '@playwright/test';

/**
 * Basic Load Tests - בדיקות טעינה בסיסיות
 * בודק שהאתר נטען כראוי ושאין שגיאות קריטיות
 */

test.describe('Basic Application Load', () => {
  test.beforeEach(async ({ page }) => {
    // Log all console messages
    page.on('console', msg => {
      const type = msg.type();
      console.log(`[BROWSER ${type.toUpperCase()}] ${msg.text()}`);
    });

    // Log all errors
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`);
    });

    // Log all failed requests
    page.on('requestfailed', request => {
      console.error(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('should load the main page without errors', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check that the page title is set
    const title = await page.title();
    console.log(`Page title: ${title}`);
    expect(title).toBeTruthy();

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage-load.png', fullPage: true });

    console.log('✅ Page loaded successfully');
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Report any errors found
    if (errors.length > 0) {
      console.error('Console errors found:', errors);
    }

    expect(errors).toHaveLength(0);
  });

  test('should load required assets', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Log and check failed requests
    if (failedRequests.length > 0) {
      console.error('Failed requests:', failedRequests);
    }

    expect(failedRequests).toHaveLength(0);
  });

  test('should render React root element', async ({ page }) => {
    await page.goto('/');
    
    // Check that the React root exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Check that content is rendered inside
    const content = await root.innerHTML();
    console.log(`Root element has content: ${content.length} characters`);
    expect(content.length).toBeGreaterThan(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    console.log('✅ Meta tags are properly set');
  });
});

test.describe('Navigation and Routes', () => {
  test('should handle navigation without crashes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check current URL
    const currentURL = page.url();
    console.log(`Current URL: ${currentURL}`);

    // Take screenshot of initial page
    await page.screenshot({ path: 'test-results/navigation-initial.png' });

    console.log('✅ Navigation test completed');
  });
});
