import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-50m.json' with { type: 'json' };

// Έλεγχος του πραγματικού React markup. Δεν υποκαθιστά τα probes κίνησης/offline.
const server = await createServer({ configFile: false, cacheDir: '/private/tmp/gyros-sprint4-vite-markup-cache', optimizeDeps: { noDiscovery: true, entries: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const originalWindow = globalThis.window;
globalThis.window = { matchMedia: () => ({ matches: false }) };
try {
  const { CountryBall } = await server.ssrLoadModule('/src/components/CountryBall/CountryBall.tsx');
  const { ALL_COUNTRIES } = await server.ssrLoadModule('/src/data/countries.ts');
  const { BALL_ACCESSORIES } = await server.ssrLoadModule('/src/data/ballAccessories.ts');
  const { SettingsProvider } = await server.ssrLoadModule('/src/context/SettingsContext.tsx');
  const renderBall = props => renderToStaticMarkup(React.createElement(SettingsProvider, null, React.createElement(CountryBall, props)));
  for (const country of ALL_COUNTRIES) {
    const hidden = renderBall({ country, concealed: true, mood: 'thinking', identityVisible: true });
    assert.ok(!/<(?:image|img)\b/.test(hidden), `Σημαία στη σιλουέτα ${country.iso2}`);
    assert.ok(!hidden.includes('data-iso2'), `Κρυφή ταυτότητα ${country.iso2}`);
    assert.ok(!hidden.includes('data-accessory='), `Αξεσουάρ σε κρυφή φιγούρα ${country.iso2}`);
    assert.ok(hidden.includes('#46515c'));
    const unknown = renderBall({ country });
    assert.ok(!unknown.includes('data-accessory='), `Πρόωρο αξεσουάρ ${country.iso2}`);
    assert.ok(!unknown.includes('data-iso2='), `Πρόωρη ταυτότητα ${country.iso2}`);
    const revealed = renderBall({ country, identityVisible: true });
    assert.match(revealed, /<image\b/);
    assert.ok(revealed.includes(`data-iso2="${country.iso2}"`));
    assert.equal(revealed.includes('data-accessory='), Boolean(BALL_ACCESSORIES[country.iso2]), `Αξεσουάρ αποκάλυψης ${country.iso2}`);
  }
  for (const [mode, file, name, count, balls] of [
    ['whoami', 'WhoAmIGamePage', 'WhoAmIGamePage', 4, 1],
    ['parade', 'ParadeGamePage', 'ParadeGamePage', 3, 3],
    ['bigger', 'BiggerGamePage', 'BiggerGamePage', 2, 2],
  ]) {
    const module = await server.ssrLoadModule(`/src/pages/${file}.tsx`);
    const markup = renderToStaticMarkup(React.createElement(SettingsProvider, null,
      React.createElement(MemoryRouter, { initialEntries: [`/play/${mode}?focus=jp`] }, React.createElement(module[name]))));
    assert.equal((markup.match(/data-choice=/g) ?? []).length, count);
    assert.equal((markup.match(/class="countryball /g) ?? []).length, balls);
    assert.ok(!markup.includes('data-answer='));
    assert.ok(!markup.includes('data-accessory='), `${mode}: πρόωρο αξεσουάρ`);
    assert.ok(!/Γεια σου γείτονα|Γεια! Είμαι/.test(markup), `${mode}: πρόωρη ατάκα`);
    assert.ok(!markup.includes('bigger__value'));
    if (mode !== 'parade') assert.ok(!/<(?:image|img)\b/.test(markup), `Διαρροή στο ${mode}`);
    else for (let i = 1; i <= count; i++) assert.ok(markup.includes(`aria-label="Σημαία ${i}"`));
  }
  for (const [mode, file, name] of [
    ['neighbors', 'NeighborsGamePage', 'NeighborsGamePage'],
    ['post', 'PostGamePage', 'PostGamePage'],
    ['puzzle', 'PuzzleGamePage', 'PuzzleGamePage'],
  ]) {
    const module = await server.ssrLoadModule(`/src/pages/${file}.tsx`);
    const markup = renderToStaticMarkup(React.createElement(SettingsProvider, null,
      React.createElement(MemoryRouter, { initialEntries: [`/play/${mode}?focus=gr`] }, React.createElement(module[name]))));
    assert.ok(markup.includes(`data-mode="${mode}"`));
    assert.ok(!markup.includes('data-accessory='), `${mode}: πρόωρο αξεσουάρ`);
    assert.ok(!/Γεια σου γείτονα|Γεια! Είμαι/.test(markup), `${mode}: πρόωρη ατάκα`);
    assert.ok(markup.includes('data-answered="false"'));
    assert.ok(!markup.includes('data-answer='));
    assert.ok(!markup.includes('data-accessory='), `${mode}: πρόωρο αξεσουάρ`);
    assert.ok(!/Γεια σου γείτονα|Γεια! Είμαι/.test(markup), `${mode}: πρόωρη ατάκα`);
    assert.ok(!markup.includes('neighbors__guest--right'));
    assert.ok(!markup.includes('Η πιο σύντομη'));
    assert.ok(!markup.includes('puzzle__piece--placed') || mode === 'puzzle');
    if (mode === 'neighbors') {
      assert.ok(!markup.includes('Φτιάξε τη γειτονιά'), 'Το Στάδιο 2 δεν προσφέρεται πριν από την απάντηση');
      assert.ok(!markup.includes('neighborhood__piece'), 'Κανένα κομμάτι πριν από την απάντηση');
    }
  }
  const { makeNeighborhoodPuzzle } = await server.ssrLoadModule('/src/game/neighborhoodPuzzles.ts');
  const { NeighborhoodStage } = await server.ssrLoadModule('/src/pages/NeighborhoodStage.tsx');
  const { getCountryByIsoNumeric, getCountryByIsoCode } = await server.ssrLoadModule('/src/data/countries.ts');
  const raw = atlas;
  const countries = feature(raw, raw.objects.countries).features.map(f => ({
    feature: f, isoNumeric: String(f.id), iso2: getCountryByIsoNumeric(String(f.id))?.iso2,
  }));
  const topology = { raw, countries, availableIso2: new Set(countries.map(c => c.iso2).filter(Boolean)) };
  const neighborhood = makeNeighborhoodPuzzle('gr', 'easy', ['al', 'bg', 'mk', 'tr'], topology, 0);
  assert.ok(neighborhood && neighborhood.pieces.length === 3);
  const stage = renderToStaticMarkup(React.createElement(SettingsProvider, null,
    React.createElement(NeighborhoodStage, { puzzle: neighborhood, host: getCountryByIsoCode('gr'),
      difficulty: 'easy', onSkip: () => {}, onComplete: () => ({ bonus: 0, count: 0 }) })));
  assert.equal((stage.match(/class="neighborhood__piece /g) ?? []).length, neighborhood.pieces.length);
  assert.ok(!/data-(?:target|correct|answer)=/.test(stage), 'Καμία θέση-στόχος ή σημάδι σωστού');
  for (const piece of neighborhood.pieces) {
    assert.ok(!stage.includes(`translate(${piece.x} ${piece.y})`), `${piece.id}: πρόωρη θέση-στόχος`);
  }
  const trayY = [...stage.matchAll(/class="neighborhood__piece[^"]*" transform="translate\([^ ]+ ([^)]+)\)/g)]
    .map(match => Number(match[1]));
  assert.equal(trayY.length, neighborhood.pieces.length);
  assert.ok(trayY.every(y => y >= 302), 'Όλα τα κομμάτια ξεκινούν στον δίσκο');
  assert.ok(!stage.includes('neighborhood__glow'), 'Καμία λάμψη σωστού πριν από snap');
  for (const mood of ['curious','confused','excited','disappointed','dizzy','giggle','love']) assert.ok(renderBall({ country: ALL_COUNTRIES[0], mood }).includes(`countryball--${mood}`));
  console.log('PASS React markup: identity gates, 6 αρχικές οθόνες και Στάδιο 2 χωρίς θέσεις-στόχους πριν το snap');
} finally {
  globalThis.window = originalWindow;
  await server.close();
}
