import { generateLegalPages } from './legal-pages.mjs';
import { generateOfflineAssets } from './offline-assets.mjs';
import { generateStaticPages, generatedPaths } from './static-pages.mjs';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = new URL('../dist/', import.meta.url);
generateLegalPages();
generateStaticPages();
generateOfflineAssets();
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of [
  'index.html',
  'favicon.svg',
  'manifest.webmanifest',
  'sw.js',
  'src',
  'fonts',
  'assets',
  'locales',
  'site-analytics.js',
  'theme-preference.js',
  'offline-assets.js',
  'impressum',
  'datenschutz',
  ...generatedPaths,
]) {
  await cp(new URL(name, new URL('../', import.meta.url)), new URL(name, out), { recursive: true });
}
await writeFile(new URL('.nojekyll', out), '');
console.log(`Static site prepared: ${root}dist/`);
