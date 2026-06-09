import { type Page, expect } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * CustomerPage — ported from Selenium's Customer.java + CustomerLocator.java
 *
 * Locators (from CustomerLocator.java):
 *   customerSearchInput:     //input[@id='inputSearch']
 *   searchButton:            //*[@id='searchOrders']
 *   filteredCustomer:        //strong[contains(text(),'<name>')]
 *   createMenuButton:        #customerNavMenuCreate
 *   createPrintOrderBtn:     //*[contains(text(),'Create Print order')]
 */
export class CustomerPage extends BasePage {
  private readonly customerSearchInput = this.page.locator('#inputSearch');
  private readonly searchButton        = this.page.locator('#searchOrders');
  private readonly createMenuButton    = this.page.locator('#customerNavMenuCreate');
  private readonly createPrintOrderBtn = this.page.getByText('Create Print order', { exact: true });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Search for a customer by name — mirrors Selenium's custp.setCustomerIDSearch() + custp.clickSearch()
   * In Selenium, the name was resolved to a DB customer ID first; in Playwright we search by name directly.
   */
  async searchCustomer(customerName: string): Promise<void> {
    await this.customerSearchInput.fill(customerName);
    await this.searchButton.click();
  }

  /**
   * Click the matching customer in search results — mirrors Selenium's custp.clickOnFilteredCustomer(name)
   * Locator from CustomerLocator.java → linkFilteredCustomerLocator: //strong[contains(text(),'...')]
   */
  async selectCustomer(customerName: string): Promise<void> {
    await this.page.getByRole('strong').filter({ hasText: customerName }).first().click();
  }

  /**
   * Open Create Print Order — mirrors Selenium's custp.clickPrintOrder()
   *
   * Selenium flow (Customer.java):
   *   act.verifyLocator(labelTestCustomer)    ← waits for //span[contains(text(),'Autotest Customer')]
   *                                              This confirms we are on the customer DETAIL page,
   *                                              NOT still on the search results page.
   *   act.click(btnCreateLocator)             ← #customerNavMenuCreate
   *   act.click(btnCreatePrintOrderLocator)   ← //*[contains(text(),'Create Print order')]
   *
   * @param customerName — used to verify the customer detail page has loaded before clicking Create
   */
  async clickCreatePrintOrder(customerName: string): Promise<void> {
    // Wait for the customer name span — mirrors Selenium's act.verifyLocator(labelTestCustomer)
    // labelTestCustomer = By.xpath("//span[contains(text(),'Autotest Customer')]")
    await this.page.getByText(customerName).first().waitFor({ state: 'visible', timeout: 15000 });

    await this.createMenuButton.click();
    await this.createPrintOrderBtn.click();
  }
}
