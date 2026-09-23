import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { base, withPreview } from './probe_helpers.mjs';

mkdirSync('tools/shots', { recursive: true });
execFileSync('node', ['tools/accessory_grid.mjs'], { stdio: 'inherit' });
await withPreview(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve('tools/accessories-grid.html')).href);
  assert.equal(await page.locator('[data-accessory]').count(), 60);
  assert.equal(await page.locator('.cell').count(), 60);
  await page.screenshot({ path: 'tools/shots/balls-accessories-grid.png', fullPage: true });

  await page.goto(base);
  await page.evaluate(() => localStorage.setItem('geographyGame:collection:v1', JSON.stringify(['gr','al','bg','it','fr','de','es','pt','ca','jp','br','mx'])));
  await page.goto(`${base}#/yard`);
  await page.locator('.yard__friend').first().waitFor();
  assert.equal(await page.locator('.yard__friend').count(), 8);
  assert.equal(await page.locator('.yard__friend .countryball__svg').first().getAttribute('width'), '70');
  await page.screenshot({ path: 'tools/shots/balls-yard-initial.png', fullPage: true });

  const ids = () => page.locator('.yard__friend .countryball').evaluateAll(els => els.map(el => el.dataset.iso2));
  const before = await ids();
  await page.getByRole('button', { name: 'Κάλεσε φίλους' }).click();
  assert.notDeepEqual(new Set(await ids()), new Set(before));
  assert.equal((await ids()).length, 8);
  await page.screenshot({ path: 'tools/shots/balls-yard-friends.png', fullPage: true });

  // Empty stage tap changes eye direction and sends the nearest friend to the point.
  const stage = page.locator('.yard__stage');
  const box = await stage.boundingBox();
  await page.waitForFunction(() => [...document.querySelectorAll('.yard__friend')].every(el => el.style.transform));
  const target = { x: box.x + box.width / 2, y: box.y + box.height - 30 };
  const beforeCenters = await page.locator('.yard__friend').evaluateAll(els => els.map(el => {
    const r = el.getBoundingClientRect(); return { x: r.x + 35, y: r.y + 35 };
  }));
  const nearest = beforeCenters.map(p => Math.hypot(p.x - target.x, p.y - target.y)).indexOf(
    Math.min(...beforeCenters.map(p => Math.hypot(p.x - target.x, p.y - target.y))));
  const beforeDistance = Math.hypot(beforeCenters[nearest].x - target.x, beforeCenters[nearest].y - target.y);
  await stage.dispatchEvent('pointerdown', { clientX: target.x, clientY: target.y, bubbles: true });
  await page.waitForTimeout(650);
  assert.ok(await page.locator('.yard__friend .countryball').evaluateAll(els => els.some(el => el.style.getPropertyValue('--cb-look-y') !== '')));
  const moved = await page.locator('.yard__friend').nth(nearest).boundingBox();
  assert.ok(Math.hypot(moved.x + 35 - target.x, moved.y + 35 - target.y) < beforeDistance - 15);
  await page.screenshot({ path: 'tools/shots/balls-yard-run.png', fullPage: true });

  // Restore the first eight, which include the adjacent Greece–Albania pair.
  await page.reload();
  const own = await ids();
  assert.ok(own.includes('gr') && own.includes('al'));
  const gr = page.locator('.yard__friend').filter({ has: page.locator('.countryball[data-iso2="gr"]') });
  const al = page.locator('.yard__friend').filter({ has: page.locator('.countryball[data-iso2="al"]') });
  const a = await al.boundingBox(), g = await gr.boundingBox();
  await page.mouse.move(a.x + 35, a.y + 35); await page.mouse.down();
  await page.mouse.move(g.x + 35, g.y + 35, { steps: 10 }); await page.mouse.up();
  await gr.locator('.countryball--surprised').waitFor();
  await al.locator('.countryball--surprised').waitFor();
  await page.getByText('Γεια σου γείτονα!').first().waitFor();
  await gr.locator('.countryball--giggle').waitFor();
  await al.locator('.countryball--giggle').waitFor();
  await page.screenshot({ path: 'tools/shots/balls-yard-neighbors.png', fullPage: true });
  await page.getByLabel('Ρυθμίσεις παιχνιδιού').click();
  await page.getByLabel('Λιγότερη κίνηση', { exact: true }).check();
  await page.locator('.yard__stage--still').waitFor();
  await page.screenshot({ path: 'tools/shots/balls-yard-reduced.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS fix round accessory grid and yard interactions');
});
