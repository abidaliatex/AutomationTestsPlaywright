import { test as base } from '@playwright/test';
import { env } from '../config/env';
import { LoginPage } from '../pages/auth/login-page';
import { HomePage } from '../pages/dashboard/home-page';
import { CustomerPage } from '../pages/customer/customer-page';
import { PrintOrderPage } from '../pages/orders/print-order-page';

export type AppCredentials = {
  username: string;
  password: string;
};

type AppFixtures = {
  credentials: AppCredentials;
  loginPage: LoginPage;
  homePage: HomePage;
  customerPage: CustomerPage;
  printOrderPage: PrintOrderPage;
};

export const test = base.extend<AppFixtures>({
  credentials: async ({}, use) => {
    await use({
      username: env.username,
      password: env.password,
    });
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  customerPage: async ({ page }, use) => {
    await use(new CustomerPage(page));
  },
  printOrderPage: async ({ page }, use) => {
    await use(new PrintOrderPage(page));
  },
});

export { expect } from '@playwright/test';
