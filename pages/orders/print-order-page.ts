import { expect } from '@playwright/test';
import { BasePage } from '../base-page';

export interface PrintOrderData {
  packet: string;
  pricelist: string;
  placement: string;
  columns: string;
  height: string;
  invoiceText: string;
  salesman: string;
}

/**
 * PrintOrderPage — ported from Selenium's PrintOrderPage.java + PrintOrderLocators.java
 *
 * Locators (from PrintOrderLocators.java):
 *   orderMainTab:       //a[@id='mainTab']
 *   packetDropdown:     //div[@id='packet']
 *   pricelistDropdown:  //div[@id='pricelist']
 *   placementDropdown:  //div[@id='placement']
 *   salesmanDropdown:   //div[@id='salesman']
 *   columnsInput:       //*[@name='antal']
 *   heightInput:        //*[@name='height']
 *   invoiceTextInput:   //*[@name='invoicetext']
 *   okButton:           //*[@id='save']              (Print Order OK — saves the form)
 *   otherDateInput:     //*[@id='otherDate']         (issue date text input)
 *   otherDateBtn:       //button[@id='setOtherDate'] (applies the typed date to calendar)
 *   completeOkBtn:      //*[@id='ok']                (OK after issue date dialog)
 *   saveButton:         //span[text()=' Save']//parent::button
 *   orderNumber:        //span[@id='orderNumber']
 *   notification:       //div[contains(@id,'notification')]//button
 */
export class PrintOrderPage extends BasePage {
  private readonly orderMainTab      = this.page.locator("//a[@id='mainTab']");
  private readonly packetDropdown    = this.page.locator("//div[@id='packet']");
  private readonly pricelistDropdown = this.page.locator("//div[@id='pricelist']");
  private readonly placementDropdown = this.page.locator("//div[@id='placement']");
  private readonly salesmanDropdown  = this.page.locator("//div[@id='salesman']");
  private readonly columnsInput      = this.page.locator("//*[@name='antal']");
  private readonly heightInput       = this.page.locator("//*[@name='height']");
  private readonly invoiceTextInput  = this.page.locator("//*[@name='invoicetext']");
  private readonly okButton          = this.page.locator("//*[@id='save']").first();
  private readonly otherDateInput    = this.page.locator("//*[@id='otherDate']");
  private readonly otherDateBtn      = this.page.locator("//button[@id='setOtherDate']");
  private readonly completeOkBtn     = this.page.locator("//*[@id='ok']");
  private readonly saveButton        = this.page.locator("//span[text()=' Save']//parent::button");
  private readonly orderNumberLink   = this.page.locator("//span[@id='orderNumber']");
  private readonly notificationBtn   = this.page.locator("//div[contains(@id,'notification')]//button");

  /**
   * Click the Order main tab — mirrors Selenium's printOrderp.clickOrderMaintab()
   *   act.click(linkOrderMainTabLocator)
   */
  async clickOrderMainTab(): Promise<void> {
    await this.orderMainTab.click();
  }

  /**
   * Fill the print order form — mirrors Selenium's printOrderp.addOrderData()
   *
   * Selenium calls (PrintOrderPage.java):
   *   selectPacket()    → act.singleSelectDropdown(dropDownSnglPacketLocator, dropDownSnglPacketListOfLocator, packet)
   *   selectPricelist() → act.singleSelectDropdown(dropDownSnglPriceListLocator, ...)
   *   selectPlacement() → act.singleSelectDropdown(...) + Thread.sleep(3000)
   *   setColumns()      → act.type(columns, txtColumnsLocator)
   *   setHeight()       → act.type(height, txtHeightLocator) + Thread.sleep(5000)
   *   setInvoiceTest()  → act.type(invoiceTest, txtInvoiceTestLocator)
   *   selectSalesman()  → act.singleSelectDropdown(dropDownSnglSalesmanLocator, ...)
   *
   * Rule: singleSelectDropdown → this.act (AngularJS JS-click needed)
   *       plain fill → direct Playwright locator.fill()
   */
  async fillOrderData(data: PrintOrderData): Promise<void> {
    await this.act.singleSelectDropdown(this.packetDropdown, data.packet);
    await this.act.singleSelectDropdown(this.pricelistDropdown, data.pricelist);
    await this.act.singleSelectDropdown(this.placementDropdown, data.placement);
    // Selenium: Thread.sleep(3000) after placement — wait for price to load
    await this.page.waitForTimeout(3000);

    await this.columnsInput.fill(data.columns);
    await this.heightInput.fill(data.height);
    // Selenium: Thread.sleep(5000) after height — system recalculates price
    await this.page.waitForTimeout(5000);

    await this.invoiceTextInput.fill(data.invoiceText);
    await this.act.singleSelectDropdown(this.salesmanDropdown, data.salesman);
  }

