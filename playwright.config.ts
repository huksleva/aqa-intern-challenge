import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: 0,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', {
      open: process.env.CI ? 'never' : 'always',
      // Явный IPv4: localhost может разрешаться в недоступный на Windows ::1.
      host: '127.0.0.1',
      port: 9323,
    }],
  ],
  use: {
    baseURL: 'https://uchi.ru',
    actionTimeout: 30_000,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
