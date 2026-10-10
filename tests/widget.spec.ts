import { test, expect } from '@playwright/test';
import { WidgetPage } from './widget.page';

test.describe('Uchi.ru widget', () => {
  let widgetPage: WidgetPage;

  test.beforeEach(async ({ page }) => {
    const cookieBanner = page.locator('._UCHI_COOKIE__wrap.show').filter({ visible: true });
    // Баннер может появиться после загрузки страницы и перекрыть кнопку виджета.
    await page.addLocatorHandler(cookieBanner, async banner => {
      await banner.getByText('принять', { exact: true }).click();
    });

    widgetPage = new WidgetPage(page);
    await test.step('Открыть страницу выбора входа', async () => {
      // На странице выбора входа есть виджет, а на новой главной его нет.
      await page.goto('/signin/main', { waitUntil: 'domcontentloaded' });
    });
  });

  test('opens', async ({ page }, testInfo) => {
    await test.step('Открыть виджет и проверить базу знаний', async () => {
      await widgetPage.openWidget();
      await expect(widgetPage.body).toBeVisible();
      await expect(widgetPage.title).toHaveText('База знаний Учи.ру');
      await expect(widgetPage.body.getByText('Как написать в службу поддержки?', { exact: true })).toBeVisible();
      await testInfo.attach('widget-open', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    });
  });

  test('has correct title', async ({ page }, testInfo) => {
    await test.step('Открыть виджет', async () => {
      await widgetPage.openWidget();
      await expect(widgetPage.body).toBeVisible();
    });

    await test.step('Открыть статью о службе поддержки', async () => {
      await widgetPage.openArticle('Как написать в службу поддержки?');
    });

    await test.step('Перейти к форме и проверить заголовок', async () => {
      await widgetPage.clickWriteToUs();
      await expect(widgetPage.title).toHaveText('Связь с поддержкой');
      await expect(widgetPage.body.locator('textarea')).toBeVisible();
      await testInfo.attach('contact-support', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    });
  });

  test('closes and reopens', async () => {
    await test.step('Открыть виджет и проверить заголовок', async () => {
      await widgetPage.openWidget();
      await expect(widgetPage.body).toBeVisible();
      await expect(widgetPage.title).toHaveText('База знаний Учи.ру');
    });

    await test.step('Закрыть виджет и проверить кнопку открытия', async () => {
      await widgetPage.closeWidget();
      await expect(widgetPage.body).toBeHidden();
      await expect(widgetPage.openButton).toBeVisible();
    });

    await test.step('Повторно открыть виджет и проверить базу знаний', async () => {
      await widgetPage.openWidget();
      await expect(widgetPage.body).toBeVisible();
      await expect(widgetPage.title).toHaveText('База знаний Учи.ру');
    });
  });
});
