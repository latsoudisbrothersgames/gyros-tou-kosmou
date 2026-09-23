import { ALL_COUNTRIES, getCountryByIsoNumeric } from '../src/data/countries';
import topo from 'world-atlas/countries-50m.json';

const errs: string[] = [];
const warn: string[] = [];

const iso2s = new Set<string>(), iso3s = new Set<string>(), nums = new Set<string>(), names = new Set<string>();
for (const c of ALL_COUNTRIES) {
  if (iso2s.has(c.iso2)) errs.push(`dup iso2 ${c.iso2}`);
  if (iso3s.has(c.iso3)) errs.push(`dup iso3 ${c.iso3}`);
  if (c.isoNumeric !== '-99' && nums.has(c.isoNumeric)) errs.push(`dup isoNumeric ${c.isoNumeric} (${c.nameGreek})`);
  if (names.has(c.nameGreek)) errs.push(`dup nameGreek ${c.nameGreek}`);
  iso2s.add(c.iso2); iso3s.add(c.iso3); nums.add(c.isoNumeric); names.add(c.nameGreek);
  if (!/^[a-z]{2}$/.test(c.iso2)) errs.push(`bad iso2 ${c.iso2}`);
  if (!/^[A-Z]{3}$/.test(c.iso3)) errs.push(`bad iso3 ${c.iso3} (${c.nameGreek})`);
  if (!c.capitalGreek) errs.push(`no capital ${c.nameGreek}`);
  if (!c.factsGreek?.length) warn.push(`no facts ${c.nameGreek}`);
  if (![1,2,3].includes(c.tier)) errs.push(`bad tier ${c.nameGreek}`);
  if (!c.nameGreekAccusative || !c.nameGreekGenitive) errs.push(`missing declension ${c.nameGreek}`);
}

const tierCounts = [1,2,3].map(t => ALL_COUNTRIES.filter(c=>c.tier===t).length);
console.log(`Total: ${ALL_COUNTRIES.length} | tiers 1/2/3: ${tierCounts.join('/')}`);
const byCont: Record<string, number> = {};
for (const c of ALL_COUNTRIES) byCont[c.continent] = (byCont[c.continent]??0)+1;
console.log('Continents:', JSON.stringify(byCont));

// map join
const geoIds = new Set((topo as any).objects.countries.geometries.map((g: any) => String(g.id ?? '')));
const unmatchedData = ALL_COUNTRIES.filter(c => !geoIds.has(c.isoNumeric)).map(c => `${c.nameGreek}(${c.isoNumeric})`);
const unmatchedGeo = [...geoIds].filter(id => id !== '010' && !getCountryByIsoNumeric(id));
console.log('Countries with no map geometry:', unmatchedData.join(', ') || 'none');
console.log('Geometries with no country match:', unmatchedGeo.map(id => {
  const g = (topo as any).objects.countries.geometries.find((x:any)=>String(x.id??'')===id);
  return `${g?.properties?.name}(${id})`;
}).join(', ') || 'none');

// flags
import { readdirSync } from 'fs';
const flagFiles = new Set(readdirSync('node_modules/flag-icons/flags/4x3').map(f=>f.replace('.svg','')));
const noFlag = ALL_COUNTRIES.filter(c=>!flagFiles.has(c.iso2)).map(c=>c.nameGreek);
console.log('Countries with no flag file:', noFlag.join(', ') || 'none');


import { ATLAS_PUZZLES } from '../src/data/puzzles';
import { BORDERS, landNeighbors, borderKind } from '../src/data/borders';
import { TRAVEL_LINKS } from '../src/data/links';
import { SPECIAL_BORDERS } from '../src/data/borderOverrides';

