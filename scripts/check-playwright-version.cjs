const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const dockerfile = readFileSync(resolve(root, 'Dockerfile'), 'utf8');
const packageVersion = manifest.devDependencies['@playwright/test'];
const imageVersion = dockerfile.match(
  /^FROM\s+mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-/m,
)?.[1];

if (!imageVersion || packageVersion !== imageVersion) {
  console.error(
    `Версии Playwright не совпадают: npm=${packageVersion}, Docker=${imageVersion ?? 'не определена'}. Обновите package.json, lock-файл и Dockerfile вместе.`,
  );
  process.exitCode = 1;
} else {
  console.log(`Версии Playwright совпадают: ${packageVersion}`);
}
