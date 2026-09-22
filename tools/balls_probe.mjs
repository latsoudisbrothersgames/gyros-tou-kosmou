import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { base, withPreview } from './probe_helpers.mjs';

mkdirSync('tools/shots', { recursive: true });
await withPreview(async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}#/play/country?focus=gr`);
  const shot = async (name) => page.screenshot({ path: `tools/shots/balls-${name}.png`, fullPage: true });
  // Χρησιμοποιούμε το δημόσιο focus της μηχανής για τη γνωστή πρώτη απάντηση.
  await page.locator('.choice[data-choice-id="gr"]').click();
  await page.locator('.choice[data-choice-id="gr"] .countryball--celebrate').waitFor();
  await shot('quiz-correct');
  console.log('PASS σωστή απάντηση → celebrate');
  await page.getByRole('button', { name: 'Επόμενη Ερώτηση →' }).click();

  // Το SVG σημαίας στην ερώτηση είναι ίδιο με το SVG της σωστής μπάλας.
  async function correctId() {
    await page.waitForFunction(() => document.querySelectorAll('.choice:not(:disabled)').length === 4);
    return page.evaluate(() => {
      // Οι μπάλες κρύβονται μέχρι την απάντηση (22.09.2026), άρα η σωστή επιλογή βρίσκεται από το iso2
      // του αρχείου σημαίας της ερώτησης (π.χ. /assets/gr-AbC12345.svg → «gr»), όχι από τις μπάλες.
      const flag = document.querySelector('.question-card__flag');
      // Μικρές σημαίες γίνονται inline data: URI από το Vite (id='flag-icons-xx'), μεγάλες μένουν αρχεία (/assets/xx-hash.svg).
      const src = decodeURIComponent(flag?.getAttribute('src') ?? '');
      const match = /flag-icons-([a-z]{2}(?:-[a-z0-9]+)?)'/.exec(src) ?? /\/([a-z]{2}(?:-[a-z0-9]+)?)-[A-Za-z0-9_-]{6,}\.svg$/.exec(src);
      const choice = match ? document.querySelector(`.choice[data-choice-id="${match[1]}"]`) : null;
      if (!choice) throw new Error('Δεν βρέθηκε η σωστή σημαία στο DOM');
      return choice.getAttribute('data-choice-id');
    });
  }
  const correct = await correctId();
  const wrongChoice = page.locator(`.choice:not([data-choice-id="${correct}"])`).first();
  const wrong = await wrongChoice.getAttribute('data-choice-id');
  await wrongChoice.click();
  await page.locator(`.choice[data-choice-id="${wrong}"] .countryball--shrug`).waitFor();
  // Οι μπάλες εκτός οθόνης μένουν στατικές μέχρι να εμφανιστούν.
  await page.locator(`.choice[data-choice-id="${correct}"]`).scrollIntoViewIfNeeded();
  await page.locator(`.choice[data-choice-id="${correct}"] .countryball--wave`).waitFor();
  await shot('quiz-wrong');
  console.log('PASS λάθος επιλογή → shrug, σωστή χώρα → wave');
  await page.getByRole('button', { name: 'Επόμενη Ερώτηση →' }).click();

  for (let index = 2; index < 10; index++) {
    const id = await correctId();
    await page.locator(`.choice[data-choice-id="${id}"]`).click();
    if (index === 4) {
      await page.locator(`.choice[data-choice-id="${id}"] .countryball--dance`).waitFor();
      console.log('PASS σερί 3 → dance');
    }
    await page.getByRole('button', { name: 'Επόμενη Ερώτηση →' }).click();
  }
  await page.locator('.game-results').waitFor();
  await page.locator('.game-results__parade').scrollIntoViewIfNeeded();
  await page.locator('.game-results__parade .countryball--dance').first().waitFor();
  await shot('results');
  console.log('PASS πλήρης συνεδρία και παρέλαση αποτελεσμάτων');

  await page.goto(`${base}#/country/gr`);
  await page.locator('.atlas__ball').scrollIntoViewIfNeeded();
  await page.locator('.atlas .speech-bubble').filter({ hasText: 'Γεια!' }).waitFor();
  await shot('country');
  await page.locator('.atlas .speech-bubble').filter({ hasText: 'Ήξερες ότι…' }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.atlas .speech-bubble'));
  console.log('PASS Γεια! → quick fact → εξαφάνιση');

  await page.goto(`${base}#/collection`);
  await page.locator('.collection__tap .countryball[data-iso2="gr"]').click();
  await page.locator('.collection .speech-bubble').filter({ hasText: 'Ήξερες ότι…' }).waitFor();
  console.log('PASS πάτημα συλλογής → στοιχείο εγκυκλοπαίδειας');

  // Έλεγχος ρυθμίσεων, ορίου και ματιών με γεμάτη συλλογή σε καθαρό context.
  await page.evaluate(() => {
    localStorage.setItem('geographyGame:collection:v1', JSON.stringify(['gr','jp','br','ca','ke','fr','it','us','au','in','za','mx','se','de','es','pt','ar','cn','ru','eg']));
  });
  await page.reload();
  await page.locator('.countryball[data-live="true"]').first().waitFor();
  assert.ok(await page.locator('.countryball[data-live="true"]').count() <= 8);
  await page.mouse.move(350, 600);
  await page.waitForFunction(() => [...document.querySelectorAll('.countryball[data-live="true"]')].some((ball) => Math.abs(parseFloat(ball.style.getPropertyValue('--cb-look-x'))) > 0));
  await page.getByLabel('Ρυθμίσεις παιχνιδιού').click();
  await page.getByLabel('Λιγότερη κίνηση', { exact: true }).check();
  await page.waitForFunction(() => [...document.querySelectorAll('.countryball')].every((ball) => ball.dataset.motion === 'reduced'));
  await page.getByLabel('Δονήσεις', { exact: true }).uncheck();
  await page.reload();
  await page.getByLabel('Ρυθμίσεις παιχνιδιού').click();
  assert.equal(await page.getByLabel('Λιγότερη κίνηση', { exact: true }).isChecked(), true);
  assert.equal(await page.getByLabel('Δονήσεις', { exact: true }).isChecked(), false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.countryball').first().evaluate((ball) => getComputedStyle(ball).animationName), 'none');
  assert.deepEqual(errors, []);
  console.log('PASS μάτια, όριο 8, αποθήκευση ρυθμίσεων, χωρίς pageerror');
});
