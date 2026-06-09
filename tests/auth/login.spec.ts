import { test, expect } from '../../fixtures/test-fixture';
import { loadJson } from '../../utils/data-loader';

interface LoginUser {
  testcaseid: string;
  testcasename: string;
  username: string;
  password: string;
}

const loginUsers = loadJson<LoginUser[]>('login-users.json');

test.describe('Authentication', () => {
  // Login tests must NOT use the saved storageState — they test the login flow itself
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * A1 — Basic login using credentials from environment config
   * Source: logintest.feature → "Test the login function"
   * Selenium: Login.java → login() + verifyDashboardPage()
   */

  // ─── APPROACH 1: Plain POM calls (active — no steps) ─────────────────────
  test('A1 - user can log in with env credentials @smoke', async ({ loginPage, homePage, credentials }) => {
    await loginPage.open();
    await loginPage.clickLoginWithCAIfVisible();
    await loginPage.fillCredentials(credentials.username, credentials.password);
    await loginPage.clickSubmit();
    await loginPage.assertLoginSuccess();     // Then CrossAd dashboard should appear
    await homePage.clickSideBarViewer();      // And User clicks on SideBar Viewer
  });

  // ─── APPROACH 2: Step-wise (one test.step per action) — for reference ─────
  // test('A1 - user can log in with env credentials @smoke', async ({ loginPage, credentials }) => {
  //   await test.step('Open login page', () => loginPage.open());
  //   await test.step('Click CA login button if visible', () => loginPage.clickLoginWithCAIfVisible());
  //   await test.step('Fill username and password', () => loginPage.fillCredentials(credentials.username, credentials.password));
  //   await test.step('Click login button', () => loginPage.clickSubmit());
  //   await test.step('Verify login success', () => loginPage.assertLoginSuccess());
  // });

  // ─── APPROACH 3: Phase-wise Given/When/Then steps — for reference ──────────
  // test('A1 - user can log in with env credentials @smoke', async ({ loginPage, credentials }) => {
  //   await test.step('Given the login page is open', async () => {
  //     await loginPage.open();
  //     await loginPage.clickLoginWithCAIfVisible();
  //   });
  //   await test.step('When user submits valid credentials', async () => {
  //     await loginPage.fillCredentials(credentials.username, credentials.password);
  //     await loginPage.clickSubmit();
  //   });
  //   await test.step('Then login succeeds', async () => {
  //     await loginPage.assertLoginSuccess();
  //   });
  // });

  /**
   * A2 — Data-driven login (one row per user in login-users.json)
   * Source: LoginWithdata.feature → "Test the login function" with Examples table
   * Selenium: same Login.java flow, credentials from CSV
   */
  for (const user of loginUsers) {
    test(`A2 - data-driven login [${user.testcaseid}] ${user.testcasename} @smoke`, async ({ loginPage }) => {
      await loginPage.open();
      await loginPage.clickLoginWithCAIfVisible();
      await loginPage.fillCredentials(user.username, user.password);
      await loginPage.clickSubmit();
      await loginPage.assertLoginSuccess();
    });
  }

});
