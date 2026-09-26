import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { base, withPreview } from './probe_helpers.mjs';

// Λύσεις από την ίδια makeNeighborhoodPuzzle και την ίδια γεωμετρία του παιχνιδιού.
const source = `
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-50m.json' with { type: 'json' };
import { getCountryByIsoNumeric } from './src/data/countries.ts';
import { makeNeighborhoodPuzzle } from './src/game/neighborhoodPuzzles.ts';
const countries = feature(atlas, atlas.objects.countries).features.map(f => ({
  feature: f, isoNumeric: String(f.id), iso2: getCountryByIsoNumeric(String(f.id))?.iso2,
}));
const puzzle = makeNeighborhoodPuzzle(process.argv[1], process.argv[2], JSON.parse(process.argv[3]), {
  raw: atlas, countries, availableIso2: new Set(countries.map(c => c.iso2).filter(Boolean)),
}, Number(process.argv[4]));
console.log(JSON.stringify(puzzle?.pieces.map(({ id, x, y, width, height }) => ({ id, x, y, width, height })) ?? null));`;
const data = JSON.parse(execFileSync(process.execPath, ['--import', './scripts/register_ts.mjs', '--input-type=module', '-e',
  "import {ALL_COUNTRIES} from './src/data/countries.ts'; import {BORDERS} from './src/data/borders.ts'; import {SPECIAL_BORDERS} from './src/data/borderOverrides.ts'; console.log(JSON.stringify({countries:ALL_COUNTRIES,borders:BORDERS,special:SPECIAL_BORDERS}))"], { encoding: 'utf8' }));
const byName = new Map(data.countries.map(c => [c.nameGreek, c.iso2]));
const special = new Set(data.special.map(e => [e.a, e.b].sort().join('-')));
const solution = (host, difficulty, revealed, seed) => JSON.parse(execFileSync(process.execPath,
  ['--import', './scripts/register_ts.mjs', '--input-type=module', '-e', source, host, difficulty, JSON.stringify(revealed), String(seed)],
  { encoding: 'utf8' }));

