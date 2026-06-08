# Selenium → Playwright TypeScript Migration Plan

## Context

- **Source project:** `C:\Users\aliiiabi\mcp-projectsmy\crossad-selenium\crossadautomation`
- **Target project:** `C:\Users\aliiiabi\mcp-projectsmy\playwright-crossad`
- **Goal:** Full migration from Java + Selenium + TestNG + Cucumber to Playwright + TypeScript, enabling MCP-driven workflows and modern cross-browser automation.

## Revised Strategy (May 2026)

> **Architecture first, automation incrementally.**
>
> We set up the **complete target architecture** in one go — all folders, config, fixtures, base pages, utilities, CI config.
> We then automate only a **selected subset of test cases** now.
> The remaining feature files are migrated later at your own pace, domain by domain, using the same pattern.
>
> This means you always have a solid, scalable foundation to drop new tests into — without being blocked on completing the full suite first.

---

## Source Framework Inventory

### Structure

| Layer | Source path | Description |
|---|---|---|
| Core common module | `core-common-web/` | Shared base classes, actions, step definitions, utilities |
| App module | `crossad-web/` | App-specific page objects, locators, tests, step definitions |
| Runners | `*/runner/` | TestNG, JUnit, Cucumber runners |
| Step definitions | `*/stepDefinitions/` | Cucumber glue code |
| Page objects | `crossad-web/.../pageobjects/` | One class per page, uses locators classes |
| Locators | `crossad-web/.../objectrepository/` | Separate locator classes per page |
| Utilities | `*/utility/` | ExtentManager, ExcelLibrary, CSVManager, JSONManager, JDBCConnection, ImageCompare, Log, RetryAnalyzer |
| Feature files | `*/resources/features/*.feature` | ~30+ Cucumber feature files across all domains |
| Config | `*/resources/Config.properties` | Environment URLs, credentials, flags |
| Test data | `*/resources/testdata/` | Images, CSVs |
| CI suites | `testng_*.xml`, `testing_crossBrowser.xml` | Suite groupings: smoke, all, cross-browser, cucumber |

### Domains covered in feature files

- Authentication / Login
- Home page
- Customer (search, card actions, custom fields)
- Orders (create, print, online, offer, service, subscription, combination, commission, classified ads, campaign)
- Order search and filters
- Financial
- Reports (CRM, orders, cash register, deleted orders, preliminary orders, offer)
- Calendar
- Administration (system, users, operators, subscriptions, print, prices, styles, image gallery, CSS)
- Miscellaneous / tags / job notes

---

## What to Keep, Drop, and Rethink

### KEEP (port the intent, not the Java code)

| What | Why |
|---|---|
| Config values from `Config.properties` | Reuse URLs, credentials, environment flags → move to `.env` |
| CSV / Excel / JSON test data files | Copy to `test-data/`, load via typed TS loader |
| Reference images for visual tests | Keep under `test-data/`, use Playwright snapshot assertions |
| Feature file scenario list | Gold. Becomes the migration backlog. Keep scenario names and business intent |
| Locator values (CSS/XPath selectors) | Stable selectors are hard won. Port into page objects |
| Page object concept | One class per page, but flatten locators into the page class |
| DB validation intent | Port `JDBCConnection` to a thin TS DB helper only where tests actually need it |
| Suite groupings (smoke, regression) | Recreate via Playwright tags + `grep` in `playwright.config.ts` |

### DROP (do not port)

| What | Why |
|---|---|
| DriverManager, ChromeDriver, GeckoDriver binaries | Playwright manages browsers natively via `npx playwright install` |
| `Action.java` / explicit waits / `Thread.sleep` | Playwright auto-waits; replaced by web-first assertions |
| TestNG / JUnit / Cucumber runners | Replaced by Playwright's own runner |
| `RetryAnalyzer`, `RetryListener`, `RetryCleanupListener` | Replaced by `retries` in `playwright.config.ts` |
| `ExtentManager`, `ListenerClass`, ExtentReports wiring | Replaced by Playwright HTML reporter + trace viewer |
| `log4j` / `Log.java` | Replaced by `console` + Playwright trace/video/screenshot artifacts |
| Cucumber step definitions and Hooks | Replaced by Playwright test + fixtures. Less indirection, less flakiness |
| Separate `objectrepository/` locator classes | Inlined into each page object. Removes dual-maintenance |
| Eclipse/Maven artifacts (`.classpath`, `.project`, `pom.xml`, `.iml`) | Not needed in TS project |
| Duplicate utilities between `core-common-web` and `crossad-web` | Collapsed into a single `utils/` folder |

