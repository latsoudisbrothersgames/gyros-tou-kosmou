// Contact sheet όλων των μνημείων (LandmarkArt) → HTML + PNG, για έλεγχο πριν/μετά.
// Χρήση: node tools/landmarks_sheet.mjs [έξοδος.png]   (χρειάζεται Chrome για το PNG)
import { createServer } from 'vite';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = resolve(process.argv[2] ?? 'tools/shots/landmarks-sheet.png');
mkdirSync(dirname(out), { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let cells;
try {
  const { LandmarkArt } = await vite.ssrLoadModule('/src/components/LandmarkArt/LandmarkArt.tsx');
  const { LANDMARKS } = await vite.ssrLoadModule('/src/data/landmarks.ts');
  // Native imports: Vite SSR externalises react, so the component shares this instance.
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createElement } = await import('react');
  cells = LANDMARKS.map(l => ({ name: l.nameGreek,
    svg: renderToStaticMarkup(createElement(LandmarkArt, { landmarkId: l.id })) }));
} finally { await vite.close(); }
const css = readFileSync('src/components/LandmarkArt/LandmarkArt.css', 'utf8');
const html = `<!doctype html><meta charset="utf-8"><style>${css}
body{margin:0;padding:16px;background:#eef3f8;font:14px system-ui;display:grid;grid-template-columns:repeat(4,300px);gap:14px}
figure{margin:0;background:#fff;border-radius:12px;padding:8px}figcaption{text-align:center;margin-top:4px;color:#223}
figure>*{width:284px}</style>${cells.map(c => `<figure>${c.svg}<figcaption>${c.name}</figcaption></figure>`).join('')}`;
const htmlPath = out.replace(/\.png$/, '.html');
writeFileSync(htmlPath, html);
console.log('HTML:', htmlPath, `(${cells.length} μνημεία, ${Math.round(html.length / 1024)} KB SVG)`);
try {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('PNG:', out);
} catch (e) { console.log('PNG παραλείφθηκε:', e.message.split('\n')[0]); }
