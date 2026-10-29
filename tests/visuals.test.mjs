import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recipeById } from '../src/data.js';
import { prepareRecipe } from '../src/model.js';
import { grainDiagram, cookingAction } from '../src/cooking-visuals.js';
const root = fileURLToPath(new URL('../', import.meta.url));

test('Схема крупы различает две мерки и уже рассчитанную воду соуса', () => {
  const grain = recipeById['grain-generator'],
    p = prepareRecipe(grain, { technique: 'buckwheat' }, {}, null, ['peas']),
    diagram = grainDiagram(grain, p);
  assert.equal(diagram.adjusted, false);
  assert.equal(diagram.water, 250);
  const withCoconut = prepareRecipe(grain, { technique: 'rice' }, {}, null, [
    'chickpeas',
    'curry',
    'coconut',
  ]);
  assert.equal(grainDiagram(grain, withCoconut).adjusted, true);
  assert.equal(grainDiagram(grain, withCoconut).water, withCoconut.water);
  assert.equal(grainDiagram(grain, prepareRecipe(grain, { technique: 'couscous' })), null);
  const generator = recipeById['dish-generator'];
  assert.equal(grainDiagram(generator, prepareRecipe(generator, { pasta: 'risottoRice' })), null);
  assert.equal(
    grainDiagram(generator, prepareRecipe(generator, { pasta: 'rice' })).adjusted,
    false,
  );
});

test('Пиктограмма различает начало кипения, проверку и отдых, даже если в тексте есть другие действия', () => {
  assert.equal(
    cookingAction('Доведите до кипения на среднем огне. Затем убавьте огонь.').icon,
    'flame',
  );
  assert.equal(cookingAction('Готовьте под закрытой крышкой 15–20 минут.').icon, 'lid');
  assert.equal(cookingAction('Попробуйте крупинку. Если жёсткая, добавьте воды.').icon, 'taste');
  assert.equal(cookingAction('Выключите горелку. Оставьте под крышкой.').icon, 'wait');
});

test('Пакет Pages исключает исходники тестов и служебные файлы; локальные ссылки и офлайн-ресурсы существуют', () => {
  execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: root });
  const output = resolve(root, 'dist');
  for (const name of ['.git', '.github', 'work', 'tests', 'scripts', 'package.json', 'README.md'])
    assert.equal(existsSync(resolve(output, name)), false, name);
  assert.ok(statSync(resolve(output, 'assets/galley.png')).size > 1000);
  assert.ok(existsSync(resolve(output, 'src/cooking-visuals.js')));
  const documents = [
    'index.html',
    'impressum/index.html',
    'datenschutz/index.html',
    'impressum/en/index.html',
    'impressum/de/index.html',
    'datenschutz/en/index.html',
    'datenschutz/de/index.html',
  ];
  for (const document of documents) {
    const path = resolve(output, document),
      html = readFileSync(path, 'utf8');
    for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|#)/.test(value)) continue;
      const target = resolve(dirname(path), value.split(/[?#]/)[0]);
      assert.ok(existsSync(target), `${document}: ${value}`);
    }
  }
  const manifest = readFileSync(resolve(output, 'offline-assets.js'), 'utf8');
  const assets = JSON.parse(manifest.match(/KAMBUZ_OFFLINE_ASSETS=(\[[^;]+\])/)[1]);
  for (const asset of assets) assert.ok(existsSync(resolve(output, asset)), asset);
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)],
    );
  for (const file of walk(resolve(output, 'src')).filter((p) => p.endsWith('.js'))) {
    for (const [, module] of readFileSync(file, 'utf8').matchAll(/from ['"](\.[^'"]+)['"]/g))
      assert.ok(existsSync(resolve(dirname(file), module)), `${file}: ${module}`);
  }
});
