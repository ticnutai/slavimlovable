import { Page } from '@playwright/test';

export type Diagnostics = {
  console: { type: string; text: string }[];
  pageErrors: string[];
  unhandledRejections: string[];
  failedRequests: { url: string; error?: string; method: string }[];
  responses: { url: string; status: number }[];
};

export function attachDiagnostics(page: Page) {
  const diag: Diagnostics = {
    console: [],
    pageErrors: [],
    unhandledRejections: [],
    failedRequests: [],
    responses: [],
  };

  page.on('console', (msg) => {
    const entry = { type: msg.type(), text: msg.text() };
    diag.console.push(entry);
    if (msg.type() === 'error') {
      // Surface in test logs too
      console.error(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    diag.pageErrors.push(error.message);
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  // Playwright exposes unhandled rejections through pageerror as well in most cases,
  // but we also listen to it from within the page context
  page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - in browser context, globalThis has addEventListener
    globalThis.addEventListener('unhandledrejection', (ev: unknown) => {
      const anyEv = ev as { reason?: unknown };
      const reason = anyEv?.reason as { message?: string } | string | undefined;
      const msg = typeof reason === 'string' ? reason : reason?.message ?? String(reason);
      console.error(`[UNHANDLED REJECTION] ${msg}`);
    });
  });

  page.on('requestfailed', (request) => {
    diag.failedRequests.push({ url: request.url(), error: request.failure()?.errorText, method: request.method() });
    console.error(`[REQUEST FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    diag.responses.push({ url, status });
    if (status >= 400) {
      console.error(`[HTTP ${status}] ${url}`);
    }
  });

  return diag;
}

export async function summarize(page: Page, diag: Diagnostics) {
  const url = page.url();
  const title = await page.title().catch(() => '');
  const rootVisible = await page.locator('#root').isVisible().catch(() => false);
  return {
    url,
    title,
    rootVisible,
    consoleErrors: diag.console.filter((c) => c.type === 'error').length,
    pageErrors: diag.pageErrors.length,
    failedRequests: diag.failedRequests.length,
    http4xx5xx: diag.responses.filter((r) => r.status >= 400).length,
  };
}

export async function waitForAppStable(page: Page, timeoutMs = 10_000) {
  // Wait for network idle and a frame after it, with small polling to reduce flakiness
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => {});
  await page.waitForTimeout(250);
}
