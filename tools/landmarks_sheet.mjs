// Contact sheet όλων των μνημείων (LandmarkArt) → HTML + PNG, για έλεγχο πριν/μετά.
// Χρήση: node tools/landmarks_sheet.mjs [έξοδος.png] [--html-only] [--mobile] (Chrome για το PNG)
import { createServer } from 'vite';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const out = resolve(args.find(arg => !arg.startsWith('--')) ?? 'tools/shots/landmarks-sheet.png');
mkdirSync(dirname(out), { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let cells;
try {
  const { LandmarkArt } = await vite.ssrLoadModule('/src/components/LandmarkArt/LandmarkArt.tsx');
  const { LANDMARKS } = await vite.ssrLoadModule('/src/data/landmarks.ts');
  // Native imports: Vite SSR externalises react, so the component shares this instance.
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createElement } = await import('react');
  cells = LANDMARKS.map(l => {
    // Prefixes also isolate clip/gradient IDs when separately rendered cells share a page.
    const svg = renderToStaticMarkup(createElement(LandmarkArt, { landmarkId: l.id }), { identifierPrefix: `${l.id}-` });
    const svgOnly = svg.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
    if (!svgOnly) throw new Error(`Λείπει το SVG: ${l.id}`);
    return { id: l.id, name: l.nameGreek, svg, bytes: Buffer.byteLength(svgOnly, 'utf8') };
  });
} finally { await vite.close(); }
const css = readFileSync('src/components/LandmarkArt/LandmarkArt.css', 'utf8');
const html = `<!doctype html><html lang="el"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Μνημεία του Κόσμου</title><style>${css}
body{margin:0;padding:16px;background:#eef3f8;font:14px system-ui;display:grid;grid-template-columns:repeat(4,300px);gap:14px}
figure{margin:0;background:#fff;border-radius:12px;padding:8px}figcaption{text-align:center;margin-top:4px;color:#223}
figure>*{width:284px}
@media(max-width:600px){body{grid-template-columns:minmax(0,1fr)}figure>*{width:auto}.diorama{max-width:420px}}
@media(prefers-reduced-motion:no-preference){.dio-drift{animation:none}}</style>${cells.map(c => `<figure>${c.svg}<figcaption>${c.name}</figcaption></figure>`).join('')}</html>`;
const htmlPath = out.replace(/\.png$/, '.html');
writeFileSync(htmlPath, html);
const total = cells.reduce((sum, cell) => sum + cell.bytes, 0);
console.log('HTML:', htmlPath, `(${cells.length} μνημεία)`);
for (const cell of cells) console.log(`${cell.id}: ${cell.bytes} bytes SVG`);
console.log(`SVG total: ${total} bytes; average: ${(total / cells.length).toFixed(1)} bytes (${(total / cells.length / 1024).toFixed(2)} KiB)`);
if (total / cells.length > 12 * 1024) throw new Error('Υπέρβαση μέσου προϋπολογισμού SVG (12 KiB)');
if (!args.includes('--html-only')) try {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const mobile = args.includes('--mobile');
  const page = await browser.newPage({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1300, height: 800 },
    isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2,
  });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('PNG:', out);
} catch (e) { console.log('PNG παραλείφθηκε:', e.message.split('\n')[0]); }
