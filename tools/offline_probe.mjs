import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { base, loadedFlag, withPreview } from './probe_helpers.mjs';

await withPreview(async ({ context, page }) => {
  const errors = [];
  const failures = [];
  const external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(base)) external.push(request.url());
  });
  await page.goto(base);
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  const assets = readdirSync('dist/assets', { recursive: true }).filter((name) => /\.[^/]+$/.test(name));
  await page.waitForFunction(async (expected) => {
    const names = await caches.keys();
    const keys = (await Promise.all(names.map(async (name) => (await caches.open(name)).keys()))).flat();
    const paths = new Set(keys.map((key) => new URL(key.url).pathname));
    return Boolean(navigator.serviceWorker.controller) && keys.length >= expected.length && expected.every((name) => paths.has(`/gyros-tou-kosmou/assets/${name}`));
  }, assets);
  console.log(`PASS precache: και τα ${assets.length} αρχεία dist/assets`);
  await context.setOffline(true);
  await page.reload();
  const screens = [
    ['αρχική', '/', '.home'], ['παιχνίδια', '/games', '.games__grid'],
    ['κουίζ', '/play/country', '.question-card'], ['χάρτης', '/map', '.worldmap'],
    ['εγκυκλοπαίδεια', '/encyclopedia', '.encyclopedia'], ['Ελλάδα', '/country/gr', '.atlas'],
    ['συλλογή', '/collection', '.collection'],
  ];
  for (const [name, route, selector] of screens) {
    try {
      await page.goto(`${base}#${route}`);
      await page.locator(selector).first().waitFor();
      await loadedFlag(page);
      if (route === '/play/country') {
        const before = await page.locator('.question-card').getAttribute('data-question-id');
        await page.locator('.choice').first().click();
        await page.waitForFunction((previous) => document.querySelector('.question-card')?.dataset.questionId !== previous && document.querySelectorAll('.choice:not(:disabled)').length === 4, before);
      }
      if (route === '/map') await page.locator('.worldmap__country').first().waitFor();
      assert.deepEqual(errors, []);
      assert.deepEqual(failures, []);
      assert.deepEqual(external, []);
      console.log(`PASS ${name}: σημαία, χωρίς δίκτυο, χωρίς σφάλματα`);
    } catch (error) {
      console.error(`FAIL ${name}`, { errors, failures, external });
      throw error;
    }
  }
});