### RETHINK (change the architecture)

| Old pattern | New pattern |
|---|---|
| Feature → Steps → PageObject → Locators → Action wrappers (5 layers) | Spec → PageObject → locators (2 layers) |
| `BaseClass` + `CommonBaseClass` inheritance for setup/teardown | Custom Playwright fixtures in `fixtures/` (composable, no inheritance) |
| `WebDriverWait` / `FluentWait` | `expect(locator).toBeVisible()` and other web-first assertions |
| `Config.properties` duplicated in multiple `resources/configurtion/` folders | `.env` + `config/env.ts` — single typed source of truth |
| Manual retry analyzers | `retries: 2` in `playwright.config.ts` + `trace: 'on-first-retry'` |
| `Action.java` wrapping every click/type | Direct Playwright API calls in page objects |
| `ImageCompare.java` | `expect(page).toHaveScreenshot()` — built-in pixel diff |
| Parallel suites via TestNG XML | Playwright `projects` array + `fullyParallel: true` |
| Cross-browser via separate TestNG XML | Playwright `projects` for chromium / firefox / webkit in one config |

---

## Target Architecture

```
playwright-crossad/
├── config/
│   └── env.ts                  # Typed env config loaded from .env
├── fixtures/
│   └── test-fixture.ts         # Custom test/expect with page objects + users
├── pages/
│   ├── base-page.ts            # Shared page helpers
│   ├── login-page.ts
│   ├── main-page.ts
│   ├── customer/
│   ├── orders/
│   ├── admin/
│   └── reports/
├── test-data/
│   ├── users.json
│   ├── orders.json
│   └── images/                 # Visual baseline screenshots
├── tests/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── customer/
│   ├── orders/
│   ├── admin/
│   └── reports/
├── utils/
│   ├── data-loader.ts          # CSV / JSON / Excel readers
│   ├── db-helper.ts            # DB queries (if needed)
│   ├── api-helper.ts           # API shortcuts for test setup
│   └── logger.ts
├── .env                        # Local secrets (gitignored)
├── .env.example                # Template checked into git
├── playwright.config.ts        # Projects, retries, reporter, baseURL
├── package.json
└── tsconfig.json
```

### `playwright.config.ts` key decisions

- `projects`: `chromium`, `firefox`, `webkit`
- `fullyParallel: true`
- `retries: 2` on CI, `0` locally
- `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`
- Tags via `grep`: `@smoke`, `@regression`, `@admin`, etc.

---

## Phase Plan

### Phase 0 — Pick Your First Test Cases

**Goal:** Agree on which scenarios to automate now. Do NOT try to automate everything.

**How to choose:**
- Pick 5–15 scenarios that cover the most critical flows and are run most often manually.
- Good candidates: login, a customer search, creating one order type, one report.
- Skip complex / flaky / rarely-used scenarios for now — they go to the backlog.

Tasks:
- Review the scenario list below (or extracted from feature files).
- Highlight which ones you want in the first automated run.
- Agree on the short list before Phase 1 starts.

Output: a short list of 5–15 scenarios tagged `@now`, everything else tagged `@later`.

---

### Phase 1 — Complete Architecture Setup

**Goal:** The full target folder structure and framework wiring exists and is clean.
No test case automation happens here — only the skeleton.

Tasks:
- `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`
- `playwright.config.ts`: 3 browser projects (Chromium, Firefox, WebKit), retries, reporter, tags
- `config/env.ts`: typed config loaded from `.env`
- `fixtures/test-fixture.ts`: base fixture with `page`, `users`, common page objects
- `pages/base-page.ts`: shared helpers (goto, waitFor, etc.)
- `pages/` subfolders created for each domain (auth, customer, orders, admin, reports) — empty for now
- `tests/` subfolders created for each domain — empty for now
- `test-data/users.json` and data loader utility
- `utils/logger.ts`, `utils/data-loader.ts`, `utils/api-helper.ts` (stub), `utils/db-helper.ts` (stub)
- Auth state reuse setup (`storageState`) so future tests skip login

Exit criteria:
- `npm install` and `npx playwright install` clean
- `npx tsc --noEmit` passes with zero errors
- Empty test run exits cleanly with no framework errors

