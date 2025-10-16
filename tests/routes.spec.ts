import { test, expect } from '@playwright/test';
import { attachDiagnostics, waitForAppStable } from './utils/diagnostics';

const routes = ['/', '/auth', '/dashboard', '/project/new'];

test.describe('Routes smoke', () => {
  for (const route of routes) {
    test(`route ${route} loads without hard errors`, async ({ page }) => {
      const diag = attachDiagnostics(page);
      await page.goto(route);
      await waitForAppStable(page);

      // Basic sanity: page shouldn't be blank
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      // No page errors
      expect(diag.pageErrors).toHaveLength(0);
    });
  }
});
