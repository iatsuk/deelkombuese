import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, recipeById, products, productById, mapProductGroups } from '../src/data.js';
import {
  prepareRecipe,
  recipeSteps,
  recipeMatches,
  choicesForSelection,
  shoppingItems,
  migrateRecipeEntry,
} from '../src/model.js';
import { waterBudget, buildTrip } from '../src/planner.js';

const generator = recipeById['dish-generator'];
test('Все вкусовые профили работают на каждой основе с целыми упаковками', () => {
  for (const base of generator.generator.bases) {
    for (const preset of generator.generator.presets) {
      const prepared = prepareRecipe(generator, { pasta: base.id }, {}, null, preset.modules);
      assert.equal(prepared.ingredients.find((i) => i.originalId === 'pasta').id, base.id);
      assert.ok(prepared.title.startsWith(base.label));
      assert.ok(prepared.time >= prepared.active);
      assert.ok(prepared.water > 0);
      assert.equal(prepared.modules.filter((m) => m.group === 'sauce').length, 1);
      assert.equal(
        new Set(prepared.ingredients.map((i) => i.id)).size,
        prepared.ingredients.length,
      );
      for (const item of prepared.ingredients)
        if (item.package) assert.equal(item.amount, item.package.edible);
      assert.ok(recipeSteps(generator, { pasta: base.id }, preset.modules, prepared).length >= 3);
    }
  }
});
test('Замена пасты рисом или картофелем меняет воду, время и технику', () => {
  const pasta = prepareRecipe(generator, {}, {}, null, ['sauce-tomato']);
  const risotto = prepareRecipe(generator, { pasta: 'risottoRice' }, {}, null, ['sauce-tomato']);
  const potato = prepareRecipe(generator, { pasta: 'potato' }, {}, null, ['sauce-tomato']);
  assert.ok(risotto.water > pasta.water);
  assert.ok(risotto.active > pasta.active);
  assert.ok(potato.water >= 180);
  assert.ok(potato.time > pasta.time);
  const steps = recipeSteps(generator, { pasta: 'potato' }, ['sauce-tomato'], potato);
  const boil = steps.findIndex((s) => s.includes('15–20'));
  const tomato = steps.findIndex((s) => s.startsWith('Только когда картофель'));
  assert.ok(boil >= 0 && tomato > boil);
  assert.ok(
    recipeSteps(generator, { pasta: 'risottoRice' }, [], risotto).some((s) =>
      s.includes('не промывайте'),
    ),
  );
});
test('Соус и белок выбираются по одному, овощные добавки можно сочетать', () => {
  const prepared = prepareRecipe(generator, {}, {}, null, [
    'sauce-tomato',
    'sauce-cream',
    'fish',
    'beans',
    'peas',
    'mushrooms',
  ]);
  assert.deepEqual(
    prepared.modules.filter((m) => m.group === 'sauce').map((m) => m.id),
    ['sauce-cream'],
  );
  assert.deepEqual(
    prepared.modules.filter((m) => m.group === 'protein').map((m) => m.id),
    ['beans'],
  );
  for (const id of ['peas', 'mushrooms']) assert.ok(prepared.ingredients.some((i) => i.id === id));
  assert.equal(recipeMatches(generator, ['pasta', 'potato']), false);
  assert.equal(recipeMatches(generator, ['cream', 'tomatoPaste']), false);
  assert.equal(recipeMatches(generator, ['cream', 'mushrooms', 'peas']), true);
  const inferred = choicesForSelection(generator, ['risottoRice', 'cream', 'mushrooms']);
  assert.equal(inferred.choices.pasta, 'risottoRice');
  assert.ok(inferred.modules.includes('sauce-cream'));
});
test('Маленькие и большие пакеты сливок сохраняют размер, при замене доступны молоко и порошок', () => {
  for (const size of [65, 125, 200]) {
    const prepared = prepareRecipe(generator, {}, { cream: size }, null, [
      'sauce-cream',
      'mushrooms',
    ]);
    assert.equal(prepared.ingredients.find((i) => i.id === 'cream').amount, size);
    const line = shoppingItems([{ count: 2, ingredients: prepared.ingredients }], []).find(
      (i) => i.id === 'cream',
    );
    assert.equal(line.amount, 2);
    assert.equal(line.package.size, size);
  }
  assert.ok(
    prepareRecipe(generator, { cream: 'milkPowder' }, {}, null, ['sauce-cream']).ingredients.some(
      (i) => i.id === 'milkPowder',
    ),
  );
  assert.ok(
    prepareRecipe(generator, { cream: 'milk' }, {}, null, ['sauce-cream']).ingredients.some(
      (i) => i.id === 'milk',
    ),
  );
  assert.equal(productById.cream.afterLife, '≤ 2 ч / 1 ч в жару');
});
test('Все прежние соусные карточки мигрируют с сохранением состава', () => {
  for (const [id, sauce] of [
    ['pasta-tomato', 'sauce-tomato'],
    ['pasta-garlic', 'sauce-garlic'],
    ['pasta-peanut', 'sauce-peanut'],
    ['pasta-milk', 'sauce-cream'],
  ]) {
    const migrated = migrateRecipeEntry({
      recipeId: id,
      choices: id === 'pasta-milk' ? { milkPowder: 'milk' } : { tomatoPaste: 'passata' },
      packSizes: { milk: 200, passata: 500 },
      modules: ['seasoning'],
    });
    assert.equal(migrated.recipeId, 'dish-generator');
    assert.ok(migrated.modules.includes(sauce));
    if (id === 'pasta-milk') assert.equal(migrated.choices.cream, 'milk');
    assert.deepEqual(migrateRecipeEntry(migrated), migrated);
  }
  assert.ok(!recipes.some((r) => r.id.startsWith('pasta-')));
});
test('Группы карты делят овощи и специи и не выделяют томаты в отдельный раздел', () => {
  const groupIds = new Set(mapProductGroups.map((g) => g.id));
  for (const product of products) assert.ok(groupIds.has(product.graphGroup), product.id);
  assert.equal(productById.carrot.graphGroup, 'vegetables');
  assert.equal(productById.driedCarrot.graphGroup, 'vegetables');
  assert.equal(productById.sauerkraut.graphGroup, 'vegetables');
  assert.equal(productById.cumin.graphGroup, 'spices');
  assert.equal(productById.driedGarlic.graphGroup, 'spices');
  assert.equal(productById.tomato.graphGroup, 'vegetables');
  assert.equal(productById.passata.graphGroup, 'sauces');
  assert.ok(!mapProductGroups.some((g) => g.id === 'tomatoes'));
});
test('Щи превращаются в борщ модулем свёклы; все открытые консервы расходуются целиком', () => {
  const recipe = recipeById['soup-generator'];
  const shchi = prepareRecipe(recipe, { technique: 'sauerkraut' });
  const borscht = prepareRecipe(recipe, { technique: 'sauerkraut' }, {}, null, [
    'borscht',
    'tomatoes',
  ]);
  assert.ok(shchi.title.startsWith('Щи'));
  assert.ok(borscht.title.startsWith('Борщ'));
  assert.ok(!shchi.ingredients.some((i) => i.id === 'beetCanned'));
  assert.ok(borscht.ingredients.some((i) => i.id === 'beetCanned'));
  assert.ok(borscht.yieldGrams <= 750);
  for (const item of borscht.ingredients)
    if (item.package) assert.equal(item.amount, item.package.edible);
  assert.ok(
    recipeSteps(recipe, { technique: 'sauerkraut' }).some((s) =>
      s.includes('до полной мягкости картофеля'),
    ),
  );
});
test('Промывание капусты отдельно добавляет воду и зависит от её упаковки', () => {
  const recipe = recipeById['soup-generator'];
  const shchi = { technique: 'sauerkraut' };
  const plain = prepareRecipe(recipe, shchi);
  const rinsed = prepareRecipe(recipe, shchi, {}, null, ['rinse']);
  assert.equal(rinsed.water, plain.water);
  assert.equal(rinsed.prepWater - plain.prepWater, 300);
  const otherAnchor = prepareRecipe(
    recipe,
    { ...shchi, tomatoPaste: 'passata' },
    { passata: 500 },
    'passata',
    ['rinse', 'tomatoes'],
  );
  assert.equal(otherAnchor.prepWater, 300);
  const large = prepareRecipe(recipe, shchi, { sauerkraut: 400 }, null, ['rinse']);
  assert.equal(large.prepWater, 700);
  const entry = { recipeId: recipe.id, choices: shchi, modules: ['rinse'] };
  assert.equal(waterBudget([entry]).preparation, 0.3);
  const week = buildTrip({ days: 7 });
  assert.ok(week.entries.some((e) => e.recipeId === recipe.id && e.modules.includes('rinse')));
});
