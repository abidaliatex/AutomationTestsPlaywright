import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Action — Playwright equivalent of Selenium's Action.java (actiondriver/Action.java)
 *
 * Centralizes all browser interactions so every page object calls
 *   this.act.click(), this.act.type(), this.act.singleSelectDropdown(), etc.
 * instead of duplicating interaction logic in each page class.
 *
 * Method mapping from Action.java → action.ts:
 *   click(By)                              → click(locator)
 *   type(String, By)                       → type(value, locator)
 *   getText(By)                            → getText(locator)
 *   getAttributeValue(By, String)          → getAttributeValue(locator, attr)
 *   verifyLocator(By)                      → verifyLocator(locator)
 *   verifyLocatorInvisibilityOfElement(By) → verifyLocatorInvisibilityOfElement(locator)
 *   checkLocatorPresent(By)               → checkLocatorPresent(locator)
 *   isDisplayed(By)                        → isDisplayed(locator)
 *   verifyTextContains(String, By)         → verifyTextContains(expectedText, locator)
 *   verifyTextEquals(String, By)           → verifyTextEquals(expectedText, locator)
 *   scrolltoElement(By)                    → scrolltoElement(locator)
 *   handleNotificationIfPresent(By)        → handleNotificationIfPresent(locator)
 *   checkBoxSelect(By)                     → checkBoxSelect(locator)
 *   checkBoxDeselect(By)                   → checkBoxDeselect(locator)
 *   tryFluentWaitSpecific(By)              → tryFluentWaitSpecific(locator)
 *   waitforElementTodisapear(By)           → waitforElementTodisapear(locator)
 *   getElementCount(By, By)               → getElementCount(containerLocator)
 *   singleSelectDropdown(By, By, String)   → singleSelectDropdown(dropdownLocator, selectValue)
 *   singleSelectDropdownContains(...)      → singleSelectDropdownContains(dropdownLocator, selectValue)
 *   multiselectDropDown(...)               → multiselectDropDown(values, locator, deselectLocator)
 */
