import { writeFileSync } from 'node:fs';
import { neighbors } from 'topojson-client';
import topo from 'world-atlas/countries-50m.json';
import { ALL_COUNTRIES } from '../src/data/countries';
import { BORDER_OVERRIDES } from '../src/data/borderOverrides';

const geometries = topo.objects.countries.geometries;
const byNum = new Map(ALL_COUNTRIES.map(c => [c.isoNumeric, c.iso2]));
const edges = new Map(ALL_COUNTRIES.map(c => [c.iso2, new Set<string>()]));
const add = (a: string, b: string) => { if (!edges.has(a) || !edges.has(b)) throw new Error(`Άγνωστο ζεύγος ${a}-${b}`); edges.get(a)!.add(b); edges.get(b)!.add(a); };
const remove = (a: string, b: string) => { edges.get(a)?.delete(b); edges.get(b)?.delete(a); };
for (const [i, adjacent] of neighbors(geometries).entries()) {
  const a = byNum.get(String(geometries[i].id));
  if (!a) continue;
  for (const j of adjacent) {
    const b = byNum.get(String(geometries[j].id));
    if (b && a !== b) add(a, b);
  }
}
for (const [a, b] of BORDER_OVERRIDES.add) add(a, b);
for (const [a, b] of BORDER_OVERRIDES.remove) remove(a, b);
const rows = [...edges].sort(([a], [b]) => a.localeCompare(b)).map(([a, values]) => `  ${a}: [${[...values].sort().map(v => `'${v}'`).join(', ')}],`);
writeFileSync('src/data/borders.ts', `/** Παράγεται από npm run gen:borders. Μη διορθώνεις τη λίστα εδώ· χρησιμοποίησε BORDER_OVERRIDES. */
import { SPECIAL_BORDERS } from './borderOverrides';

export const BORDERS: Record<string, readonly string[]> = {
${rows.join('\n')}
};

export function borderKind(a: string, b: string) {
  return SPECIAL_BORDERS.find(edge => edge.a === a && edge.b === b || edge.a === b && edge.b === a);
}
export function landNeighbors(iso2: string, includeSpecial = false): string[] {
  return (BORDERS[iso2] ?? []).filter(other => includeSpecial || !borderKind(iso2, other));
}
`);
console.log(`Γράφτηκαν ${edges.size} χώρες και ${[...edges.values()].reduce((n, v) => n + v.size, 0) / 2} σύνορα.`);
