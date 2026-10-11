import { test as base, devices, type BrowserContext } from '@playwright/test';
import { WidgetPage } from './widget.page';

type AnonymousState = Awaited<ReturnType<BrowserContext['storageState']>>;

export const test = base.extend<{}, { anonymousState: AnonymousState }>({
  anonymousState: [async ({ browser }, use) => {
    const context = await browser.newContext({ ...devices['Desktop Chrome'], baseURL: 'https://uchi.ru' });
    let state: AnonymousState;
    try {
      const page = await context.newPage();
      await new WidgetPage(page).goto();
      state = await context.storageState();
    } finally {
      await context.close();
    }
    await use(state);
  }, { scope: 'worker', timeout: 90_000 }],
  storageState: async ({ anonymousState }, use) => {
    await use(anonymousState);
  },
});

export { expect } from '@playwright/test';
