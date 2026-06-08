import { type Page, expect } from '@playwright/test';
import { BasePage } from '../base-page';
import { env } from '../../config/env';

/**
 * LoginPage — ported from Selenium's Login.java + LoginPageLocators.java
 *
 * Locators (from LoginPageLocators.java):
 *   username:  #j_username
 *   password:  #j_password
 *   submit:    #submit
 *   CA button: (//span[contains(text(),'Login with Cross-advertising username and password')]//parent::a)[2]
 */
export class LoginPage extends BasePage {
  private readonly caLoginButton = this.page.locator(
    "(//span[contains(text(),'Login with Cross-advertising username and password')]//parent::a)[2]"
  );
  private readonly usernameInput = this.page.locator('#j_username');
  private readonly passwordInput = this.page.locator('#j_password');
  private readonly submitButton  = this.page.locator('#submit');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.page.goto(`${env.baseUrl}/#/login`);
  }

  /** Clicks the "Login with Cross-advertising username and password" button only if visible */
  async clickLoginWithCAIfVisible(): Promise<void> {
    try {
      await this.caLoginButton.waitFor({ state: 'visible', timeout: 5_000 });
      await this.caLoginButton.click();
    } catch {
      // button not present — login form already visible, proceed directly
    }
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Full login flow: open → CA button if needed → fill → submit */
  async login(username: string, password: string): Promise<void> {
    await this.open();
    await this.clickLoginWithCAIfVisible();
    await this.fillCredentials(username, password);
    await this.clickSubmit();
  }

  /** Selenium asserts title === "Cross-advertising" after successful login */
  async assertLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveTitle('Cross-advertising');
  }
}
