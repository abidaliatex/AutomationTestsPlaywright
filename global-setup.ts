import { chromium } from '@playwright/test';
import { env } from './config/env';

/**
 * global-setup.ts — runs ONCE before the entire test suite.
 *
 * Logs in to CrossAd and saves the authenticated browser session
 * (cookies + localStorage) to auth/user.json.
 *
 * All subsequent tests load that saved state directly — skipping
 * the login UI entirely. This mirrors having a single shared
 * authenticated session, similar to Selenium's static WebDriver
 * being reused across tests.
 */
export default async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  // Navigate to login page
  await page.goto(`${env.baseUrl}/#/login`);

  // Click CA login button if visible
  const caBtn = page.locator(
    "(//span[contains(text(),'Login with Cross-advertising username and password')]//parent::a)[2]"
  );
  try {
    await caBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await caBtn.click();
  } catch {
    // Login form already visible — proceed directly
  }

  // Fill credentials and submit
  await page.locator('#j_username').waitFor({ state: 'visible' });
  await page.locator('#j_username').fill(env.username);
  await page.locator('#j_password').fill(env.password);
  await page.locator('#submit').click();

  // Wait for dashboard to confirm login succeeded
  await page.waitForURL(/.*\/#\//, { timeout: 30_000 });

  // Save the authenticated session (cookies + localStorage) to disk
  await context.storageState({ path: 'auth/user.json' });

  await browser.close();
}
