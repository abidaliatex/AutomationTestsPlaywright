import { test, expect } from '../../fixtures/test-fixture';
import { loadJson } from '../../utils/data-loader';

interface QuickSearchData {
  tc_search02: {
    testcaseid: string;
    testcasename: string;
    customerName: string;
  };
}

const data = loadJson<QuickSearchData>('quick-search.json');

test.describe('Quick Search', () => {

  test.beforeEach(async ({ loginPage, credentials, homePage }) => {
    await test.step('Login', () => loginPage.login(credentials.username, credentials.password));
    await test.step('Assert dashboard loaded', () => homePage.assertDashboardLoaded());
  });

  /**
   * C2 — Quick search for customer, verify customer appears in results on dashboard
   * Source: miscellaneous.feature → tc_search02
   *         "verify quicksearch for customer with verifying customer name on customer page"
   * Selenium: hp.quickSearch(value) → hp.verifyCustomerName(customerName)
   *           verifies (//strong[contains(text(),'Autotest Customer')])[1] is visible
   */
  test('C2 - quick search finds customer and shows result on dashboard @smoke', async ({ homePage }) => {
    const { customerName, testcaseid } = data.tc_search02;

    await test.step(`Quick search for: ${customerName}`, () => homePage.quickSearch(customerName));
    await test.step('Verify customer appears in results', () => homePage.assertCustomerInResults(customerName));
  });

});
