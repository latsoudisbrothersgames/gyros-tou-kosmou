import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-50m.json' with { type: 'json' };
import { getCountryByIsoNumeric } from '../src/data/countries.ts';
import { landNeighbors } from '../src/data/borders.ts';
import { createNeighborsHostPicker, eligibleNeighborsHosts, makeNeighborsPuzzle,
  NEIGHBORHOOD_ROUND_INTERVAL } from '../src/game/neighborsPuzzles.ts';
import { makeNeighborhoodPuzzle, qualifiesForNeighborhood } from '../src/game/neighborhoodPuzzles.ts';
import type { WorldTopology } from '../src/components/WorldMap/useWorldTopology.ts';
import type { DifficultyId } from '../src/types/game.ts';

const raw = atlas as unknown as WorldTopology['raw'];
const countries = feature(raw, raw.objects.countries).features.map(f => ({
  feature: f, isoNumeric: String(f.id), iso2: getCountryByIsoNumeric(String(f.id))?.iso2,
}));
const topology: WorldTopology = { raw, countries, availableIso2: new Set(countries.map(c => c.iso2).filter((id): id is string => !!id)) };
const seed = (initial: number) => {
  let state = initial >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
};
const started = performance.now();
assert.equal(NEIGHBORHOOD_ROUND_INTERVAL, 3);
for (const difficulty of ['easy', 'medium', 'hard'] as DifficultyId[]) {
  const pool = eligibleNeighborsHosts(difficulty);
  const qualified = new Set(pool.filter(c => qualifiesForNeighborhood(c.iso2, difficulty, topology)).map(c => c.iso2));
  assert.ok(qualified.size >= 10, `${difficulty}: αρκετοί οικοδεσπότες για 30 γύρους`);
  for (const host of pool) {
    const actual = makeNeighborhoodPuzzle(host.iso2, difficulty, landNeighbors(host.iso2, false), topology, 0);
    assert.equal(qualified.has(host.iso2), actual !== null, `${difficulty}/${host.iso2}: το σήμα πρέπει να αντιστοιχεί στον γρίφο`);
  }
  for (const initial of [1, 2026, 99123]) {
    const picker = createNeighborsHostPicker(difficulty, qualified, undefined, seed(initial));
    const hosts = Array.from({ length: 30 }, (_, index) => picker.pick(index));
    assert.equal(picker.pick(0), hosts[0], 'διπλή κλήση του ίδιου γύρου δεν αλλάζει επιλογή');
    assert.ok(hosts.every(c => pool.includes(c)), `${difficulty}: μόνο χώρες της δυσκολίας`);
    assert.ok(hosts.every((c, i) => i === 0 || c.iso2 !== hosts[i - 1].iso2), `${difficulty}: χωρίς άμεση επανάληψη`);
    assert.equal(new Set(hosts.slice(0, pool.length).map(c => c.iso2)).size, Math.min(30, pool.length),
      `${difficulty}: καμία επανάληψη πριν εξαντληθεί η δεξαμενή`);
    assert.ok(hosts.filter(c => qualified.has(c.iso2)).length >= 10, `${difficulty}: τουλάχιστον 10/30`);
    for (let i = 0; i < 30; i += 3) {
      assert.ok(hosts.slice(i, i + 3).some(c => qualified.has(c.iso2)), `${difficulty}: κάθε τριάδα έχει Στάδιο 2`);
    }
    assert.equal(makeNeighborsPuzzle(difficulty, undefined, hosts[0]).host, hosts[0]);
  }
  const unqualified = pool.find(c => !qualified.has(c.iso2));
  assert.ok(unqualified, `${difficulty}: δοκιμή εστίασης σε χώρα χωρίς Στάδιο 2`);
  const focusPicker = createNeighborsHostPicker(difficulty, qualified, unqualified.iso2, seed(42));
  assert.equal(focusPicker.pick(0).iso2, unqualified.iso2);
  assert.ok(qualified.has(focusPicker.pick(1).iso2), `${difficulty}: εστιασμένος γύρος αντισταθμίζεται αμέσως`);
  assert.notEqual(focusPicker.pick(1).iso2, unqualified.iso2);
}
console.log(`PASS discover: ακριβής καταλληλότητα και 30 γύροι ανά δυσκολία (${Math.round(performance.now() - started)} ms)`);