export class Action {
  constructor(private readonly page: Page) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CLICK
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Click an element — mirrors Selenium's act.click(By locator)
   * Falls back to JS click if ElementClickInterceptedException (same as Action.java catch block)
   */
  async click(locator: Locator): Promise<void> {
    try {
      await locator.click({ timeout: 15000 });
    } catch {
      // JS click fallback — mirrors: js.executeScript("arguments[0].click()", element)
      await locator.evaluate((el: HTMLElement) => el.click());
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TYPE / CLEAR
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fill a text input — mirrors Selenium's act.type(String text, By locator)
   */
  async type(value: string, locator: Locator): Promise<void> {
    await locator.fill(value);
  }

  /**
   * Clear an input then fill — mirrors Selenium's act.clear(String text, By locator)
   */
  async clear(locator: Locator): Promise<void> {
    await locator.clear();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET TEXT / ATTRIBUTES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get visible text of an element — mirrors Selenium's act.getText(By locator)
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  /**
   * Get the value of an element attribute — mirrors Selenium's act.getAttributeValue(By, String)
   */
  async getAttributeValue(locator: Locator, attribute: string): Promise<string> {
    return (await locator.getAttribute(attribute)) ?? '';
  }

  /**
   * Get the value property of an input — mirrors Selenium's act.getTextInputElement(By)
   */
  async getInputValue(locator: Locator): Promise<string> {
    return (await locator.inputValue()) ?? '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VISIBILITY / PRESENCE CHECKS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Wait for element to be visible — mirrors Selenium's act.verifyLocator(By)
   */
  async verifyLocator(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Check if element is currently visible — mirrors Selenium's act.isDisplayed(By)
   */
  async isDisplayed(locator: Locator): Promise<boolean> {
    return locator.isVisible().catch(() => false);
  }

  /**
   * Check if element exists anywhere in the DOM (not necessarily visible)
   * mirrors Selenium's act.checkLocatorPresent(By)
   */
  async checkLocatorPresent(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }

  /**
   * Wait for element to disappear — mirrors Selenium's act.waitforElementTodisapear(By)
   */
  async waitforElementTodisapear(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Returns true when element is no longer visible — mirrors Selenium's
   * act.verifyLocatorInvisibilityOfElementBool(By)
   */
  async verifyLocatorInvisibilityOfElementBool(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'hidden', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element invisibility and throw if still visible — mirrors Selenium's
   * act.verifyLocatorInvisibilityOfElement(By) which throws if element is still visible
   */
  async verifyLocatorInvisibilityOfElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Wait for an element to be present (attached to DOM, not necessarily visible)
   * mirrors Selenium's act.waitForElementPresent(By, int timeoutSeconds)
   */
  async waitForElementPresent(locator: Locator, timeoutSeconds = 15): Promise<void> {
    await locator.waitFor({ state: 'attached', timeout: timeoutSeconds * 1000 });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ASSERTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Assert element text contains expectedText — mirrors Selenium's act.verifyTextContains(String, By)
   */
  async verifyTextContains(expectedText: string, locator: Locator): Promise<void> {
    await expect(locator).toContainText(expectedText);
  }

  /**
   * Assert element text equals expectedText — mirrors Selenium's act.verifyTextEquals(String, By)
   */
  async verifyTextEquals(expectedText: string, locator: Locator): Promise<void> {
    await expect(locator).toHaveText(expectedText);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCROLL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Scroll element into view — mirrors Selenium's act.scrolltoElement(By)
   */
  async scrolltoElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Dismiss notification popup if present — mirrors Selenium's act.handleNotificationIfPresent(By)
   * Keeps clicking until notification disappears (same while-loop pattern as Selenium)
   */
  async handleNotificationIfPresent(locator: Locator): Promise<void> {
    let attempts = 0;
    while (attempts < 5) {
      const visible = await locator.isVisible().catch(() => false);
      if (!visible) break;
      await locator.first().evaluate((el: HTMLElement) => el.click());
      await this.page.waitForTimeout(500);
      attempts++;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECKBOX
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Select a checkbox if not already checked — mirrors Selenium's act.checkBoxSelect(By)
   */
  async checkBoxSelect(locator: Locator): Promise<void> {
    if (!(await locator.isChecked())) {
      await locator.check();
    }
  }

  /**
   * Deselect a checkbox if currently checked — mirrors Selenium's act.checkBoxDeselect(By)
   */
  async checkBoxDeselect(locator: Locator): Promise<void> {
    if (await locator.isChecked()) {
      await locator.uncheck();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COUNT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Count matching elements — mirrors Selenium's act.getElementCount(By, By)
   */
  async getElementCount(locator: Locator): Promise<number> {
    return locator.count();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLUENT WAIT CLICK (for save/submit with server delays)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Click with retry until successful — mirrors Selenium's act.tryFluentWaitSpecific(By)
   * Used for buttons that become clickable after server-side processing (e.g., Save)
   */
  async tryFluentWaitSpecific(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await expect(locator).toBeEnabled({ timeout: 30000 });
    await locator.evaluate((el: HTMLElement) => el.click());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DROPDOWN — AngularJS ui-select (CrossAd's main dropdown component)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Select an option from an AngularJS ui-select dropdown — mirrors Selenium's
   * act.singleSelectDropdown(By locator, By listLocator, String selectValue)
   *
   * How Selenium's singleSelectDropdown works (Action.java lines 1158–1283):
   *   1. Clicks the dropdown container div to open the list
   *   2. Waits for list items matching listLocator to be visible
   *   3. Loops through each item, checks getText() === selectValue (exact match)
   *   4. Clicks the matched item via JavascriptExecutor (js.executeScript("arguments[0].click()", element))
   *      — JS click is used to avoid ElementClickInterceptedException from AngularJS animations
   *
   * Playwright equivalent:
   *   1. Click the dropdown container (same)
   *   2. Wait for option rows div[id*='ui-select-choices-row'] to attach to DOM
   *   3. Use page.evaluate() to JS-click the matching row by text
   *      (same as JavascriptExecutor — bypasses ng-animate blocking)
   *
   * @param dropdownLocator  outer div wrapper, e.g. page.locator("//div[@id='packet']")
   * @param selectValue      exact display text of the option to select
   */
  async singleSelectDropdown(dropdownLocator: Locator, selectValue: string): Promise<void> {
    // Step 1: Open the dropdown
    await dropdownLocator.click();

    // Step 2: Wait for option rows in the DOM
    const optionRow = dropdownLocator.locator("div[id*='ui-select-choices-row']").first();
    await optionRow.waitFor({ state: 'attached', timeout: 10000 });

    // Step 3: JS-click — mirrors js.executeScript("arguments[0].click()", element) in Selenium
    const handle = await dropdownLocator.elementHandle();
    await this.page.evaluate(
      ({ el, text }: { el: Element | null; text: string }) => {
        if (!el) return;
        const rows = el.querySelectorAll<HTMLElement>('div[id*="ui-select-choices-row"]');
        // Exact match (mirrors: selectValue.equals(element.getText()))
        for (const row of rows) {
          if (row.textContent?.trim() === text) { row.click(); return; }
        }
        // Partial match fallback
        for (const row of rows) {
          if (row.textContent?.trim().includes(text)) { row.click(); return; }
        }
      },
      { el: handle, text: selectValue }
    );
  }

  /**
   * Select a dropdown option using partial text match — mirrors Selenium's
   * act.singleSelectDropdownContains(By locator, By listLocator, String selectValue)
   */
  async singleSelectDropdownContains(dropdownLocator: Locator, selectValue: string): Promise<void> {
    await dropdownLocator.click();

    const optionRow = dropdownLocator.locator("div[id*='ui-select-choices-row']").first();
    await optionRow.waitFor({ state: 'attached', timeout: 10000 });

    const handle = await dropdownLocator.elementHandle();
    await this.page.evaluate(
      ({ el, text }: { el: Element | null; text: string }) => {
        if (!el) return;
        const rows = el.querySelectorAll<HTMLElement>('div[id*="ui-select-choices-row"]');
        for (const row of rows) {
          if (row.textContent?.trim().includes(text)) { row.click(); return; }
        }
      },
      { el: handle, text: selectValue }
    );
  }

  /**
   * Multi-select from an AngularJS ui-select dropdown — mirrors Selenium's
   * act.multiselectDropDown(String listofvalues, By locator, By listLocator, By deSelectLocator)
   *
   * @param values           pipe-separated string of values, e.g. "Value1--Value2--Value3"
   * @param dropdownLocator  the dropdown container
   * @param deselectLocator  the "DESELECT ALL" button locator (to reset before selecting)
   */
  async multiselectDropDown(
    values: string,
    dropdownLocator: Locator,
    deselectLocator: Locator
  ): Promise<void> {
    const items = values.split('--').map(v => v.trim()).filter(Boolean);
    if (items.length === 0) return;

    // Deselect all first (mirrors Selenium's deselectAll step)
    await dropdownLocator.click();
    const deselect = deselectLocator.first();
    if (await deselect.isVisible().catch(() => false)) {
      await deselect.click();
    }

    // Select each item
    for (const item of items) {
      await dropdownLocator.click();
      const optionRow = dropdownLocator.locator("div[id*='ui-select-choices-row']").first();
      await optionRow.waitFor({ state: 'attached', timeout: 10000 });

      const handle = await dropdownLocator.elementHandle();
      await this.page.evaluate(
        ({ el, text }: { el: Element | null; text: string }) => {
          if (!el) return;
          const rows = el.querySelectorAll<HTMLElement>('div[id*="ui-select-choices-row"]');
          for (const row of rows) {
            if (row.textContent?.trim().includes(text)) { row.click(); return; }
          }
        },
        { el: handle, text: item }
      );
    }
  }
}
