import { type Page, expect } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * HomePage — ported from Selenium's CrossAd_HomePage.java + CrossAd_HomePageLocators.java
 *
 * Locators (from CrossAd_HomePageLocators.java):
 *   dashboardVerify:    #createNewCustomer
 *   quickSearchInput:   (//input[@type='text'])[1]
 *   quickSearchButton:  (//button[@id='buttonSearch'])[1]
 *   customerResult:     (//strong[contains(text(),'<name>')])[1]
 */
export class HomePage extends BasePage {
  private readonly createNewCustomerBtn = this.page.locator('#createNewCustomer');
  private readonly quickSearchInput     = this.page.locator("(//input[@type='text'])[1]");
  private readonly quickSearchButton    = this.page.locator("(//button[@id='buttonSearch'])[1]");
  private readonly sideBarViewerBtn     = this.page.locator('#hamburgerIcon.hidden-xs');  // CrossAd_HomePageLocators.java → sideBarViewerLocator (desktop variant)
  private readonly dashboardMenuLink    = this.page.locator('#dashboardMenu');
  private readonly searchNavBtn         = this.page.locator("//span[contains(text(),'Search')]//parent::div//parent::a");
  private readonly customersNavBtn      = this.page.locator("//ul//a[contains(text(),'Customers')]");

  constructor(page: Page) {
    super(page);
  }

  /** Verify the CrossAd dashboard has loaded — mirrors Selenium's verifyDashboardClicked() */
  async assertDashboardLoaded(): Promise<void> {
    await expect(this.createNewCustomerBtn).toBeVisible();
  }

  /**
   * Quick search — mirrors Selenium's hp.quickSearch(value)
   * Types into the global search bar and clicks the search button.
   */
  async quickSearch(term: string): Promise<void> {
    await this.quickSearchInput.fill(term);
    await this.quickSearchButton.click();
  }

  /**
   * Verify customer appears in quick-search results — mirrors Selenium's hp.verifyCustomerName()
   * Uses txtCustomerLocator: (//strong[contains(text(),'<name>')])[1]
   */
  async assertCustomerInResults(customerName: string): Promise<void> {
    const resultLocator = this.page.locator(
      `(//strong[contains(text(),'${customerName}')])[1]`
    );
    await expect(resultLocator).toBeVisible();
  }

  /**
   * Click the sidebar hamburger icon — mirrors Selenium's hp.clickOnSideBarViewer()
   * Locator from CrossAd_HomePageLocators.java → sideBarViewerLocator: //*[@id='hamburgerIcon']
   */
  async clickSideBarViewer(): Promise<void> {
    await this.sideBarViewerBtn.click();
  }

  /**
   * Navigate to the Dashboard — mirrors Selenium's hp.clickOnDashboard()
   * Locator from CrossAd_HomePageLocators.java → linkDashboard: #dashboardMenu
   */
  async clickDashboard(): Promise<void> {
    await this.dashboardMenuLink.click();
  }

  /**
   * Navigate to Customer Search — mirrors Selenium's hp.gotoCustomerSearch()
   * Clicks Search nav link, then Customers submenu item.
   */
  async gotoCustomerSearch(): Promise<void> {
    await this.searchNavBtn.click();
    await this.customersNavBtn.click();
  }
}
