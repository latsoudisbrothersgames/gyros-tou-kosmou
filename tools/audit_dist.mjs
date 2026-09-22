import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const files = readdirSync('dist', { recursive: true }).filter((name) => statSync(`dist/${name}`).isFile());
const bytes = files.reduce((sum, name) => sum + statSync(`dist/${name}`).size, 0);
assert.ok(bytes <= 5_000_000, `Το dist είναι ${bytes} bytes`);
let precache;
let fallback;
const workbox = {
  clientsClaim() {}, cleanupOutdatedCaches() {}, registerRoute() {},
  precacheAndRoute(entries) { precache = entries; },
  createHandlerBoundToURL(url) { fallback = url; },
  NavigationRoute: class {},
};
runInNewContext(readFileSync('dist/sw.js', 'utf8'), {
  self: { define() {}, skipWaiting() {} },
  define(_dependencies, factory) { factory(workbox); },
});
const cached = new Set(precache.map((entry) => entry.url));
for (const name of files) {
  // Τα scripts του ίδιου του SW αποθηκεύονται από τον browser ως SW resources.
  if (name === 'sw.js' || /^workbox-.*\.js$/.test(name)) continue;
  assert.ok(cached.has(name), `Εκτός precache: ${name}`);
}
assert.equal(fallback, '/gyros-tou-kosmou/index.html');
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.start_url, '/gyros-tou-kosmou/');
assert.equal(manifest.scope, manifest.start_url);
assert.equal(manifest.lang, 'el');
for (const size of [192, 512]) {
  const png = readFileSync(`dist/icon-${size}.png`);
  assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size);
  for (const purpose of ['any', 'maskable']) assert.ok(manifest.icons.some((icon) => icon.sizes === `${size}x${size}` && icon.purpose === purpose));
}
const urls = new Set();
for (const name of files.filter((file) => /\.(js|css|html|svg)$/.test(file))) {
  for (const match of readFileSync(`dist/${name}`, 'utf8').matchAll(/https:\/\/[^\s"'<>\\`)]+/g)) urls.add(match[0]);
}
const diagnosticUrls = ['https://bit.ly/wb-precache', 'https://github.com/ungap/url-search-params.', 'https://react.dev/errors/', 'https://reactrouter.com/en/main/routers/picking-a-router.'];
for (const url of urls) assert.ok(diagnosticUrls.includes(url), `Μη αναμενόμενο εξωτερικό URL: ${url}`);
console.log(`PASS dist: ${bytes} bytes, ${cached.size} μοναδικά αρχεία precache, σωστό base/manifest/PNG`);
console.log(`INFO ${urls.size} σύνδεσμοι διαγνωστικών τρίτων βιβλιοθηκών· δεν αποτελούν αιτήματα δικτύου`);
if (process.env.AUDIT_PREVIEW) {
  const root = new URL(process.env.AUDIT_PREVIEW);
  for (const name of files) {
    const response = await fetch(new URL(name, root));
    assert.equal(response.status, 200, name);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), readFileSync(`dist/${name}`), name);
  }
  console.log(`PASS HTTP: και τα ${files.length} αρχεία σερβίρονται ακριβώς στο production base`);
}