  /**
   * Click Print Order OK (save the form) — mirrors Selenium's printOrderp.clickPrintOrderOK()
   *   act.click(btnPrintOrderOKLocator)  →  //*[@id='save']
   */
  async clickPrintOrderOK(): Promise<void> {
    await this.okButton.click();
  }

  /**
   * Select a date 2 days from today — mirrors Selenium's printOrderp.setTomorrowsDate()
   *
   * Selenium flow (PrintOrderPage.java):
   *   1. Read date format from uib-datepicker-popup attribute on the input field
   *      String datepickerFormat = act.getAttributeValue(txtOtherDateLocator, "uib-datepicker-popup")
   *   2. Format today+2 using SimpleDateFormat(datepickerFormat)
   *   3. Thread.sleep(2000)
   *   4. setOtherDate(dateStr) → act.type(otherDate, txtOtherDateLocator)
   *   5. Thread.sleep(1000)
   *   6. clickOtherDate() → act.click(btnOtherDateLocator)
   *   7. Thread.sleep(10000) + dismiss notifications
   */
  async setTomorrowsDate(): Promise<void> {
    // Step 1: Read the date format from the AngularJS datepicker attribute
    const formatPattern = await this.act.getAttributeValue(this.otherDateInput, 'uib-datepicker-popup');

    // Step 2: Format today+2 according to the pattern (mirrors SimpleDateFormat)
    const date = new Date();
    date.setDate(date.getDate() + 2);
    const dateStr = this.formatDate(date, formatPattern || 'yyyy-MM-dd');

    // Step 3+4: Type the date — mirrors setOtherDate() → act.type(otherDate, txtOtherDateLocator)
    // Use pressSequentially to fire keyboard events AngularJS ng-model listens to
    await this.otherDateInput.click();
    await this.otherDateInput.selectText();
    await this.page.keyboard.press('Delete');
    await this.otherDateInput.pressSequentially(dateStr, { delay: 50 });

    // Step 5+6: Click the "Set Other Date" button — mirrors clickOtherDate() → act.click(btnOtherDateLocator)
    await this.otherDateBtn.click();

    // Step 7: Dismiss any notifications — mirrors Selenium's while(checkLocatorPresent(IssueDateNotificationLocator))
    await this.page.waitForTimeout(3000);
    await this.act.handleNotificationIfPresent(this.notificationBtn);
  }

  /**
   * Click OK after issue dates are selected — mirrors Selenium's printOrderp.OKPrintOrder()
   *   act.click(btnPrintOrderCompOKLocator)  →  //*[@id='ok']
   */
  async clickIssueDateOK(): Promise<void> {
    await expect(this.completeOkBtn).toBeEnabled({ timeout: 15000 });
    await this.completeOkBtn.click();
  }

  /**
   * Save the print order — mirrors Selenium's printOrderp.savePrintOrderServerDelay()
   *   act.tryFluentWaitSpecific(btnPrintOrderSaveLocator) — retry click with server delay handling
   *   + while(checkLocatorPresent(IssueDateNotificationLocator)) → dismiss notifications
   */
  async saveOrder(): Promise<void> {
    // tryFluentWaitSpecific mirrors Selenium's fluent-wait retry click for the Save button
    await this.act.tryFluentWaitSpecific(this.saveButton);
    await this.act.handleNotificationIfPresent(this.notificationBtn);
  }

  /**
   * Verify order was created — mirrors Selenium's printOrderp.verifyOrderCreated()
   * Selenium also verified the order number against the DB; here we verify the UI element.
   */
  async verifyOrderCreated(): Promise<string> {
    await expect(this.orderNumberLink).toBeVisible({ timeout: 30000 });
    return this.act.getText(this.orderNumberLink);
  }

  /**
   * Format a Date using a Java SimpleDateFormat pattern string.
   * Mirrors Selenium's: new SimpleDateFormat(datepickerFormat).format(cal.getTime())
   *
   * Supported tokens: yyyy, yy, MM, dd
   */
  private formatDate(date: Date, pattern: string): string {
    const yyyy = String(date.getFullYear());
    const yy   = yyyy.slice(-2);
    const MM   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    return pattern
      .replace('yyyy', yyyy)
      .replace('yy',   yy)
      .replace('MM',   MM)
      .replace('dd',   dd);
  }
}
