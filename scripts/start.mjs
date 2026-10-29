import { generateLegalPages } from './legal-pages.mjs';
import { generateOfflineAssets } from './offline-assets.mjs';
import { generateStaticPages } from './static-pages.mjs';
generateLegalPages();
generateStaticPages();
generateOfflineAssets();
await import('./serve.mjs');
