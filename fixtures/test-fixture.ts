import { test as base } from '@playwright/test';
import { env } from '../config/env';
import { LoginPage } from '../pages/auth/login-page';
import { HomePage } from '../pages/dashboard/home-page';

export type AppCredentials = {
  username: string;
  password: string;
};

type AppFixtures = {
  credentials: AppCredentials;
  loginPage: LoginPage;
  homePage: HomePage;
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
});

export { expect } from '@playwright/test';
