import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { chromium, webkit } from 'playwright-core';

export const base = 'http://127.0.0.1:4173/gyros-tou-kosmou/';
export async function withPreview(run) {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort', '--base', '/gyros-tou-kosmou/'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  server.stdout.on('data', (data) => { output += data; });
  server.stderr.on('data', (data) => { output += data; });
  let browser;
  try {
    for (let attempt = 0; ; attempt++) {
      if (server.exitCode !== null) throw new Error(output);
      if (/Local:.*4173/.test(output)) break;
      if (attempt >= 100) throw new Error(`Ο preview δεν ξεκίνησε: ${output}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = process.env.PROBE_ENGINE === 'webkit'
      ? await webkit.launch({ headless: true })
      : await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await run({ browser, context, page });
  } finally {
    await browser?.close();
    if (server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      await exited;
    }
  }
}

export async function loadedFlag(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('img.flag')].some((img) => img.complete && img.naturalWidth > 0));
}