---

### Phase 2 — Automate Selected Scenarios (`@now` list)

**Goal:** Turn the Phase 0 shortlist into green, stable Playwright tests.

**For each selected scenario:**
1. Create or fill in the page object for that page (with inlined locators).
2. Write the spec in `tests/<domain>/`.
3. Tag it `@smoke` or `@regression` as appropriate.
4. Validate it runs on all 3 browsers.

Exit criteria:
- All `@now` scenarios automated and green on Chromium, Firefox, WebKit.
- Flakiness is zero or understood.
- Coding pattern is locked in — page objects, fixture usage, assertions.

---

### Phase 3 — Harden and Wire CI

**Goal:** Make the automated suite production-ready and run it automatically.

Tasks:
- Visual snapshots (`toHaveScreenshot`) for any UI-state assertions replacing `ImageCompare.java`
- DB helper if tests need DB validation (port `JDBCConnection` pattern)
- CI workflow (GitHub Actions or Azure DevOps):
  - PR gate → `npx playwright test --grep @smoke`
  - Nightly → `npx playwright test` (all automated tests)
- HTML report and trace artifacts archived in CI
- Auth state reuse verified working (stored login session, not login in every test)

Exit criteria:
- CI pipeline green
- Trace + screenshot artifacts available on failure
- Auth reuse cuts suite runtime noticeably

---

### Phase 4 — Expand Automation (Domain by Domain, Your Pace)

**Goal:** Migrate remaining feature files on your own schedule using the established pattern.

Order suggested (but flexible):
1. Authentication — all remaining login / logout / error scenarios
2. Customer — search, card actions, custom fields
3. Orders — print, online, offer, service, subscription, combination, commission, classified, campaign
4. Administration — system, users, operators, subscriptions, print config, prices, styles, image gallery
5. Reports — CRM, orders, cash register, deleted orders, preliminary, offers

**For each domain, repeat the same loop:**
- Fill in the page object for that domain.
- Write the spec from the feature file scenarios.
- Run in parallel with Selenium suite briefly.
- Retire Selenium domain tests once parity confirmed.

---

### Phase 5 — Cutover and Retire Selenium

**Goal:** Playwright is the single source of truth; Selenium is decommissioned.

Tasks:
- Move CI gate fully to Playwright suite
- Archive `crossad-selenium` repo (do not delete — keep as reference)
- Remove bundled chromedriver/geckodriver binaries from Selenium project
- Clean up Maven/Eclipse artifacts

Exit criteria:
- Playwright suite is the only CI gate
- Zero Selenium dependencies in active pipeline
- Selenium repo archived

---

## Running Commands Reference

```bash
# Install dependencies
npm install

# Install browsers
npx playwright install

# Run all tests
npm test

# Run smoke only
npx playwright test --grep @smoke

# Run headed
npm run test:headed

# Debug a single test
npx playwright test tests/auth/login.spec.ts --debug

# Open trace/HTML report
npm run report

# Typecheck
npx tsc --noEmit
```

---

## Status Tracker

| Phase | Status | Notes |
|---|---|---|
| 0 — Pick first test cases | ✅ Complete | 9 scenarios confirmed across 5 feature files |
| 1 — Complete architecture setup | ✅ Complete | Full skeleton, `npx tsc --noEmit` clean |
| 2 — Automate `@now` scenarios | ✅ Complete | A1, A2, C2 — `npx tsc --noEmit` clean |
| 3 — Harden and wire CI | Not started | Auth reuse, visual snapshots, CI pipeline |
| 4 — Expand domain by domain | Not started | Remaining feature files, your pace |
| 5 — Cutover, retire Selenium | Not started | Archive Selenium repo |

---

## Phase 0 — Full Scenario Inventory

63 feature files total, grouped by domain below.  
**Recommended `@now` candidates are marked ✅. Everything else is `@later`.**

---

### Group A — Authentication
| # | Scenario | Feature file | Complexity | Recommended |
|---|---|---|---|---|
| A1 | Test the login function (basic) | `logintest.feature` | Low | ✅ `@now` |
| A2 | Test the login function (data-driven) | `LoginWithdata.feature` | Low | ✅ `@now` |

---

### Group B — Dashboard / Home Page
| # | Scenario | Feature file | Complexity | Recommended |
|---|---|---|---|---|
| B1 | User verifying activity filter functionality | `homePage.feature` | Low | ✅ `@now` |

