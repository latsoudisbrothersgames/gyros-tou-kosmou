import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { base, withPreview } from './probe_helpers.mjs';

const data = JSON.parse(execFileSync(process.execPath, ['--import', './scripts/register_ts.mjs', '--input-type=module', '-e',
  "import {ALL_COUNTRIES} from './src/data/countries.ts'; import {BORDERS} from './src/data/borders.ts'; import {SPECIAL_BORDERS} from './src/data/borderOverrides.ts'; import {TRAVEL_LINKS} from './src/data/links.ts'; import {ATLAS_PUZZLES} from './src/data/puzzles.ts'; console.log(JSON.stringify({countries:ALL_COUNTRIES,borders:BORDERS,special:SPECIAL_BORDERS,links:TRAVEL_LINKS,puzzles:ATLAS_PUZZLES}))"], { encoding: 'utf8' }));
const byIso = new Map(data.countries.map(c => [c.iso2, c]));
const skip = new Set(['xk','ps','tw','ma','mr']);
const special = new Set(data.special.map(e => [e.a, e.b].sort().join('-')));
const options = (a, b, easy) => {
  const kinds = [];
  if (data.borders[a]?.includes(b) && (!easy || !special.has([a,b].sort().join('-')))) kinds.push('land');
  for (const e of data.links) if (e.a === a && e.b === b || e.a === b && e.b === a) kinds.push(e.kind);
  return kinds;
};
function solve(start, end, tickets, easy) {
  const queue = [{ at: start, path: [start], kinds: [], used: { land: 0, sea: 0, air: 0 } }];
  const seen = new Set();
  while (queue.length) {
    const n = queue.shift();
    if (n.at === end) return n;
    const key = [n.at, ...Object.values(n.used)].join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    for (const c of data.countries) {
      if (skip.has(c.iso2) || n.path.includes(c.iso2)) continue;
      for (const kind of options(n.at, c.iso2, easy)) {
        if (n.used[kind] >= tickets[kind]) continue;
        queue.push({ at: c.iso2, path: [...n.path, c.iso2], kinds: [...n.kinds, kind],
          used: { ...n.used, [kind]: n.used[kind] + 1 } });
      }
    }
  }
  throw new Error(`Δεν υπάρχει διαδρομή ${start}-${end}`);
}
// Στόχοι από την ΙΔΙΑ γεωμετρία με το παιχνίδι (src/game/puzzleGeometry.ts), όχι αντίγραφο.
const geo = JSON.parse(execFileSync(process.execPath, ['--import', './scripts/register_ts.mjs', '--input-type=module', '-e',
  "import {geoNaturalEarth1, geoPath} from 'd3-geo'; import {feature} from 'topojson-client'; import topo from 'world-atlas/countries-50m.json' with {type:'json'};" +
  " import {ALL_COUNTRIES} from './src/data/countries.ts'; import {ATLAS_PUZZLES} from './src/data/puzzles.ts'; import {BOARD, STAGE_H, trimRemote} from './src/game/puzzleGeometry.ts';" +
  " const num = new Map(ALL_COUNTRIES.map(c => [c.isoNumeric, c.iso2])); const fs = new Map(feature(topo, topo.objects.countries).features.map(f => [num.get(String(f.id)), f]));" +
  " const out = {}; for (const p of ATLAS_PUZZLES) { const sel = p.countries.map(id => trimRemote(fs.get(id)));" +
  " const path = geoPath(geoNaturalEarth1().fitExtent([[BOARD.x0, BOARD.y0], [BOARD.x1, BOARD.y1]], {type:'FeatureCollection', features: sel}));" +
  " out[p.id] = Object.fromEntries(p.countries.map((id, i) => { const [[x0,y0],[x1,y1]] = path.bounds(sel[i]); return [id, {x:(x0+x1)/2, y:(y0+y1)/2}]; })); }" +
  " console.log(JSON.stringify({STAGE_H, targets: out}))"], { encoding: 'utf8' }));
