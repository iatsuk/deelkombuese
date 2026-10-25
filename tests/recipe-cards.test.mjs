import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeById } from '../src/data.js';
import { prepareRecipe, recipeSteps } from '../src/model.js';
import { buildRecipeCard } from '../src/recipe-export.js';
import { selectionSnapshot, sameSelection, normalizeFavorites } from '../src/preferences.js';

test('Рис и гречка подробно объясняют мерку, слабый огонь, крышку и проверку готовности', () => {
  for (const id of ['rice-corn', 'buckwheat-peas']) {
    const recipe = recipeById[id],
      prepared = prepareRecipe(recipe),
      steps = recipeSteps(recipe, {}, [], prepared).join('\n');
    assert.match(steps, /ту же ёмкость/);
    assert.match(steps, /повторите ещё раз/);
    assert.match(steps, /самого слабого огня/);
    assert.match(steps, /закройте крышкой/);
    assert.match(steps, /впитала воду/);
    assert.match(steps, /2–3 столовые ложки/);
    assert.match(steps, /выключите горелку/);
  }
  assert.equal(prepareRecipe(recipeById['buckwheat-peas']).water, 250);
  assert.equal(prepareRecipe(recipeById['rice-corn']).water, 225);
});
test('Соус и восстановление овощей используют воду карточки без второй порции сверху', () => {
  const recipe = recipeById.pilaf,
    choices = { carrot: 'driedCarrot' };
  const prepared = prepareRecipe(recipe, choices);
  assert.equal(prepared.water, 310);
  assert.match(recipeSteps(recipe, choices, [], prepared).join(' '), /310 мл/);
  assert.match(recipeSteps(recipe, choices, [], prepared).join(' '), /сверху добавлять не нужно/);
  const curry = recipeById.curry,
    p = prepareRecipe(curry, {}, {}, null, ['coconut']);
  assert.ok(p.water > 100 && p.water < 300);
  assert.match(recipeSteps(curry, {}, ['coconut'], p).join(' '), /жидкий соус/);
});
test('Обычный рис в генераторе готовится под крышкой, арборио — с доливанием', () => {
  const recipe = recipeById['dish-generator'];
  const plain = recipeSteps(recipe, { pasta: 'rice' }, []).join('\n');
  const risotto = recipeSteps(recipe, { pasta: 'risottoRice' }, []).join('\n');
  assert.match(plain, /закройте крышкой/);
  assert.match(plain, /повторите ещё раз/);
  assert.doesNotMatch(risotto, /повторите ещё раз/);
  assert.match(risotto, /доливайте оставшуюся воду частями/);
});
test('PNG получает финальные замены, размеры упаковок, воду и подробные шаги', () => {
  const recipe = recipeById['dish-generator'];
  const selection = {
    choices: { pasta: 'potato', tomatoPaste: 'passata' },
    packSizes: { passata: 500 },
    modules: ['sauce-tomato', 'fish'],
  };
  const card = buildRecipeCard(recipe, selection);
  assert.match(card.title, /Картофель/);
  assert.ok(
    card.ingredients.some(
      (i) => i.id === 'passata' && i.amount === '500 г' && i.package.includes('500 г'),
    ),
  );
  assert.ok(card.ingredients.some((i) => i.id === 'tuna' && i.package.includes('160 г')));
  assert.ok(!card.ingredients.some((i) => i.id === 'pasta' || i.id === 'tomatoPaste'));
  assert.ok(card.water > 0);
  assert.ok(card.steps.some((s) => s.includes('15–20')));
  selection.choices.pasta = 'rice';
  selection.packSizes.passata = 200;
  assert.match(card.title, /Картофель/);
  assert.ok(card.ingredients.some((i) => i.id === 'passata' && i.amount === '500 г'));
  const soup = buildRecipeCard(recipeById['cabbage-soup'], { modules: ['borscht', 'rinse'] });
  assert.equal(soup.prepWater, 300);
  assert.match(soup.title, /Борщ/);
});
test('Избранное восстанавливает конкретный вариант после сериализации браузерного хранилища', () => {
  const recipe = recipeById['dish-generator'];
  const favorite = selectionSnapshot(recipe, { pasta: 'risottoRice' }, { cream: 200 }, null, [
    'mushrooms',
    'sauce-cream',
  ]);
  const restored = normalizeFavorites(JSON.parse(JSON.stringify([favorite])));
  assert.equal(restored.length, 1);
  assert.ok(sameSelection(restored[0], favorite));
  const prepared = prepareRecipe(
    recipe,
    restored[0].choices,
    restored[0].packSizes,
    restored[0].anchorId,
    restored[0].modules,
  );
  assert.match(prepared.title, /Ризотто/);
  assert.equal(prepared.ingredients.find((i) => i.id === 'cream').amount, 200);
  assert.ok(prepared.ingredients.some((i) => i.id === 'mushrooms'));
});
test('Избранное мигрирует старую пасту, игнорирует неизвестные записи и обновляет вариант', () => {
  const restored = normalizeFavorites([
    null,
    'bad',
    { recipeId: 'unknown' },
    { recipeId: 'pasta-milk', choices: { milkPowder: 'milk' }, packSizes: { milk: 200 } },
  ]);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].recipeId, 'dish-generator');
  assert.equal(restored[0].choices.cream, 'milk');
  assert.equal(restored[0].packSizes.milk, 200);
  const updated = selectionSnapshot(recipeById['dish-generator'], { pasta: 'potato' }, {}, null, [
    'sauce-garlic',
  ]);
  assert.deepEqual(normalizeFavorites([...restored, updated]), [updated]);
  assert.deepEqual(normalizeFavorites({}), []);
});
