import { test as base, devices, type BrowserContext } from '@playwright/test';
import { WidgetPage } from './widget.page';
import { LoadDiagnostics } from './load-diagnostics';

type AnonymousState = Awaited<ReturnType<BrowserContext['storageState']>>;

export const test = base.extend<{}, { anonymousState: AnonymousState }>({
  anonymousState: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        ...devices['Desktop Chrome'],
        baseURL: 'https://uchi.ru',
      });
      let state: AnonymousState;
      let diagnostics: LoadDiagnostics | undefined;
      try {
        const page = await context.newPage();
        diagnostics = new LoadDiagnostics(page);
        await new WidgetPage(page).goto();
        state = await context.storageState();
      } catch (error) {
        if (diagnostics) {
          const body = diagnostics.report();
          await base.step('Диагностика загрузки анонимной сессии', async (step) => {
            await step.attach('anonymous-session-load-diagnostics', {
              body,
              contentType: 'application/json',
            });
          });
        }
        throw error;
      } finally {
        diagnostics?.dispose();
        await context.close();
      }
      await use(state);
    },
    { scope: 'worker', timeout: 90_000 },
  ],
  storageState: async ({ anonymousState }, use) => {
    await use(anonymousState);
  },
  page: async ({ page }, use, testInfo) => {
    const diagnostics = new LoadDiagnostics(page);
    try {
      await use(page);
    } finally {
      diagnostics.dispose();
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('load-diagnostics', {
          body: diagnostics.report(),
          contentType: 'application/json',
        });
      }
    }
  },
});

export { expect } from '@playwright/test';
