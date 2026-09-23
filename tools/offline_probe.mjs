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
    ['συλλογή', '/collection', '.collection'], ['αυλή', '/yard', '.yard'],
    ['ποιος είμαι', '/play/whoami?focus=jp', '.new-mode__round'],
    ['παρέλαση', '/play/parade?focus=jp', '.new-mode__round'],
    ['μεγαλύτερη', '/play/bigger?focus=jp', '.new-mode__round'],
    ['γείτονες', '/play/neighbors?focus=gr', '.new-mode__round'],
    ['ταχυδρομείο', '/play/post?focus=gr', '.new-mode__round'],
    ['παζλ', '/play/puzzle?focus=gr', '.new-mode__round'],
  ];
  for (const [name, route, selector] of screens) {
    try {
      await page.goto(`${base}#${route}`);
      await page.locator(selector).first().waitFor();
      if (route !== '/yard' && !route.startsWith('/play/neighbors') && !route.startsWith('/play/post') && !route.startsWith('/play/puzzle')) await loadedFlag(page);
      if (route === '/play/country') {
        const before = await page.locator('.question-card').getAttribute('data-question-id');
        await page.locator('.choice').first().click();
        // Η επόμενη ερώτηση έρχεται με το κουμπί «Επόμενη Ερώτηση» (ή Enter), όχι αυτόματα.
        await page.locator('button:has-text("Επόμενη")').first().click();
        await page.waitForFunction((previous) => document.querySelector('.question-card')?.dataset.questionId !== previous && document.querySelectorAll('.choice:not(:disabled)').length === 4, before);
      }
      if (route.startsWith('/play/whoami') || route.startsWith('/play/parade') || route.startsWith('/play/bigger')) {
        const before = await page.locator('.new-mode__round').getAttribute('data-round');
        if (route.startsWith('/play/parade')) {
          // Ενεργοποίηση με πληκτρολόγιο: ο έλεγχος εδώ αφορά τη λειτουργία offline.
          await page.locator('[data-choice="jp"]').focus();
          await page.keyboard.press('Enter');
        } else await page.locator('.new-mode__choice').first().click();
        await page.waitForFunction(() => document.querySelector('.new-mode__round')?.dataset.answered === 'true');
        assert.ok(await page.locator('.new-mode__round image').count() > 0);
        if (!route.startsWith('/play/parade')) await page.getByRole('button', { name: /Επόμενη ερώτηση/ }).click();
        await page.waitForFunction(previous => document.querySelector('.new-mode__round')?.dataset.round !== previous, before);
        await page.reload();
        await page.locator('.new-mode__round').waitFor();
      }
      if (route.startsWith('/play/neighbors')) {
        await page.locator('.neighbors__guest').first().click();
        assert.equal(await page.locator('.neighbors__guest[aria-pressed="true"]').count(), 1);
      }
      if (route.startsWith('/play/post')) {
        await page.locator('.post__nearby button').first().click();
        assert.ok((await page.locator('.post__route').innerText()).includes('→') || await page.locator('.post__ticket-choice').count() > 0);
      }
      if (route.startsWith('/play/puzzle')) {
        const piece = page.locator('.puzzle__piece').first();
        await piece.waitFor();
        await piece.scrollIntoViewIfNeeded();
        const box = await piece.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2, { steps: 3 });
        await page.mouse.up();
        assert.match(await page.locator('.new-mode__round').innerText(), /Λάθος αποθέσεις: 1/);
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
