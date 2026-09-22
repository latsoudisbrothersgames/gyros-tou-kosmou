import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// Έλεγχος του πραγματικού React markup. Δεν υποκαθιστά τα probes κίνησης/offline.
const server = await createServer({ configFile: false, cacheDir: '/private/tmp/gyros-sprint2-vite-markup-cache', optimizeDeps: { noDiscovery: true, entries: [] }, server: { middlewareMode: true }, appType: 'custom' });
const originalWindow = globalThis.window;
globalThis.window = { matchMedia: () => ({ matches: false }) };
try {
  const { CountryBall } = await server.ssrLoadModule('/src/components/CountryBall/CountryBall.tsx');
  const { ALL_COUNTRIES } = await server.ssrLoadModule('/src/data/countries.ts');
  for (const country of ALL_COUNTRIES) {
    const hidden = renderToStaticMarkup(React.createElement(CountryBall, { country, concealed: true, mood: 'thinking' }));
    assert.ok(!/<(?:image|img)\b/.test(hidden), `Σημαία στη σιλουέτα ${country.iso2}`);
    assert.ok(!hidden.includes('data-iso2'), `Κρυφή ταυτότητα ${country.iso2}`);
    assert.ok(hidden.includes('#46515c'));
    const revealed = renderToStaticMarkup(React.createElement(CountryBall, { country }));
    assert.match(revealed, /<image\b/);
    assert.ok(revealed.includes(`data-iso2="${country.iso2}"`));
  }
  const { SettingsProvider } = await server.ssrLoadModule('/src/context/SettingsContext.tsx');
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
    assert.ok(!markup.includes('bigger__value'));
    if (mode !== 'parade') assert.ok(!/<(?:image|img)\b/.test(markup), `Διαρροή στο ${mode}`);
    else for (let i = 1; i <= count; i++) assert.ok(markup.includes(`aria-label="Σημαία ${i}"`));
  }
  console.log('PASS React markup: 197 σιλουέτες χωρίς σημαία/ταυτότητα, 197 αποκαλύψεις και 3 αρχικές οθόνες χωρίς λύση');
} finally {
  globalThis.window = originalWindow;
  await server.close();
}
