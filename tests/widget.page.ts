import { errors, test, type Locator, type Page } from '@playwright/test';

export class WidgetPage {
  readonly openButton: Locator;
  readonly body: Locator;
  readonly title: Locator;
  private readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.openButton = page.locator('[data-test="openWidget"]');
    this.body = page.locator('[class^="widgetWrapper__"] > [class^="widget__"]');
    this.title = this.body.getByRole('heading', { level: 5 });
    // На десктопе кнопка data-test="button_close" в заголовке скрыта.
    this.closeButton = page.locator('[class^="widgetWrapper__"] > button[class^="closeBtn__"]');
  }

  async goto() {
    // Повторяем только загрузку страницы; проверки сценария не перезапускаются.
    for (let attempt = 1; attempt <= 3; attempt++) {
      // Убираем предыдущую страницу вместе с её отложенными перенаправлениями.
      await this.page.goto('about:blank', { waitUntil: 'commit', timeout: 5_000 });
      const started = Date.now();
      try {
        await test.step(`Загрузка страницы: попытка ${attempt} из 3`, async () => {
          // commit не ждёт сторонние скрипты. Готовность определяет кнопка виджета.
          await this.page.goto('/signin/main', { waitUntil: 'commit', timeout: 10_000 });
          await this.openButton.waitFor({
            state: 'visible',
            timeout: Math.max(1, 20_000 - (Date.now() - started)),
          });
        });
        return;
      } catch (error) {
        const interrupted =
          error instanceof Error && error.message.includes('is interrupted by another navigation');
        if ((!(error instanceof errors.TimeoutError) && !interrupted) || attempt === 3) throw error;
        // Новая навигация отменит зависшие запросы предыдущей загрузки.
      }
    }
  }

  async openWidget() {
    // Скрипт виджета загружается отдельно с CDN.
    await this.openButton.click({ timeout: 60_000 });
  }

  async openArticle(title: string) {
    await this.body
      .getByTestId('article-list-item')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .click();
  }

  async clickWriteToUs() {
    await this.body.getByRole('button', { name: /^написать нам$/i }).click();
  }

  async closeWidget() {
    await this.closeButton.click();
  }
}