function puzzleTargets(puzzle) {
  return new Map(Object.entries(geo.targets[puzzle.id]));
}
mkdirSync('tools/shots', { recursive: true });
await withPreview(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('geographyGame:settings:v1', JSON.stringify({ soundEnabled: false, reducedMotion: true })));
  const round = () => page.locator('.new-mode__round');
  const shot = name => page.screenshot({ path: `tools/shots/mode-${name}.png`, fullPage: true });
  const advance = async previous => {
    await round().getByRole('button', { name: /Επόμενος γύρος|Αποτελέσματα/ }).click();
    await page.waitForFunction(prev => document.querySelector('.new-mode__round')?.dataset.round !== prev, previous);
  };
  const basicNoLeak = async mode => {
    assert.equal(await round().getAttribute('data-answered'), 'false');
    assert.equal(await page.locator('[data-accessory]').count(), 0, `${mode}: πρόωρο αξεσουάρ`);
    assert.equal(await page.locator('.countryball .speech-bubble').filter({ hasText: /Γεια! Είμαι|Γεια σου γείτονα|Ήξερες ότι/ }).count(), 0, `${mode}: πρόωρη ατάκα`);
    assert.equal(await round().getAttribute('data-answer'), null);
    assert.equal(await round().locator('[data-correct], [data-target]').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode}: οριζόντια υπερχείλιση`);
  };
  await page.goto(`${base}#/play/neighbors?difficulty=easy&focus=gr`);
  await round().waitFor();
  for (let i = 0; i < 3; i++) {
    await basicNoLeak('neighbors');
    const previous = await round().getAttribute('data-round');
    const prompt = await round().locator('p').first().innerText();
    const host = data.countries.find(c => prompt.includes(c.nameGreekAccusative))?.iso2;
    assert.ok(host, 'Δεν βρέθηκε ο ορατός οικοδεσπότης');
    const guestNames = await round().locator('.neighbors__guest > span').allInnerTexts();
    const guests = guestNames.map(name => data.countries.find(c => c.nameGreek === name)?.iso2);
    assert.ok(guests.every(Boolean));
    const right = guests.filter(id => data.borders[host].includes(id) && !special.has([host,id].sort().join('-')));
    assert.equal(await round().locator('.neighbors__guest--right, .neighbors__guest--wrong').count(), 0);
    assert.equal(await round().locator('path[stroke="#f06049"]').count(), 0);
    if (i === 0) await shot('neighbors-before');
    const chosen = i === 1 ? guests.filter(id => !right.includes(id)).slice(0, 1) : right;
    for (const id of chosen) await round().locator('.neighbors__guest').nth(guests.indexOf(id)).click();
    assert.equal(await round().locator('.neighbors__guest--right').count(), 0);
    await round().getByRole('button', { name: 'Άνοιξε την πόρτα' }).click();
    await page.waitForFunction(() => document.querySelector('.new-mode__round')?.dataset.answered === 'true');
    assert.equal(await round().locator('.neighbors__guest--right').count(), right.length);
    if (i === 0) { await shot('neighbors'); await shot('neighbors-after'); }
    if (i === 1) await shot('neighbors-wrong');
    await advance(previous);
  }
  console.log('PASS neighbors: 3 γύροι, σωστό/λάθος, απόκρυψη, screenshots');

  await page.goto(`${base}#/play/post?difficulty=medium&focus=gr`);
  await round().waitFor();
  for (let i = 0; i < 3; i++) {
    await basicNoLeak('post');
    const previous = await round().getAttribute('data-round');
    assert.equal(await round().locator('polyline').count(), 0);
    assert.ok(!(await round().innerText()).includes('Η πιο σύντομη:'));
    const intro = await round().locator('p').first().innerText();
    const sender = data.countries.find(c => intro.includes(`${c.nameGreek} στέλνει`));
    const receiver = data.countries.find(c => intro.includes(`δέμα ${c.nameGreekAccusative.replace(/^(την|τη|τον|το|τις|τους|τα) /, m => ({την:'στην ',τη:'στη ',τον:'στον ',το:'στο ',τις:'στις ',τους:'στους ',τα:'στα '})[m.trim()] ?? m)}`));
    assert.ok(sender && receiver, 'Δεν αναγνωρίστηκαν οι ορατοί σταθμοί');
    const balls = [sender.iso2, receiver.iso2];
    const ticketsText = await round().locator('.post__tickets span').allInnerTexts();
    const tickets = Object.fromEntries(['land','sea','air'].map((k, j) => [k, Number(ticketsText[j].match(/×\s*(\d+)/)[1])]));
    let solution = solve(balls[0], balls[1], tickets, false);
    if (i === 2) {
      const script = "import {longerPostRoute} from './src/game/postPuzzles.ts'; console.log(JSON.stringify(longerPostRoute(process.argv[1],process.argv[2],JSON.parse(process.argv[3]),Number(process.argv[4]),true)))";
      const detour = JSON.parse(execFileSync(process.execPath, ['--import', './scripts/register_ts.mjs',
        '--input-type=module', '-e', script, balls[0], balls[1], JSON.stringify(tickets), String(solution.path.length - 1)], { encoding: 'utf8' }));
      assert.ok(detour && detour.path.length > solution.path.length, 'Ο γρίφος συντομίας έχει λάθος διαδρομή');
      solution = detour;
    }
    if (i === 1) {
      // Ο χάρτης είναι τοπικός: η «λάθος» χώρα διαλέγεται ανάμεσα σε όσες φαίνονται και πατιούνται.
      const onMap = await round().locator('svg.regional-map g[role="button"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')));
      const other = data.countries.find(c => onMap.includes(c.nameGreek)
        && c.iso2 !== balls[0] && !options(balls[0], c.iso2, false).length);
      assert.ok(other, 'Καμία ορατή μη γειτονική χώρα για τον έλεγχο λάθους');
      const wrongTarget = round().locator(`svg.regional-map g[aria-label="${other.nameGreek}"]`);
      await wrongTarget.focus();
      await wrongTarget.press('Enter');
      assert.match(await round().innerText(), /Δεν συνορεύουμε/);
      await shot('post-wrong');
    }
    if (i === 0) await shot('post-before');
    for (let j = 1; j < solution.path.length; j++) {
      const id = solution.path[j], kind = solution.kinds[j - 1];
      await round().locator(`.post__nearby button[data-country="${id}"]`).click();
      const choice = round().locator('.post__ticket-choice');
      if (await choice.count()) await choice.getByRole('button', { name: new RegExp(kind === 'land' ? 'Στεριά' : kind === 'sea' ? 'Θάλασσα' : 'Αέρας') }).click();
    }
    await round().getByRole('button', { name: 'Αναχώρηση' }).click();
    await page.waitForFunction(() => document.querySelector('.new-mode__round')?.dataset.answered === 'true');
    assert.ok((await round().innerText()).includes('Η πιο σύντομη:'));
    if (i === 2) assert.match(await round().innerText(), /περιορισμός δεν τηρήθηκε/);
    assert.ok(await round().locator('polyline').count() >= 1);
    if (i === 0) { await shot('post'); await shot('post-after'); }
    await advance(previous);
  }
  console.log('PASS post: 3 διαδρομές BFS, απόκρυψη βέλτιστης, screenshots');

  await page.goto(`${base}#/play/puzzle?difficulty=easy&focus=gr`);
  await round().waitFor();
  for (let i = 0; i < 3; i++) {
    await round().locator('.puzzle__piece').first().waitFor();
    await basicNoLeak('puzzle');
    const previous = await round().getAttribute('data-round');
    const puzzle = data.puzzles[i];
    const targets = puzzleTargets(puzzle);
    assert.equal(await round().locator('.puzzle__piece--placed').count(), 0);
    const beforeTransforms = await round().locator('.puzzle__piece').evaluateAll(nodes => nodes.map(n => n.getAttribute('transform')));
    assert.ok(beforeTransforms.every(value => Number(value.match(/translate\([^ ]+ ([^)]*)/)[1]) >= 274),
      'Οι θέσεις-στόχοι δεν γράφονται στα κομμάτια πριν το snap');
    assert.equal(await round().locator('[data-target]').count(), 0);
    if (i === 0) await shot('puzzle-before');
    for (let j = 0; j < puzzle.countries.length; j++) {
      const id = puzzle.countries[j];
      const piece = round().locator(`.puzzle__piece[aria-label="${byIso.get(id).nameGreek}"]`);
      await piece.scrollIntoViewIfNeeded();
      const from = await piece.boundingBox();
      const stage = await round().locator('.puzzle__stage').boundingBox();
      const target = targets.get(id);
      const tx = stage.x + target.x * stage.width / 360, ty = stage.y + target.y * stage.height / geo.STAGE_H;
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      if (i === 1 && j === 0) {
        await page.mouse.move(from.x + from.width / 2 + 20, from.y + from.height / 2, { steps: 4 });
        await page.mouse.up();
        assert.match(await round().innerText(), /Λάθος αποθέσεις: 1/);
        await piece.scrollIntoViewIfNeeded();
        const retry = await piece.boundingBox();
        await page.mouse.move(retry.x + retry.width / 2, retry.y + retry.height / 2);
        await page.mouse.down();
      }
      await page.mouse.move(tx, ty, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(count => document.querySelectorAll('.puzzle__piece--placed').length === count, j + 1);
    }
    await page.waitForFunction(() => document.querySelector('.new-mode__round')?.dataset.answered === 'true');
    if (i === 0) { await shot('puzzle'); await shot('puzzle-after'); }
    if (i === 1) await shot('puzzle-wrong');
    await advance(previous);
  }
  console.log('PASS puzzle: 3 περιοχές, τουλάχιστον δύο drag/snap, λάθος απόθεση, screenshots');
  assert.deepEqual(errors, []);
});
