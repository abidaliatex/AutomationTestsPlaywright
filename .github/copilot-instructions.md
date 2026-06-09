# GitHub Copilot Instructions — CrossAd Playwright Framework

## Framework Architecture

This is a **Playwright TypeScript** test framework migrated from a Selenium Java framework for the CrossAd advertising system (AngularJS SPA).

### Structure
- `pages/` — Page Object Model classes, all extend `BasePage`
- `utils/action.ts` — CrossAd-specific browser interaction helpers (mirrors Selenium's `Action.java`)
- `fixtures/test-fixture.ts` — Playwright fixtures that wire up page objects
- `tests/` — Test specs organised by feature area
- `test-data/` — JSON test data files (replacing Selenium's CSV files)
- `config/env.ts` — Environment configuration via dotenv

---

## Action Class Rules (IMPORTANT)

The `Action` class in `utils/action.ts` exists **only** for complex, reusable CrossAd-specific interactions that Playwright cannot handle cleanly on its own.

### ✅ USE `this.act.*` for:
- `this.act.singleSelectDropdown(locator, value)` — AngularJS ui-select dropdowns (requires JS click to bypass ng-animate)
- `this.act.singleSelectDropdownContains(locator, value)` — partial-match variant
- `this.act.handleNotificationIfPresent(locator)` — CrossAd notification popup dismissal loop
- `this.act.tryFluentWaitSpecific(locator)` — server-delay retry click (e.g., Save button)
- `this.act.multiselectDropDown(values, locator, deselectLocator)` — multi-select ui-select

### ❌ DO NOT wrap simple Playwright calls in `this.act.*`:
```typescript
// WRONG — adds no value, hides Playwright's native API
await this.act.click(this.myButton);
await this.act.type('value', this.myInput);
await this.act.verifyLocator(this.myElement);

// CORRECT — use Playwright directly
await this.myButton.click();
await this.myInput.fill('value');
await expect(this.myElement).toBeVisible();
```

### Rule summary:
> Use `this.act.*` **only** when the interaction requires CrossAd/AngularJS-specific workarounds.
> Use Playwright's native `locator.click()`, `locator.fill()`, `expect()` for everything else.

---

## Page Object Rules

- Every page class **extends `BasePage`** and receives `page: Page` in the constructor.
- Locators are defined as **`private readonly`** fields using `this.page.locator(...)`.
- Page methods are `async` and return `Promise<void>` (or a specific type when returning data).
- Use `expect` from `@playwright/test` directly in page assertion methods.

```typescript
// Correct page object pattern
export class MyPage extends BasePage {
  private readonly submitBtn = this.page.locator('#submit');
  private readonly packetDropdown = this.page.locator("//div[@id='packet']");

  async clickSubmit(): Promise<void> {
    await this.submitBtn.click();                          // direct Playwright
  }

  async selectPacket(value: string): Promise<void> {
    await this.act.singleSelectDropdown(this.packetDropdown, value); // Action class
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.submitBtn).toBeVisible();            // direct expect
  }
}
```

---

## Test Data Rules

- Test data lives in `test-data/*.json` files (NOT CSV).
- Load with a direct `import` — no helper needed for simple cases.
- Structure: array of objects with `testcaseid` as the key field.

---

## Locator Guidelines

### Playwright Locator Hierarchy — always use the highest priority that works

| Priority | Strategy | Example | When to use |
|---|---|---|---|
| 1 | Role + name | `getByRole('button', { name: 'Save' })` | Buttons, links, inputs with accessible labels |
| 2 | Text | `getByText('Create Print order', { exact: true })` | Unique visible static text |
| 3 | Label | `getByLabel('Username')` | Form fields with `<label>` elements |
| 4 | CSS — id | `locator('#inputSearch')` | Elements with stable `id` attributes |
| 5 | CSS — attr/name | `locator('[name="antal"]')` | Inputs without ids but with `name` attributes |
| 6 | XPath | `locator("//div[@id='packet']")` | **See exception below** |

### ❌ Do NOT use XPath when a higher-priority strategy works:
```typescript
// WRONG — XPath for a simple id
this.page.locator("//input[@id='inputSearch']")
this.page.locator("//*[@id='searchOrders']")

// CORRECT — CSS id selector
this.page.locator('#inputSearch')
this.page.locator('#searchOrders')

// WRONG — XPath for static text
this.page.locator("//*[contains(text(),'Create Print order')]")

// CORRECT — getByText
this.page.getByText('Create Print order', { exact: true })

// WRONG — XPath for dynamic text when getByText works
this.page.locator(`//strong[contains(text(),'${name}')]`)

// CORRECT — filter by text
this.page.getByRole('strong').filter({ hasText: name }).first()
// or for waiting on a detail page:
this.page.getByText(name).first().waitFor({ state: 'visible' })
```

### ✅ XPath IS required for AngularJS ui-select dropdowns (CrossAd-specific exception)

The ui-select dropdown containers **must** use XPath because `act.singleSelectDropdown` internally
traverses into nested `div[id*='ui-select-choices-row']` children using `page.evaluate()` to bypass
`ng-animate`. Playwright's semantic locators cannot target these generated child ids.

```typescript
// CORRECT — XPath for ui-select dropdown containers (only valid XPath use)
private readonly packetDropdown    = this.page.locator("//div[@id='packet']");
private readonly pricelistDropdown = this.page.locator("//div[@id='pricelist']");
private readonly placementDropdown = this.page.locator("//div[@id='placement']");
private readonly salesmanDropdown  = this.page.locator("//div[@id='salesman']");

// Then always pass to act.singleSelectDropdown — never click directly
await this.act.singleSelectDropdown(this.packetDropdown, value);
```

> **Rule**: If the locator is passed to `act.singleSelectDropdown` or `act.multiselectDropDown`, use XPath `//div[@id='fieldname']`.
> For everything else, follow the priority table above — XPath is the last resort.

---

## Selenium → Playwright Method Mapping

| Selenium (`act.*`) | Playwright equivalent |
|---|---|
| `act.click(By)` | `await locator.click()` |
| `act.type(value, By)` | `await locator.fill(value)` |
| `act.getText(By)` | `await locator.textContent()` |
| `act.verifyLocator(By)` | `await expect(locator).toBeVisible()` |
| `act.verifyTextContains(text, By)` | `await expect(locator).toContainText(text)` |
| `act.verifyTextEquals(text, By)` | `await expect(locator).toHaveText(text)` |
| `act.isDisplayed(By)` | `await locator.isVisible()` |
| `act.checkLocatorPresent(By)` | `await locator.count() > 0` |
| `act.scrolltoElement(By)` | `await locator.scrollIntoViewIfNeeded()` |
| `act.singleSelectDropdown(By, By, value)` | `await this.act.singleSelectDropdown(locator, value)` ← keep in Action |
| `act.handleNotificationIfPresent(By)` | `await this.act.handleNotificationIfPresent(locator)` ← keep in Action |
