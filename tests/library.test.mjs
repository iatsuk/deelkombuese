import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, recipeById, productById, recipeKinds, bases } from '../src/data.js';
import {
  filterRecipes,
  prepareRecipe,
  recipeMatches,
  choicesForSelection,
  migrateRecipeEntry,
  recipeSteps,
} from '../src/model.js';
import { tripCandidates, buildTrip } from '../src/planner.js';

test('Единый завтрак включает яйца и хлеб, а овсянка является отдельной основой', () => {
  const breakfasts = filterRecipes(recipes, { meal: 'breakfast' }).map((r) => r.id);
  for (const id of [
    'oatmeal',
    'french-toast',
    'eggs-bread',
    'shakshuka',
    'pancakes',
    'fritters',
    'oat-fritters',
  ])
    assert.ok(breakfasts.includes(id), id);
  assert.equal(bases.find((b) => b.id === 'oats').name, 'Овсянка');
  assert.ok(!bases.some((b) => /завтрак/i.test(b.name)));
  const oats = filterRecipes(recipes, { meal: 'breakfast', base: 'oats' }).map((r) => r.id);
  assert.ok(oats.includes('oat-fritters'));
  assert.ok(!oats.includes('french-toast'));
  for (const id of breakfasts)
    if (!recipeById[id].eggConditional)
      assert.ok(tripCandidates('breakfast', 3, false).includes(id));
});
test('Виды блюда и основы пересекаются: суп с пастой находится по обоим фильтрам', () => {
  assert.ok(filterRecipes(recipes, { kind: 'soup' }).length >= 4);
  const soup = filterRecipes(recipes, { kind: 'soup', base: 'pasta' });
  assert.deepEqual(
    soup.map((r) => r.id),
    ['broth-soup'],
  );
  const inferred = choicesForSelection(soup[0], ['pasta']);
  const prepared = prepareRecipe(soup[0], inferred.choices);
  assert.equal(prepared.time, 15);
  assert.ok(prepared.ingredients.some((i) => i.id === 'pasta'));
  assert.ok(!prepared.ingredients.some((i) => i.id === 'potato'));
  assert.equal(recipeMatches(soup[0], ['pasta', 'potato']), false);
  for (const r of recipes) {
    assert.ok(
      recipeKinds.some((k) => k.id === r.kind),
      r.id,
    );
    assert.ok(r.mealTags.includes(r.meal));
  }
});
test('Томатная паста — одна основа с взаимоисключающими наполнителями', () => {
  const recipe = recipeById['dish-generator'];
  assert.ok(!prepareRecipe(recipe).ingredients.some((i) => i.id === 'tuna'));
  const selected = choicesForSelection(recipe, ['pasta', 'passata', 'tuna']);
  assert.equal(selected.choices.tomatoPaste, 'passata');
  assert.deepEqual(selected.modules, ['sauce-tomato', 'fish']);
  const fish = prepareRecipe(recipe, selected.choices, { passata: 200 }, null, selected.modules);
  assert.ok(fish.ingredients.some((i) => i.id === 'tuna' && i.package.count === 1));
  assert.equal(fish.ingredients.find((i) => i.id === 'passata').amount, 200);
  const beans = prepareRecipe(recipe, {}, {}, null, ['sauce-tomato', 'fish', 'beans']);
  assert.ok(beans.ingredients.some((i) => i.id === 'beans'));
  assert.ok(!beans.ingredients.some((i) => i.id === 'tuna'));
  assert.equal(recipeMatches(recipe, ['tuna', 'beans']), false);
  const mince = prepareRecipe(recipe, {}, {}, null, ['mince']);
  assert.equal(mince.shore, true);
  assert.ok(recipeSteps(recipe, {}, ['mince']).some((s) => s.includes('71')));
  assert.equal(recipes.filter((r) => r.generator).length, 1);
});
test('Прежние записи пасты и болоньезе сохраняют свой наполнитель после объединения', () => {
  for (const [oldId, module] of [
    ['pasta-tuna', 'fish'],
    ['bolognese', 'mince'],
  ]) {
    const old = {
      recipeId: oldId,
      modules: ['seasoning'],
      count: 2,
      choices: { tomatoPaste: 'passata' },
      packSizes: { passata: 500 },
    };
    const migrated = migrateRecipeEntry(old);
    assert.equal(migrated.recipeId, 'dish-generator');
    assert.ok(migrated.modules.includes(module));
    assert.equal(migrated.count, 2);
    assert.equal(migrated.packSizes.passata, 500);
    assert.equal(migrated.choices.tomatoPaste, 'passata');
    assert.deepEqual(migrateRecipeEntry(migrated), migrated);
  }
});
test('Овсянка и картофель имеют несколько техник, варианты без яиц доступны в море', () => {
  for (const id of [
    'oat-fritters',
    'oat-cutlets',
    'savory-oats',
    'pan-muesli',
    'fritters',
    'potato-pancakes',
    'potato-mash',
    'potato-skillet',
  ]) {
    const p = prepareRecipe(recipeById[id]);
    assert.equal(p.eggConditional, false, id);
    assert.equal(p.shore, false, id);
  }
  assert.ok(prepareRecipe(recipeById['potato-skillet'], {}, {}, null, ['eggs']).eggConditional);
  assert.ok(filterRecipes(recipes, { base: 'oats' }).length >= 6);
  assert.ok(filterRecipes(recipes, { base: 'potato' }).length >= 7);
  const plan = buildTrip({ days: 7 });
  assert.ok(plan.items.some((i) => i.id === 'bakingPowder'));
  assert.ok(plan.items.some((i) => i.id === 'flour'));
  assert.ok(
    new Set(plan.entries.filter((e) => e.slot === 'breakfast').map((e) => e.recipeId)).size >= 5,
  );
});
test('Молочная соусная основа учитывает жидкое молоко вместо порошка', () => {
  const recipe = recipeById['dish-generator'];
  const powder = prepareRecipe(recipe, { cream: 'milkPowder' }, {}, null, ['sauce-cream']);
  const milk = prepareRecipe(recipe, { cream: 'milk' }, { milk: 200 }, null, ['sauce-cream']);
  assert.equal(milk.ingredients.find((i) => i.id === 'milk').amount, 200);
  assert.ok(milk.water < powder.water);
  assert.ok(milk.water > 0);
  assert.ok(!milk.ingredients.some((i) => i.id === 'milkPowder'));
  assert.equal(productById.bakingPowder.afterLife, '3 мес.');
});
test('Составы всех добавок и замен дают конечные количества без повторяющихся продуктов', () => {
  for (const recipe of recipes) {
    for (const module of [null, ...recipe.modules]) {
      const ids = module ? [module.id] : [];
      const prepared = prepareRecipe(recipe, {}, {}, null, ids);
      for (const ingredient of [...recipe.ingredients, ...(module?.ingredients || [])])
        assert.equal(
          new Set(ingredient.alternatives.map((a) => a.id)).size,
          ingredient.alternatives.length,
          recipe.id + ':' + ingredient.id,
        );
      assert.ok(Number.isFinite(prepared.water) && prepared.water >= 0, recipe.id);
      assert.ok(prepared.time >= prepared.active, recipe.id);
      assert.equal(
        new Set(prepared.ingredients.map((i) => i.id)).size,
        prepared.ingredients.length,
        recipe.id,
      );
      for (const ingredient of prepared.ingredients) {
        assert.ok(productById[ingredient.id], recipe.id);
        assert.ok(ingredient.amount > 0);
        if (ingredient.package) assert.equal(ingredient.amount, ingredient.package.edible);
      }
    }
  }
});

test('Generator links round-trip and ignore unknown views', async () => {
  const { parseRoute, routeHash } = await import('../src/state/session.js');
  const route = {
    view: 'generators',
    slug: 'pasta',
    base: 'risottoRice',
    modules: ['sauce-cream', 'peas'],
    choices: { cream: 'milk' },
  };
  const hash = routeHash(route);
  assert.equal(hash, '#generators/pasta?base=risottoRice&with=sauce-cream,peas&swap=cream:milk');
  assert.deepEqual(parseRoute(hash), route);
  assert.deepEqual(parseRoute('#recipes'), {
    view: 'recipes',
    slug: null,
    base: null,
    modules: [],
    choices: {},
  });
  assert.equal(parseRoute('#nowhere/x').view, 'map');
  assert.equal(parseRoute('').view, 'map');
});
