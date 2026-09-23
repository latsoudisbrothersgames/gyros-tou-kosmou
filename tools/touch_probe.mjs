// Πραγματικά αγγίγματα (touch) με ρυθμό παιδιού σε iPhone viewport: 3 → γαργάλημα, 6 → ζάλη, παρατεταμένο → αγκαλιά.
// Σελίδα χώρας, Συλλογή, Αυλή. Αναφορά Apollo 23.09: «3 πατήματα / 6 πατήματα δεν λειτουργούν».
import assert from 'node:assert/strict';
import { base, withPreview } from './probe_helpers.mjs';

const GAP = Number(process.env.TAP_GAP || 450);
const TICKLE = 'Χι χι, με γαργαλάς!', DIZZY = 'Ωχ, ζαλίστηκα!', HUG = 'Μια αγκαλιά για σένα!';
const wait = ms => new Promise(r => setTimeout(r, ms));

async function taps(page, locator, n) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center' })); await wait(250);
  for (let i = 0; i < n; i++) {
    const box = await locator.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    if (i < n - 1) await wait(GAP);
  }
}
async function expectBubble(page, text, where) {
  await page.getByText(text).first().waitFor({ timeout: 3000 }).catch(() => { throw new Error(`${where}: δεν εμφανίστηκε «${text}»`); });
}

await withPreview(async ({ page }) => {
  await page.goto(`${base}#/`);
  await page.evaluate(() => localStorage.setItem('geographyGame:collection:v1', JSON.stringify(['gr', 'al', 'bg', 'it', 'fr', 'de', 'es', 'pt', 'ca', 'jp'])));

  // 1) Σελίδα χώρας
  await page.goto(`${base}#/country/gr`);
  const hero = page.locator('.countryball[role="button"]').first();
  await hero.waitFor();
  await taps(page, hero, 3); await expectBubble(page, TICKLE, 'σελίδα χώρας ×3');
  await wait(1500);
  await taps(page, hero, 6); await expectBubble(page, DIZZY, 'σελίδα χώρας ×6');
  console.log(`PASS σελίδα χώρας: 3 → γαργάλημα, 6 → ζάλη (κενό ${GAP}ms, touch)`);

  // 2) Συλλογή — το 1ο πάτημα κρατά το «Ήξερες ότι…»
  await page.goto(`${base}#/`); await page.goto(`${base}#/collection`);
  const tile = page.locator('.collection__tap').first();
  await tile.waitFor();
  await taps(page, tile, 3); await expectBubble(page, TICKLE, 'Συλλογή ×3');
  await wait(1500);
  await taps(page, tile, 6); await expectBubble(page, DIZZY, 'Συλλογή ×6');
  console.log('PASS Συλλογή: 3 → γαργάλημα, 6 → ζάλη');

  // 3) Αυλή — άγγιγμα χωρίς σύρσιμο
  await page.goto(`${base}#/yard`);
  const friend = page.locator('.yard__friend').first();
  await friend.waitFor(); await wait(400);
  await taps(page, friend, 3); await expectBubble(page, TICKLE, 'Αυλή ×3');
  await wait(1500);
  await taps(page, friend, 6); await expectBubble(page, DIZZY, 'Αυλή ×6');
  await wait(2200);
  await friend.evaluate(el => el.scrollIntoView({ block: 'center' })); await wait(250);
  const box = await friend.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await wait(750); await page.mouse.up();
  await expectBubble(page, HUG, 'Αυλή παρατεταμένο');
  console.log('PASS Αυλή: 3 → γαργάλημα, 6 → ζάλη, παρατεταμένο → αγκαλιά');
  assert.ok(true);
});
