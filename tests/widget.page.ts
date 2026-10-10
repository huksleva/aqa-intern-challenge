import { type Locator, type Page } from '@playwright/test';

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
