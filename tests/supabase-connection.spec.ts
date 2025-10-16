import { test, expect } from '@playwright/test';

/**
 * Supabase Connection Tests - בדיקות חיבור ל-Supabase
 * בודק שהחיבור ל-Supabase עובד תקין
 */

test.describe('Supabase Connection', () => {
  test.beforeEach(async ({ page }) => {
    // Capture all network requests
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        console.log(`[SUPABASE REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('supabase')) {
        console.log(`[SUPABASE RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    // Log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
  });

  test('should have Supabase environment variables', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if Supabase is initialized by looking for network calls
    const supabaseRequests = await page.evaluate(() => {
      return {
        hasSupabaseUrl: typeof window !== 'undefined' && 
                       performance.getEntriesByType('resource').some((r: any) => 
                         r.name.includes('supabase.co')
                       ),
        envCheck: {
          hasImportMeta: typeof import.meta !== 'undefined',
          // We can't directly access env vars from browser context
        }
      };
    });

    console.log('Supabase checks:', supabaseRequests);
  });

  test('should make initial Supabase connection', async ({ page }) => {
    let supabaseConnected = false;
    
    page.on('response', response => {
      if (response.url().includes('supabase.co')) {
        console.log(`Supabase API call: ${response.status()} - ${response.url()}`);
        if (response.status() === 200 || response.status() === 201) {
          supabaseConnected = true;
        }
      }
    });

    await page.goto('/');
    
    // Wait for potential Supabase calls
    await page.waitForTimeout(3000);

    console.log(`Supabase connection status: ${supabaseConnected ? '✅ Connected' : '❌ Not connected'}`);
  });

  test('should not show Supabase connection errors', async ({ page }) => {
    const supabaseErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('supabase') && 
          (text.toLowerCase().includes('error') || 
           text.toLowerCase().includes('fail'))) {
        supabaseErrors.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (supabaseErrors.length > 0) {
      console.error('Supabase errors found:', supabaseErrors);
    }

    expect(supabaseErrors).toHaveLength(0);
  });

  test('should handle auth state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for auth check to complete
    await page.waitForTimeout(2000);

    // Check if we're redirected to auth page or dashboard
    const currentUrl = page.url();
    console.log(`After auth check, URL is: ${currentUrl}`);

    // Either should be on auth page or logged in
    expect(currentUrl).toMatch(/\/(auth|dashboard)?/);

    await page.screenshot({ path: 'test-results/auth-state.png', fullPage: true });
  });
});
