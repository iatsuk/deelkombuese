import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { parse } from 'acorn';
import { analyze } from 'eslint-scope';
const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(directory + '/' + entry.name) : [directory + '/' + entry.name],
  );
const files = walk('src').filter((path) => path.endsWith('.js'));
const dependencies = new Map();
const problems = [];
const globals = new Set(
  'Infinity parseInt parseFloat Array ArrayBuffer Boolean Blob Date Error Event File FontFace Image Intl JSON Map Math Number Object Path2D Promise RegExp Set String TypeError URL URLSearchParams WeakMap WeakSet Uint8Array clearTimeout console crypto document fetch globalThis location localStorage navigator requestAnimationFrame self setTimeout window undefined'.split(
    ' ',
  ),
);
for (const file of files) {
  const ast = parse(readFileSync(file, 'utf8'), {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ranges: true,
  });
  const imports = ast.body.filter(
    (node) =>
      node.type === 'ImportDeclaration' || (node.source && node.type === 'ExportNamedDeclaration'),
  );
  const targets = imports
    .filter((node) => node.source.value.startsWith('.'))
    .map((node) => relative('.', resolve(dirname(file), node.source.value)));
  dependencies.set(file, targets);
  const domain =
    /^src\/(?:catalog\/|data\.js|model\.js|planner\.js|preferences\.js|dish-generator\.js|cooking-guide\.js)/.test(
      file,
    );
  for (const target of targets) {
    if (domain && /^src\/(?:ui\/|state\/|export\/|i18n\/)/.test(target))
      problems.push(`${file}: domain depends on ${target}`);
    if (file.startsWith('src/ui/') && target === 'src/app.js')
      problems.push(`${file}: view imports its controller`);
    if (
      file === 'src/export/png.js' &&
      /^src\/(?:data\.js|model\.js|planner\.js|state\/|i18n\/browser)/.test(target)
    )
      problems.push(`${file}: renderer reads business state`);
  }
  const scopes = analyze(ast, {
    ecmaVersion: 2024,
    sourceType: 'module',
    optimistic: true,
    ignoreEval: true,
  });
  for (const ref of scopes.globalScope.through)
    if (!globals.has(ref.identifier.name))
      problems.push(`${file}: undefined ${ref.identifier.name}`);
  for (const scope of scopes.scopes)
    for (const variable of scope.variables)
      if (
        variable.defs.some((def) => def.type === 'ImportBinding') &&
        variable.references.length === 0
      )
        problems.push(`${file}: unused import ${variable.name}`);
  if (domain)
    for (const ref of scopes.globalScope.through)
      if (
        ['document', 'window', 'navigator', 'location', 'localStorage', 'fetch'].includes(
          ref.identifier.name,
        )
      )
        problems.push(`${file}: browser access in domain code`);
}
const complete = new Set(),
  visiting = new Set();
function visit(file) {
  if (visiting.has(file)) {
    problems.push(`Import cycle at ${file}`);
    return;
  }
  if (complete.has(file)) return;
  visiting.add(file);
  for (const target of dependencies.get(file) || []) visit(target);
  visiting.delete(file);
  complete.add(file);
}
for (const file of files) visit(file);
if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Architecture: ${files.length} modules, no cycles, undefined names or boundary violations.`,
  );
