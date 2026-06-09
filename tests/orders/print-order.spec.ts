import { test, expect } from '../../fixtures/test-fixture';
import ordersData from '../../test-data/orders.json';
import { env } from '../../config/env';

// Migrated from Selenium: @sto_abid @printOrder1 — Scenario Outline: User Creates new order
test.describe('Print Order', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${env.baseUrl}/#/`);
  });

  test('tc_cno01 - create general order @smoke', async ({
    homePage,
    customerPage,
    printOrderPage,
  }) => {
    const testCase = ordersData.find(d => d.testcaseid === 'tc_cno01')!;

    await homePage.clickDashboard();
    await homePage.gotoCustomerSearch();

    await customerPage.searchCustomer(testCase.customerName);
    await customerPage.selectCustomer(testCase.customerName);
    await customerPage.clickCreatePrintOrder(testCase.customerName);

    await printOrderPage.clickOrderMainTab();
    await printOrderPage.fillOrderData({
      packet:      testCase.packet,
      pricelist:   testCase.pricelist,
      placement:   testCase.placement,
      columns:     testCase.columns,
      height:      testCase.height,
      invoiceText: testCase.invoiceText,
      salesman:    testCase.salesman,
    });
    await printOrderPage.clickPrintOrderOK();
    await printOrderPage.setTomorrowsDate();
    await printOrderPage.clickIssueDateOK();
    await printOrderPage.saveOrder();

    const orderText = await printOrderPage.verifyOrderCreated();
    expect(orderText).toContain('Order #');
  });
});