const known = new Set(ALL_COUNTRIES.map(c => c.iso2));
if (Object.keys(BORDERS).length !== ALL_COUNTRIES.length) errs.push('border rows must cover 197 countries');
for (const [a, adjacent] of Object.entries(BORDERS)) {
  if (!known.has(a)) errs.push(`unknown border country ${a}`);
  if (new Set(adjacent).size !== adjacent.length) errs.push(`duplicate border ${a}`);
  for (const b of adjacent) {
    if (!known.has(b) || b === a) errs.push(`invalid border ${a}-${b}`);
    if (!BORDERS[b]?.includes(a)) errs.push(`asymmetric border ${a}-${b}`);
  }
}
const exact = (iso: string, expected: string[]) => {
  const actual = [...BORDERS[iso]].sort().join(',');
  if (actual !== expected.sort().join(',')) errs.push(`border spot check ${iso}: ${actual}`);
};
exact('gr', ['al', 'mk', 'bg', 'tr']);
exact('pt', ['es']);
exact('jp', []);
exact('cn', ['af','bt','in','kg','kp','kz','la','mm','mn','np','pk','ru','tj','vn']);
exact('ls', ['za']);
exact('ht', ['do']);
exact('ie', ['gb']);
exact('sm', ['it']);
exact('va', ['it']);
exact('mc', ['fr']);
exact('ad', ['es','fr']);
exact('li', ['at','ch']);
exact('so', ['dj','et','ke']);
exact('xk', ['al','me','mk','rs']);
exact('br', ['ar','bo','co','fr','gy','pe','py','sr','uy','ve']);
exact('au', []);
exact('nz', []);
exact('dk', ['de','ca']);
exact('fr', ['ad','be','br','ch','de','es','it','lu','mc','nl','sr']);
exact('es', ['ad','fr','gb','ma','pt']);
for (const edge of SPECIAL_BORDERS) {
  if (!BORDERS[edge.a]?.includes(edge.b) || !edge.noteGreek || !['overseas','exclave'].includes(edge.kind)) errs.push(`invalid special border ${edge.a}-${edge.b}`);
  if (landNeighbors(edge.a).includes(edge.b) || !borderKind(edge.a, edge.b)) errs.push(`special leaked into easy ${edge.a}-${edge.b}`);
}
for (const puzzle of ATLAS_PUZZLES) for (const iso of puzzle.countries) {
  const country = ALL_COUNTRIES.find(c => c.iso2 === iso);
  if (!country || !geoIds.has(country.isoNumeric)) errs.push(`puzzle without geometry ${puzzle.id}/${iso}`);
}
const sea = TRAVEL_LINKS.filter(link => link.kind === 'sea');
const air = TRAVEL_LINKS.filter(link => link.kind === 'air');
if (sea.length < 50 || sea.length > 80 || air.length < 10 || air.length > 20) errs.push(`link count ${sea.length}/${air.length}`);
const pairs = new Set<string>();
for (const link of TRAVEL_LINKS) {
  const key = [link.a, link.b].sort().join('-');
  if (!known.has(link.a) || !known.has(link.b) || link.a === link.b || pairs.has(key)) errs.push(`invalid link ${key}`);
  pairs.add(key);
}
for (const c of ALL_COUNTRIES.filter(c => !BORDERS[c.iso2].length)) {
  if (!sea.some(link => link.a === c.iso2 || link.b === c.iso2)) errs.push(`island without sea link ${c.iso2}`);
}
const reached = new Set(['gr']), queue = ['gr'];
while (queue.length) {
  const current = queue.shift()!;
  const next = [...BORDERS[current], ...TRAVEL_LINKS.filter(l => l.a === current || l.b === current).map(l => l.a === current ? l.b : l.a)];
  for (const other of next) if (!reached.has(other)) { reached.add(other); queue.push(other); }
}
if (reached.size !== ALL_COUNTRIES.length) errs.push(`disconnected: ${ALL_COUNTRIES.filter(c => !reached.has(c.iso2)).map(c => c.iso2)}`);

if (errs.length) { console.log('\nERRORS:'); errs.forEach(e=>console.log(' -',e)); process.exit(1); }
if (warn.length) { console.log('\nWarnings:'); warn.forEach(e=>console.log(' -',e)); }
console.log('\nOK');