mkdirSync('tools/shots', { recursive: true });
await withPreview(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}#/games`);
  assert.match(await page.getByRole('link', { name: /Οι γείτονες χτυπούν την πόρτα/ }).innerText(), /Φτιάξε τη γειτονιά/);
  for (const [difficulty, host] of [['easy', 'gr'], ['medium', 'gr'], ['hard', 'cn']]) {
    for (let round = 0; round < 3; round++) {
      await page.goto(`${base}#/`);
      await page.goto(`${base}#/play/neighbors?difficulty=${difficulty}&focus=${host}&run=${round}`);
      await page.evaluate(reducedMotion => localStorage.setItem('geographyGame:settings:v1', JSON.stringify({
        soundEnabled: false, reducedMotion, hapticsEnabled: false, lastDifficulty: 'easy', lastPlayerName: '',
      })), round === 2);
      await page.reload();
      const root = page.locator('.new-mode__round');
      await root.waitFor();
      assert.equal(await root.getAttribute('data-answered'), 'false');
      assert.equal(await root.locator('.neighbors__badge').innerText(), '🧩 Μετά: Φτιάξε τη γειτονιά');
      assert.equal(await root.locator('.neighborhood__piece, [data-target], [data-correct]').count(), 0);
      assert.equal(await root.getByRole('button', { name: 'Φτιάξε τη γειτονιά' }).count(), 0);
      assert.equal(await root.locator('[data-accessory]').count(), 0);
      if (round === 0) await page.screenshot({ path: `tools/shots/geitonia-${difficulty}-cue.png` });
      const guestNames = await root.locator('.neighbors__guest > span').allInnerTexts();
      const guests = guestNames.map(name => byName.get(name));
      assert.ok(guests.every(Boolean));
      const correct = guests.filter(id => data.borders[host].includes(id) && !special.has([host, id].sort().join('-')));
      for (const id of correct) await root.locator('.neighbors__guest').nth(guests.indexOf(id)).click();
      await root.getByRole('button', { name: 'Άνοιξε την πόρτα' }).click();
      await root.getByRole('button', { name: 'Φτιάξε τη γειτονιά' }).waitFor();
      const stageButton = root.getByRole('button', { name: 'Φτιάξε τη γειτονιά' });
      const nextButton = root.getByRole('button', { name: 'Επόμενη ερώτηση →' });
      assert.match(await stageButton.getAttribute('class'), /\bbtn--primary\b/);
      assert.match(await nextButton.getAttribute('class'), /\bbtn--secondary\b/);
      assert.ok(await stageButton.evaluate((button, next) => Boolean(button.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING), await nextButton.elementHandle()));
      if (round === 0) await page.screenshot({ path: `tools/shots/geitonia-${difficulty}-choice.png` });
      const stageOneScore = await page.locator('.score-display__value').first().innerText();
      const stageOneStreak = await page.locator('.score-display__value').last().innerText();
      const collection = await page.evaluate(() => localStorage.getItem('geographyGame:collection:v1'));
      const revealed = data.borders[host].filter(id => !special.has([host, id].sort().join('-')));
      const pieces = solution(host, difficulty, revealed, 0);
      assert.ok(pieces && pieces.length >= 3, `${difficulty}/${round}: δεν βρέθηκαν κομμάτια`);
      const preview = await root.locator('.neighborhood__preview').innerText();
      for (const piece of pieces) assert.ok(preview.includes(data.countries.find(c => c.iso2 === piece.id).nameGreek));
      await root.getByRole('button', { name: 'Φτιάξε τη γειτονιά' }).click();
      const svg = root.locator('svg.neighborhood__stage');
      await svg.waitFor();
      await svg.evaluate(el => el.scrollIntoView({ block: 'center' }));
      assert.equal(await root.locator('[data-target], [data-correct]').count(), 0);
      assert.equal(await root.locator('.neighborhood__glow').count(), 0);
      const trayTransforms = await root.locator('.neighborhood__piece').evaluateAll(nodes => nodes.map(n => n.getAttribute('transform')));
      assert.ok(trayTransforms.every(t => Number(t.match(/translate\([^ ]+ ([^)]+)/)?.[1]) >= 302));
      if (round === 0) await page.screenshot({ path: `tools/shots/geitonia-${difficulty}-before.png` });
      const dragTo = async (id, x, y) => {
        const name = data.countries.find(c => c.iso2 === id).nameGreek;
        const piece = root.locator(`.neighborhood__piece[aria-label="${name}"] rect`);
        const from = await piece.boundingBox();
        const to = await svg.evaluate((element, point) => {
          const p = element.createSVGPoint(); p.x = point.x; p.y = point.y;
          const screen = p.matrixTransform(element.getScreenCTM());
          return { x: screen.x, y: screen.y };
        }, { x, y });
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(to.x, to.y, { steps: 8 });
        await page.mouse.up();
      };
      await dragTo(pieces[0].id, 30, 540); // Σκόπιμα λάθος στον δίσκο.
      assert.equal(await root.locator('.neighborhood__piece--placed').count(), 0);
      if (round === 1) await page.screenshot({ path: `tools/shots/geitonia-${difficulty}-wrong.png` });
      for (const piece of pieces) {
        await svg.evaluate(el => el.scrollIntoView({ block: 'center' }));
        await dragTo(piece.id, piece.x + piece.width / 2, piece.y + piece.height / 2);
      }
      assert.equal(await root.locator('.neighborhood__piece--placed').count(), pieces.length);
      assert.match(await root.innerText(), /Γειτονιές που έφτιαξες:/);
      assert.equal(await page.locator('.score-display__value').last().innerText(), stageOneStreak);
      assert.notEqual(await page.locator('.score-display__value').first().innerText(), stageOneScore);
      assert.equal(await page.evaluate(() => localStorage.getItem('geographyGame:collection:v1')), collection);
      if (round === 2) assert.equal(await svg.getAttribute('class'), 'neighborhood__stage neighborhood__stage--still');
      await page.screenshot({ path: `tools/shots/geitonia-${difficulty}-${round === 2 ? 'reduced' : 'after-' + round}.png` });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS geitonia: 3 γύροι ανά δυσκολία, λάθος απόθεση, reduced motion, μπόνους και screenshots 390×844');
});
