import { generateLegalPages } from './legal-pages.mjs';
import { generateOfflineAssets } from './offline-assets.mjs';
generateLegalPages();
generateOfflineAssets();
await import('./serve.mjs');