---

### Group C — Quick Search
| # | Scenario | Feature file | Complexity | Recommended |
|---|---|---|---|---|
| C1 | Quick search for customer — verify name on dashboard (tc_search01) | `miscellaneous.feature` | Low | ✅ `@now` |
| C2 | Quick search for customer — verify name on customer page (tc_search02) | `miscellaneous.feature` | Low | ✅ `@now` |
| C3 | Quick search for order — verify on dashboard (tc_ordsearch01) | `miscellaneous.feature` | Low | ✅ `@now` |
| C4 | Quick search for order — verify on order page (tc_ordsearch02) | `miscellaneous.feature` | Low | ✅ `@now` |

---

### Group D — Customer Search & Filters
| # | Scenario | Feature file | Complexity | Recommended |
|---|---|---|---|---|
| D1 | Search customer by city (tc_custsearch01) | `advancedCustomerSearch.feature` | Medium | ✅ `@now` |
| D2 | Customer search default filter | `defaultFilter.feature` | Medium | `@later` |
| D3 | Activity search default filter | `defaultFilter.feature` | Medium | `@later` |
| D4 | Customer search filter functionality (multiple) | `filterorders.feature` | Medium | `@later` |
| D5 | Create customer for order | `advancedCustomerSearch.feature` | Medium | `@later` |

---

### Group E — Order Search & Filters
| # | Scenario | Feature file | Complexity | Recommended |
|---|---|---|---|---|
| E1 | Advanced order search filter (tc_advsearchord01) | `advanceOrderSearch.feature` | Medium | ✅ `@now` |
| E2 | Order search default filter | `defaultFilter.feature` | Medium | `@later` |
| E3 | Order search filter functionality (multiple scenarios) | `filterorders.feature` | Medium | `@later` |
| E4 | Guard code order filter | `guardcodefilter.feature` | Medium | `@later` |
| E5 | Online advanced order search filter | `onlineadvancedfilterordersearch.feature` | Medium | `@later` |
| E6 | Combination order search filter | `combinationorders.feature` | Medium | `@later` |

---

### Group F — Print Orders
| # | Feature file | Scenario count | Complexity | Recommended |
|---|---|---|---|---|
| F1 | `createorder.feature` | 100+ | High | `@later` |
| F2 | `print.feature` | Multiple | High | `@later` |
| F3 | `EditorAdsClass.feature` | 3 | High | `@later` |
| F4 | `classifiedadsorders.feature` | 9 | High | `@later` |
| F5 | `fixedandfreesize.feature` | 10 | High | `@later` |
| F6 | `printOrderEAN.feature` | Multiple | High | `@later` |
| F7 | `printOrderJob.feature` | Multiple | High | `@later` |
| F8 | `printpricecode.feature` | Multiple | High | `@later` |
| F9 | `PrintProductionCode.feature` | Multiple | High | `@later` |
| F10 | `wordcount.feature` | Multiple | High | `@later` |
| F11 | `revisedOrder.feature` | Multiple | High | `@later` |

---

### Group G — Online Orders
| # | Feature file | Scenario count | Complexity | Recommended |
|---|---|---|---|---|
| G1 | `onlineorder.feature` | Multiple | High | `@later` |
| G2 | `onlineoffer.feature` | 1 | Medium | `@later` |
| G3 | `onlineJob.feature` | 11 | High | `@later` |
| G4 | `onlineJobNotes.feature` | 6 | High | `@later` |

---

### Group H — Service Orders
| # | Feature file | Scenario count | Complexity | Recommended |
|---|---|---|---|---|
| H1 | `ExpiredServicePricelist.feature` | 1 | Medium | `@later` |
| H2 | `serviceInvoiceText.feature` | Multiple | Medium | `@later` |

---

### Group I — Subscription Orders
| # | Feature file | Scenario count | Complexity | Recommended |
|---|---|---|---|---|
| I1 | `subscriptionorder.feature` | Multiple | High | `@later` |
| I2 | `subscriptionField.feature` | Multiple | High | `@later` |
| I3 | `subscriptionprodorder.feature` | Multiple | High | `@later` |
| I4 | `multipleSubsOrder.feature` | 5 | High | `@later` |

---

