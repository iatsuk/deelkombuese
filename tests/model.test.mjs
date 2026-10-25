import test from 'node:test';
import assert from 'node:assert/strict';
import { products, recipes, recipeById, productById } from '../src/data.js';
import {
  availableRecipe,
  missingIngredients,
  resolveIngredient,
  shoppingItems,
  prepareRecipe,
  formatShoppingAmount,
} from '../src/model.js';

test('Каталог и рецепты имеют уникальные ссылки и корректные количества', () => {
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  assert.equal(new Set(recipes.map((p) => p.id)).size, recipes.length);
  for (const recipe of recipes) {
    assert.ok(recipe.time >= recipe.active);
    for (const i of recipe.ingredients) {
      for (const option of [i, ...i.alternatives]) {
        assert.ok(productById[option.id]);
        assert.ok(option.amount > 0);
        assert.ok(option.unit);
      }
    }
    if (recipe.ingredients.some((i) => i.id === 'beef')) assert.equal(recipe.shore, true);
  }
});
test('Рецепт доступен с заменой, даже если исходного продукта нет', () => {
  const recipe = recipeById['dish-generator'];
  const pantry = ['pasta', 'sardines', 'ketchup', 'aromatics', 'oil'];
  assert.equal(availableRecipe(recipe, pantry, ['sauce-tomato', 'fish']), true);
  assert.deepEqual(missingIngredients(recipe, pantry), []);
  assert.equal(
    availableRecipe(
      recipe,
      pantry.filter((x) => x !== 'pasta'),
      ['sauce-tomato', 'fish'],
    ),
    false,
  );
});
test('Выбранная замена меняет ингредиент и количество закупки', () => {
  const tomato = recipeById['dish-generator'].modules
    .find((m) => m.id === 'sauce-tomato')
    .ingredients.find((i) => i.id === 'tomatoPaste');
  const choice = resolveIngredient(tomato, 'passata');
  assert.equal(choice.amount, 150);
  const items = shoppingItems([{ count: 2, ingredients: [choice] }], []);
  assert.deepEqual(items, [{ id: 'passata', amount: 300, unit: 'г', key: 'passata:г' }]);
});
test('Закупка складывает порции и не смешивает единицы измерения', () => {
  const items = shoppingItems(
    [
      { count: 2, ingredients: [{ id: 'rice', amount: 100, unit: 'г' }] },
      { count: 1, ingredients: [{ id: 'rice', amount: 90, unit: 'г' }] },
    ],
    [],
    [{ id: 'rice', amount: 1, unit: 'уп.' }],
  );
  assert.equal(items.length, 2);
  assert.equal(items.find((i) => i.unit === 'г').amount, 290);
});
test('Продукты из рундука исключаются и из рецептов, и из ручного списка', () => {
  assert.deepEqual(
    shoppingItems(
      [{ count: 1, ingredients: [{ id: 'rice', amount: 100, unit: 'г' }] }],
      ['rice'],
      [{ id: 'rice', amount: 1, unit: 'уп.' }],
    ),
    [],
  );
});

test('Пассата 500 г расходуется полностью, остальные открытые банки остаются целыми', () => {
  const prepared = prepareRecipe(
    recipeById['dish-generator'],
    { tomatoPaste: 'passata' },
    { passata: 500 },
    null,
    ['sauce-tomato', 'fish'],
  );
  const tomatoes = prepared.ingredients.find((i) => i.id === 'passata');
  assert.equal(tomatoes.amount, 500);
  assert.equal(tomatoes.package.size, 500);
  assert.equal(prepared.ingredients.find((i) => i.id === 'tuna').package.count, 1);
  assert.ok(prepared.ingredients.find((i) => i.id === 'pasta').amount > 300);
  assert.ok(prepared.yieldGrams > 750);
  const line = shoppingItems([{ count: 1, ingredients: prepared.ingredients }], []).find(
    (i) => i.id === 'passata',
  );
  assert.equal(line.unit, 'уп.');
  assert.equal(line.amount, 1);
  assert.equal(formatShoppingAmount(line), '1 уп. × 500 г');
});

test('Банки одного продукта разного размера не объединяются в безразмерные граммы', () => {
  const small = prepareRecipe(recipeById.shakshuka, {}, { passata: 200 });
  const large = prepareRecipe(recipeById.shakshuka, {}, { passata: 500 });
  const lines = shoppingItems(
    [
      { count: 1, ingredients: small.ingredients },
      { count: 2, ingredients: large.ingredients },
    ],
    [],
  ).filter((i) => i.id === 'passata');
  assert.equal(lines.length, 2);
  assert.equal(lines.find((i) => i.package.size === 500).amount, 2);
  assert.equal(large.ingredients.find((i) => i.id === 'eggs').amount, 5);
});

test('Сухая морковь доступна вместо свежей, а дополнительная вода учитывается', () => {
  const recipe = recipeById.pilaf;
  const pantry = recipe.ingredients.map((i) => (i.id === 'carrot' ? 'driedCarrot' : i.id));
  assert.equal(availableRecipe(recipe, pantry), true);
  const prepared = prepareRecipe(recipe, { carrot: 'driedCarrot' });
  assert.equal(prepared.ingredients.find((i) => i.id === 'driedCarrot').amount, 12);
  assert.equal(prepared.water, prepareRecipe(recipe).water + 60);
});

test('У каждого продукта есть самостоятельный срок и условия после открытия', () => {
  for (const p of products) {
    assert.ok(p.afterLife, p.id);
    assert.ok(p.after, p.id);
    assert.ok(!p.afterLife.includes('по этикетке'));
  }
  for (const id of [
    'buckwheat',
    'corn',
    'peas',
    'driedCarrot',
    'driedOnion',
    'driedGarlic',
    'bread',
    'rolls',
    'eggs',
    'eggsCold',
  ])
    assert.ok(productById[id]);
  assert.ok(recipes.some((r) => r.meal === 'snack' && r.vessel === 'cold'));
  assert.ok(
    recipes.some((r) => r.meal === 'breakfast' && r.ingredients.some((i) => i.id === 'eggs')),
  );
});

test('Все скоропортящиеся упаковки каждого варианта рецепта используются целиком', () => {
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      for (const choice of [ingredient, ...ingredient.alternatives]) {
        const prepared = prepareRecipe(recipe, { [ingredient.id]: choice.id });
        for (const i of prepared.ingredients.filter((i) => i.package)) {
          assert.equal(i.amount, i.package.edible, `${recipe.id}:${i.id}`);
          assert.equal(i.package.count, 1);
        }
      }
    }
  }
});

test('Для целого пакета пассаты 500 г есть компактный суп для одной готовки', () => {
  const prepared = prepareRecipe(recipeById['tomato-pack-soup']);
  assert.equal(prepared.ingredients.find((i) => i.id === 'passata').amount, 500);
  assert.ok(prepared.yieldGrams <= 750);
  assert.ok(prepared.ingredients.every((i) => !i.package || i.amount === i.package.edible));
});
