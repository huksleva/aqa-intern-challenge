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
    // На странице выбора входа есть виджет, а на новой главной его нет.
    await page.goto('/signin/main', { waitUntil: 'domcontentloaded' });
  });

  test('opens', async ({ page }, testInfo) => {
    await widgetPage.openWidget();

    await expect(widgetPage.body).toBeVisible();
    await expect(widgetPage.title).toHaveText('База знаний Учи.ру');
    await expect(widgetPage.body.getByText('Как написать в службу поддержки?', { exact: true })).toBeVisible();
    await testInfo.attach('widget-open', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  test('has correct title', async ({ page }, testInfo) => {
    await widgetPage.openWidget();
    await widgetPage.openArticle('Как написать в службу поддержки?');
    await widgetPage.clickWriteToUs();

    await expect(widgetPage.title).toHaveText('Связь с поддержкой');
    await expect(widgetPage.body.locator('textarea')).toBeVisible();
    await testInfo.attach('contact-support', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });

  test('closes and reopens', async () => {
    await widgetPage.openWidget();
    await expect(widgetPage.body).toBeVisible();
    await expect(widgetPage.title).toHaveText('База знаний Учи.ру');

    await widgetPage.closeWidget();
    await expect(widgetPage.body).toBeHidden();
    await expect(widgetPage.openButton).toBeVisible();

    await widgetPage.openWidget();
    await expect(widgetPage.body).toBeVisible();
    await expect(widgetPage.title).toHaveText('База знаний Учи.ру');
  });
});
