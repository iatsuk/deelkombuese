import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(directory + '/' + entry.name) : [directory + '/' + entry.name],
  );
for (const file of [...walk('src'), ...walk('scripts'), 'sw.js', 'site-analytics.js'].filter(
  (path) => /\.(?:js|mjs)$/.test(path),
)) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status) {
    process.stderr.write(result.stderr);
    process.exit(result.status);
  }
}
for (const script of ['scripts/check-architecture.mjs', 'scripts/check-translations.mjs']) {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}
console.log('Source checks passed.');
