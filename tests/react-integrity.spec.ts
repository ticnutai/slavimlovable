import { test, expect } from '@playwright/test';
import { attachDiagnostics, waitForAppStable } from './utils/diagnostics';

test.describe('React integrity checks', () => {
  test('no duplicate React renderer and no hook dispatcher errors', async ({ page }) => {
    const diag = attachDiagnostics(page);

    await page.goto('/');
    await waitForAppStable(page);

    // Detect React DevTools global and count renderers
    const rendererInfo = await page.evaluate(() => {
      const w = globalThis as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: { renderers?: Map<unknown, unknown> | Record<string, unknown> } };
      const hook = w.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      let count = 0;
      if (hook && hook.renderers) {
        const r: unknown = hook.renderers as unknown;
        if (r && typeof (r as Map<unknown, unknown>).size === 'number') {
          count = (r as Map<unknown, unknown>).size as number;
        } else {
          count = Object.keys(r as Record<string, unknown>).length;
        }
      }
      return { hasHook: !!hook, renderersCount: count };
    });

    console.log('React renderer info:', rendererInfo);

    // If we have multiple renderers, it's usually duplicate React
    expect(rendererInfo.renderersCount <= 1, `duplicate React detected: ${rendererInfo.renderersCount} renderers`).toBe(true);

    // Look for signature hook errors in collected diagnostics
    const allErrors = [
      ...diag.pageErrors,
      ...diag.console.filter(c => c.type === 'error').map(c => c.text),
    ].join('\n');

    const suspicious = /(dispatcher is null|Hooks can only be called|Invalid hook call)/i.test(allErrors);
    expect(suspicious, `Hook-related runtime errors found:\n${allErrors}`).toBeFalsy();
  });
});