### Group J — Campaign / Cash Register / Commission / Offer
| # | Feature file | Complexity | Recommended |
|---|---|---|---|
| J1 | `campaignorders.feature` | High | `@later` |
| J2 | `campsales.feature` | High | `@later` |
| J3 | `cashregisters.feature` | High | `@later` |
| J4 | `cashRegisterN.feature` | High | `@later` |
| J5 | `commissionorders.feature` | High | `@later` |
| J6 | `offer.feature` | Medium | `@later` |

---

### Group K — Job Notes
| # | Feature file | Scenario count | Complexity | Recommended |
|---|---|---|---|---|
| K1 | `jobNotes.feature` | 9 | High | `@later` |
| K2 | `onlineJobNotes.feature` | 6 | High | `@later` |

---

### Group L — Stock of Orders
| # | Feature file | Complexity | Recommended |
|---|---|---|---|
| L1 | `onlinestockoforders.feature` | High | `@later` |
| L2 | `printstockoforders.feature` | High | `@later` |
| L3 | `stockOfOrdersCorrCode.feature` | High | `@later` |
| L4 | `stockofordersumper.feature` | High | `@later` |

---

### Group M — Reports
| # | Feature file | Complexity | Recommended |
|---|---|---|---|
| M1 | `reports.feature` | Medium | `@later` |
| M2 | `report_offer.feature` | Medium | `@later` |
| M3 | `reports_cashregisterorders.feature` | Medium | `@later` |
| M4 | `reports_deletedOrders.feature` | Medium | `@later` |
| M5 | `reports_preliminaryorders.feature` | Medium | `@later` |
| M6 | `reports_stockoforders.feature` | Medium | `@later` |
| M7 | `reports_subscriptionorders.feature` | Medium | `@later` |

---

### Group N — Administration & Users
| # | Feature file | Complexity | Recommended |
|---|---|---|---|
| N1 | `commonusers.feature` — User management | Medium | `@later` |
| N2 | `customfields.feature` — Custom fields (19 scenarios) | High | `@later` |
| N3 | `systemOperatorOrder.feature` | High | `@later` |
| N4 | `Tags.feature` | Medium | `@later` |

---

### Group O — Misc / Utility / Cleanup
| # | Feature file | Notes | Recommended |
|---|---|---|---|
| O1 | `deletetionOfData.feature` | Data cleanup — keep as helper, not a test | `@skip` |
| O2 | `preAutomation.feature` | Setup helper — not a test | `@skip` |
| O3 | `demotest.feature` | Demo only | `@skip` |
| O4 | `csvfeaturetest.feature` | CSV test harness, not a real scenario | `@skip` |
| O5 | `testrymod.feature` | Dev/retry test | `@skip` |
| O6 | `subuserguide.feature` | Guide/documentation | `@skip` |
| O7 | `partialInvoiced.feature` | Complex | `@later` |
| O8 | `splitOrderTestcases.feature` | Complex | `@later` |

---

## Scenario Shortlist (`@now`)

> **Recommended first batch — 9 scenarios across 5 feature files.**
> These are low-to-medium complexity, cover the most fundamental flows, and require no complex order creation.

| # | Scenario | Feature file | Domain |
|---|---|---|---|
| 1 | Test the login function (basic) | `logintest.feature` | Auth |
| 2 | Test the login function (data-driven) | `LoginWithdata.feature` | Auth |
| 3 | User verifying activity filter functionality | `homePage.feature` | Dashboard |
| 4 | Quick search: find customer on dashboard (tc_search01) | `miscellaneous.feature` | Search |
| 5 | Quick search: find customer on customer page (tc_search02) | `miscellaneous.feature` | Search |
| 6 | Quick search: find order on dashboard (tc_ordsearch01) | `miscellaneous.feature` | Search |
| 7 | Quick search: find order on order page (tc_ordsearch02) | `miscellaneous.feature` | Search |
| 8 | Advanced customer search by city (tc_custsearch01) | `advancedCustomerSearch.feature` | Customer |
| 9 | Advanced order search filter (tc_advsearchord01) | `advanceOrderSearch.feature` | Orders |

> **Confirm or adjust this list before Phase 1 starts.**
> If you want to add/remove any scenario, just tell me and I'll update this list before we proceed.

---

## Backlog (`@later`)

All remaining scenarios from Groups F through N above. Migrated in Phase 4 at your own pace.

## Skip (`@skip`)

Feature files O1–O6 above: cleanup helpers, demo/dev files — not worth migrating.
