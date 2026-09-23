/** Static, offline visual QA sheet: node tools/accessory_grid.mjs */
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const [{ CountryBall }, { SettingsProvider }, { ReactionsProvider }, { BALL_ACCESSORIES }, { ALL_COUNTRIES }] = await Promise.all([
    vite.ssrLoadModule('/src/components/CountryBall/CountryBall.tsx'),
    vite.ssrLoadModule('/src/context/SettingsContext.tsx'),
    vite.ssrLoadModule('/src/reactions/ReactionsProvider.tsx'),
    vite.ssrLoadModule('/src/data/ballAccessories.ts'),
    vite.ssrLoadModule('/src/data/countries.ts'),
  ]);
  const entries = ALL_COUNTRIES.filter(c => BALL_ACCESSORIES[c.iso2]);
  const rows = entries.map(c => `<div class="cell">${renderToStaticMarkup(React.createElement(SettingsProvider, null,
    React.createElement(ReactionsProvider, null, React.createElement(CountryBall, { country: c, size: 64, mood: 'idle', reactive: false, identityVisible: true, speechEnabled: false }))))}<b>${c.nameGreek}</b><small>${BALL_ACCESSORIES[c.iso2].label}</small></div>`).join('');
  const withFlags = rows.replace(/<image([^>]*?)href="[^"]*"([^>]*?)data-iso-placeholder="([^"]*)"/g, '<image$1href="$3"$2');
  // SSR flag URLs may be virtual. Replace each ball's flag URL with an embedded package asset.
  let html = withFlags;
  for (const c of entries) {
    const source = readFileSync(resolve(`node_modules/flag-icons/flags/4x3/${c.iso2}.svg`), 'utf8');
    const data = `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;
    const re = new RegExp(`(<div[^>]+data-iso2="${c.iso2}"[\\s\\S]*?<image[^>]+href=")[^"]*`, 'g');
    html = html.replace(re, `$1${data}`);
  }
  const css = readFileSync('src/components/CountryBall/CountryBall.css', 'utf8');
  writeFileSync('tools/accessories-grid.html', `<!doctype html><html lang="el"><meta charset="utf-8"><title>CountryBalls accessories</title><style>${css}\n*{box-sizing:border-box}body{margin:0;padding:24px;background:#e9f4ee;font-family:system-ui,sans-serif;color:#173653}h1{font-size:26px;margin:0 0 18px}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}.cell{height:124px;display:flex;align-items:center;flex-direction:column;background:white;border:2px solid #a4d2af;border-radius:14px;padding:9px;text-align:center}.cell b{font-size:13px}.cell small{font-size:10px;line-height:1.1} .countryball,.countryball *{animation:none!important}</style><h1>CountryBalls — 60 αξεσουάρ</h1><div class="grid">${html}</div></html>`);
  console.log(`Wrote tools/accessories-grid.html with ${entries.length} balls`);
} finally { await vite.close(); }
