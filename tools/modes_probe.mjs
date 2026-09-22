import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { base, withPreview } from './probe_helpers.mjs';

// Ανεξάρτητος οδηγός απαντήσεων: δημόσια δεδομένα και ορατές ενδείξεις, όχι κρυφή λύση στο UI.
const countries = JSON.parse(execFileSync(process.execPath, ['--import', './scripts/register_ts.mjs', '--input-type=module', '-e',
  "import { ALL_COUNTRIES } from './src/data/countries.ts'; import { mysteryHints } from './src/game/newModes.ts'; console.log(JSON.stringify(ALL_COUNTRIES.map(c => ({...c, hints: mysteryHints(c)}))))"], { encoding: 'utf8' }));
const byIso = new Map(countries.map(country => [country.iso2, country]));
mkdirSync('tools/shots', { recursive: true });

await withPreview(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('geographyGame:settings:v1', JSON.stringify({ soundEnabled: false, reducedMotion: false })));
  const round = () => page.locator('.new-mode__round');
  const shot = (name) => page.screenshot({ path: `tools/shots/mode-${name}.png`, fullPage: true, animations: 'allow' });
  async function noLeak(mode) {
    assert.equal(await round().getAttribute('data-answered'), 'false');
    assert.equal(await round().getAttribute('data-answer'), null, 'Η λύση δεν γράφεται πριν την απάντηση');
    assert.equal(await round().locator('.new-mode__choice--correct, .new-mode__choice--wrong, .bigger__value, .bigger__winner').count(), 0);
    if (mode !== 'parade') {
      // Όχι CSS κάλυμμα: πλήρης απουσία img/image από ΟΛΟ το DOM της ερώτησης.
      assert.equal(await round().locator('img, image').count(), 0, `${mode}: σημαία πριν την απάντηση`);
      assert.equal(await round().locator('.countryball[data-iso2]').count(), 0, 'Η σιλουέτα δεν εκθέτει ταυτότητα');
      assert.equal(await round().locator('.countryball--thinking').count(), mode === 'whoami' ? 1 : 2);
    } else {
      // Ρητή εξαίρεση του spec: σημαίες ναι, τα ονόματά τους ποτέ πριν το πάτημα.
      const options = await round().locator('[data-choice]').evaluateAll(nodes => nodes.map(node => ({
        text: node.textContent.trim(), label: node.getAttribute('aria-label'), title: node.getAttribute('title'),
        nestedLabels: [...node.querySelectorAll('[title], [aria-label], title, desc')].map(n => n.outerHTML),
      })));
      for (const [i, option] of options.entries()) {
        assert.equal(option.text, '');
        assert.equal(option.label, `Σημαία ${i + 1}`);
        assert.equal(option.title, null);
        assert.deepEqual(option.nestedLabels, []);
      }
      assert.equal(await round().locator('image').count(), options.length);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Οριζόντια υπερχείλιση');
    const targets = await round().locator('[data-choice]').evaluateAll(nodes => nodes.map(n => ({ w: n.offsetWidth, h: n.offsetHeight })));
    assert.ok(targets.every(t => t.w >= (mode === 'parade' ? 56 : 44) && t.h >= (mode === 'parade' ? 56 : 44)), 'Μικρός στόχος αφής');
  }
  async function hintsAnswer() {
    const seen = [];
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Δώσε μου ένδειξη/ }).click();
      const bubble = round().locator('.mystery__speaker > .speech-bubble');
      await bubble.waitFor();
      seen.push(await bubble.innerText());
      assert.ok(await bubble.evaluate(n => n.scrollHeight <= n.clientHeight && n.scrollWidth <= n.clientWidth), 'Κομμένη ένδειξη');
      await noLeak('whoami');
    }
    const ids = await round().locator('[data-choice]').evaluateAll(nodes => nodes.map(n => n.dataset.choice));
    const matches = ids.filter(id => JSON.stringify(byIso.get(id).hints) === JSON.stringify(seen));
    assert.equal(matches.length, 1, 'Οι τρεις ενδείξεις προσδιορίζουν μία επιλογή');
    return matches[0];
  }
  async function answerId(mode, index) {
    if (mode === 'whoami') return index === 0 ? 'jp' : hintsAnswer();
    if (mode === 'parade') {
      const target = (await round().locator('h1').innerText()).replace('Βρες: ', '');
      return countries.find(c => c.nameGreek === target).iso2;
    }
    const metric = await round().locator('[data-metric]').getAttribute('data-metric');
    assert.equal(metric, index % 2 === 0 ? 'population' : 'areaKm2');
    const choices = await round().locator('[data-choice]').evaluateAll(nodes => nodes.map(n => n.dataset.choice));
    return choices.sort((a, b) => byIso.get(b)[metric] - byIso.get(a)[metric])[0];
  }
  async function tapRunner(iso2) {
    // Κινούμενος στόχος: κανονική αφή, χωρίς force click ή εκτέλεση handler.
    const selector = `.parade__runner[data-choice="${iso2}"]`;
    await page.waitForFunction(sel => {
      const node = document.querySelector(sel), track = document.querySelector('.parade__track');
      if (!node || !track) return false;
      const b = node.getBoundingClientRect(), t = track.getBoundingClientRect();
      return b.left > t.left + 10 && b.right < t.right - 10 && b.bottom < innerHeight;
    }, selector);
    const box = await page.locator(selector).boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  }
  async function advance(mode, previous) {
    if (mode !== 'parade') await round().getByRole('button', { name: /Επόμενη|Αποτελέσματα/ }).click();
    await page.waitForFunction(prev => document.querySelector('.game-results') ||
      (document.querySelector('.new-mode__round')?.dataset.round !== prev && document.querySelector('.new-mode__round')?.dataset.answered === 'false'), previous);
  }

  for (const mode of ['whoami', 'parade', 'bigger']) {
    await page.goto(`${base}#/play/${mode}?focus=jp&length=10`);
    await round().waitFor();
    const won = new Set();
    for (let index = 0; index < 10; index++) {
      await noLeak(mode);
      const previous = await round().getAttribute('data-round');
      const correct = await answerId(mode, index);
      const incorrect = index === 1;
      if (!incorrect) won.add(correct);
      const choices = await round().locator('[data-choice]').evaluateAll(nodes => nodes.map(n => n.dataset.choice));
      const chosen = incorrect ? choices.find(id => id !== correct) : correct;
      if (index === 0) await shot(`${mode}-before`);
      if (mode === 'parade') await tapRunner(chosen);
      else await round().locator(`[data-choice="${chosen}"]`).click();
      await page.waitForFunction(() => document.querySelector('.new-mode__round')?.dataset.answered === 'true');
      assert.equal(await round().getAttribute('data-answer'), correct);
      if (mode === 'bigger') {
        assert.equal(await round().locator('.bigger__value').count(), 2);
        await round().locator('.countryball--proud').waitFor();
        await round().locator('.countryball--shy').waitFor();
        assert.equal(await round().locator('.bigger__ball--large').count(), 1);
        for (const id of choices) {
          const value = await round().locator(`[data-choice="${id}"] .bigger__value`).innerText();
          assert.ok(value.includes(index % 2 === 0 ? 'Περίπου' : 'km²'));
        }
      } else if (mode === 'whoami') {
        await round().locator(`.mystery__speaker .countryball--${incorrect ? 'wave' : index >= 4 ? 'dance' : 'celebrate'}`).waitFor();
        if (incorrect) {
          await round().locator(`[data-choice="${chosen}"]`).scrollIntoViewIfNeeded();
          await round().locator(`[data-choice="${chosen}"] .countryball--shrug`).waitFor();
        }
      } else {
        await round().locator(`[data-choice="${chosen}"] .countryball--${incorrect ? 'shrug' : index >= 4 ? 'dance' : 'celebrate'}`).waitFor();
        if (incorrect) await round().locator('.parade__result .countryball--wave').waitFor();
        assert.ok(await round().locator('.parade__runner').first().evaluate(n => getComputedStyle(n).animationPlayState === 'paused'));
      }
      assert.ok(await round().locator('image').count() >= (mode === 'bigger' ? 2 : 1));
      if (index === 0) { await shot(mode); await shot(`${mode}-after`); }
      if (index === 1 && mode !== 'parade') await shot(`${mode}-wrong`);
      await advance(mode, previous);
      if (index === 2) console.log(`PASS ${mode}: 3 γύροι, κανόνας απόκρυψης, σωστό/λάθος, moods, screenshots`);
    }
    await page.locator('.game-results').waitFor();
    const collected = await page.evaluate(() => JSON.parse(localStorage.getItem('geographyGame:collection:v1')));
    for (const iso2 of won) assert.ok(collected.includes(iso2), `Η σωστή χώρα ${iso2} μπαίνει στη Συλλογή`);
    assert.match(await page.locator('.game-results__stats').innerText(), /9\s*\/\s*10/);
    await page.getByLabel('Όνομα παίκτη:').fill(`Δοκιμή ${mode}`);
    await page.getByRole('button', { name: 'Αποθήκευση', exact: true }).click();
    const saved = await page.evaluate(mode => JSON.parse(localStorage.getItem('geographyGame:scores:v1')).find(s => s.mode === mode), mode);
    assert.equal(saved.mode, mode);
    assert.equal(saved.correctAnswers, 9);
    assert.equal(saved.totalQuestions, 10);
    await page.getByRole('button', { name: 'Παίξε ξανά', exact: true }).click();
    await noLeak(mode);
    if (mode === 'whoami') assert.match(await page.getByRole('button', { name: /Δώσε μου ένδειξη/ }).innerText(), /0\/3/);
    console.log(`PASS ${mode}: 10 γύροι, αποτελέσματα, αποθήκευση και επανεκκίνηση`);
  }

  // Μηδενική απάντηση: ο στόχος πρέπει να φύγει και ο επόμενος γύρος να ξεκινήσει.
  await page.goto(`${base}#/play/parade?difficulty=hard&focus=jp`);
  await round().waitFor();
  await noLeak('parade');
  const beforeMiss = await round().getAttribute('data-round');
  await round().locator('.parade__miss .countryball--sad').waitFor();
  assert.equal(await round().locator('.parade__miss .speech-bubble').innerText(), 'Έφυγα!');
  assert.match(await round().locator('.new-mode__feedback').innerText(), /σωστή χώρα/);
  await advance('parade', beforeMiss);
  console.log('PASS λήξη χωρίς πάτημα → sad, Έφυγα!, επόμενος γύρος');

  // Και οι δύο πηγές reduced motion, χωρίς ολίσθηση και με λειτουργικό χρονόμετρο.
  for (const source of ['system', 'setting']) {
    await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
    // Ίδιο URL με την οθόνη αποτελεσμάτων → χωρίς hashchange· πέρασμα από την αρχική πρώτα.
    await page.goto(`${base}#/`);
    await page.goto(`${base}#/play/parade?focus=jp&length=endless`);
    if (source === 'setting') {
      await page.getByLabel('Ρυθμίσεις παιχνιδιού').click();
      await page.getByLabel('Λιγότερη κίνηση', { exact: true }).check();
      await page.getByLabel('Ρυθμίσεις παιχνιδιού').click();
    }
    await page.locator('.parade__track--still').waitFor();
    await noLeak('parade');
    assert.equal(await page.locator('.parade__runner').first().evaluate(n => getComputedStyle(n).animationName), 'none');
    assert.ok(await page.locator('.parade__clock-hand').evaluate(n => parseFloat(getComputedStyle(n).animationDuration) > 1), 'Το χρονόμετρο δεν μηδενίζεται από το global reduced-motion CSS');
    await page.locator('.parade__runner[data-choice="jp"]').tap();
    await page.waitForFunction(() => document.querySelector('.new-mode__round')?.dataset.answered === 'true');
    await page.getByRole('button', { name: 'Τέλος παιχνιδιού', exact: true }).click();
    await page.locator('.game-results').waitFor();
    assert.match(await page.locator('.game-results__stats').innerText(), /1\s*\/\s*1/);
    console.log(`PASS reduced motion (${source}), χρονόμετρο και τέλος ατέρμονου`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS probe:modes — χωρίς pageerror');
});
