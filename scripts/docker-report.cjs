const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');

const server = spawn(process.execPath, [
  require.resolve('@playwright/test/cli'),
  'show-report',
  '--host', '0.0.0.0',
  ...process.argv.slice(2),
], { stdio: ['inherit', 'pipe', 'inherit'] });

// Показываем адрес опубликованного порта после готовности сервера.
createInterface({ input: server.stdout }).on('line', (line) => {
  console.log(line.replace(
    /Serving HTML report at http:\/\/0\.0\.0\.0:(\d+)\. Press Ctrl\+C to quit\./,
    'Отчёт доступен по адресу http://127.0.0.1:$1. Для остановки нажмите Ctrl+C.',
  ));
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}

server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.on('close', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 143);
});
