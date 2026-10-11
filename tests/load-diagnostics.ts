import type { Page, Request, Response } from '@playwright/test';

function safeUrl(value: string) {
  const url = new URL(value);
  if (url.origin === 'null')
    return url.protocol === 'about:' ? url.protocol + url.pathname : url.protocol;
  return `${url.origin}${url.pathname}`;
}

type RequestDetails = { url: string; resourceType: string; elapsedMs: number };

export class LoadDiagnostics {
  private readonly started = Date.now();
  private readonly pending = new Map<Request, RequestDetails>();
  private readonly failures: (RequestDetails & { error: string })[] = [];
  private document: { url: string; status: number | null } | null = null;

  constructor(private readonly page: Page) {
    page.on('request', this.onRequest);
    page.on('response', this.onResponse);
    page.on('requestfailed', this.onFailed);
    page.on('requestfinished', this.onFinished);
  }

  private relevant(request: Request) {
    return ['document', 'script', 'xhr', 'fetch'].includes(request.resourceType());
  }

  private details(request: Request): RequestDetails {
    return {
      url: safeUrl(request.url()),
      resourceType: request.resourceType(),
      elapsedMs: Date.now() - this.started,
    };
  }

  private onRequest = (request: Request) => {
    if (!this.relevant(request)) return;
    if (request.isNavigationRequest() && request.frame() === this.page.mainFrame()) {
      this.document = { url: safeUrl(request.url()), status: null };
    }
    if (this.pending.size === 100) this.pending.delete(this.pending.keys().next().value!);
    this.pending.set(request, this.details(request));
  };

  private onResponse = (response: Response) => {
    const request = response.request();
    if (!this.relevant(request)) return;
    if (request.isNavigationRequest() && response.frame() === this.page.mainFrame()) {
      this.document = { url: safeUrl(response.url()), status: response.status() };
    }
    // HTTP 4xx/5xx не вызывают requestfailed, поэтому учитываем их отдельно.
    if (response.status() >= 400) this.recordFailure(request, `HTTP ${response.status()}`);
  };

  private recordFailure(request: Request, error: string) {
    if (this.failures.length === 20) this.failures.shift();
    this.failures.push({ ...this.details(request), error });
  }

  private onFailed = (request: Request) => {
    this.pending.delete(request);
    if (this.relevant(request)) {
      this.recordFailure(request, request.failure()?.errorText ?? 'Неизвестная сетевая ошибка');
    }
  };

  private onFinished = (request: Request) => {
    this.pending.delete(request);
  };

  report() {
    return JSON.stringify(
      {
        pageUrl: safeUrl(this.page.url()),
        mainDocument: this.document,
        elapsedMs: Date.now() - this.started,
        failures: this.failures,
        pendingRequests: [...this.pending.values()].slice(-20).map((request) => ({
          ...request,
          waitingMs: Date.now() - this.started - request.elapsedMs,
        })),
        note: 'Показаны последние 20 ошибок и незавершённых запросов document/script/xhr/fetch. net::ERR_ABORTED может быть следствием повторной загрузки страницы. Query-параметры, заголовки и тела запросов не сохраняются.',
      },
      null,
      2,
    );
  }

  dispose() {
    this.page.off('request', this.onRequest);
    this.page.off('response', this.onResponse);
    this.page.off('requestfailed', this.onFailed);
    this.page.off('requestfinished', this.onFinished);
  }
}
