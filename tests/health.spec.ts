import { test, expect } from '@playwright/test';
import { attachDiagnostics, waitForAppStable, summarize } from './utils/diagnostics';

/**
 * Application health checks - בדיקות בריאות ויציבות
 */

test.describe('App Health', () => {
  test('root page renders without runtime errors', async ({ page }) => {
    const diag = attachDiagnostics(page);

    await page.goto('/');
    await waitForAppStable(page);

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    const sum = await summarize(page, diag);
    console.log('Health summary:', sum);

    expect(sum.pageErrors, 'no page errors').toBe(0);
    expect(sum.consoleErrors, 'no console errors').toBe(0);
    expect(sum.http4xx5xx, 'no failed HTTP').toBe(0);
  });

  test('auth page loads and shows content or redirects', async ({ page }) => {
    const diag = attachDiagnostics(page);

    await page.goto('/auth');
    await waitForAppStable(page);

    // Either an auth form exists or a redirect happens quickly
    const maybeForm = page.locator('form');
    const hasForm = await maybeForm.first().isVisible().catch(() => false);

    const current = page.url();
    console.log('Auth check URL:', current, 'hasForm:', hasForm);

    expect(current).toMatch(/\/(auth|dashboard|)$/);

    const sum = await summarize(page, diag);
    expect(sum.pageErrors).toBe(0);
  });
});
