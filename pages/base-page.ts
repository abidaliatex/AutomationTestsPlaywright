import { type Locator, type Page } from '@playwright/test';
import { Action } from '../utils/action';

export class BasePage {
  protected readonly page: Page;
  protected readonly act: Action;

  constructor(page: Page) {
    this.page = page;
    this.act = new Action(page);
  }

  async goto(path = ''): Promise<void> {
    await this.page.goto(path);
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }
}
