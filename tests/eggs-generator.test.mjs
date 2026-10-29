import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipeById, recipeMigrations } from '../src/data.js';
import {
  prepareRecipe,
  recipeSteps,
  selectionIssues,
  normalizeSelection,
  optionBlocked,
  choicesForSelection,
  migrateRecipeEntry,
  effectiveIngredients,
} from '../src/model.js';
import { normalizeFavorites, favoriteKey } from '../src/preferences.js';
import { loadState } from '../src/state/storage.js';
import { buildTrip } from '../src/planner.js';

// Numbers of the standalone egg recipes, recorded before they moved into the chapter.
const legacy = JSON.parse(
  readFileSync(new URL('./fixtures/legacy-egg-recipes.json', import.meta.url), 'utf8'),
);

const eggs = recipeById['eggs-generator'];
const group = (id) => [null, ...eggs.modules.filter((m) => m.group === id).map((m) => m.id)];

test('Every valid egg combination is cookable with whole packs', () => {
  let valid = 0;
  for (const base of eggs.generator.bases)
    for (const sauce of group('sauce'))
      for (const side of group('side')) {
        const choices = { technique: base.id };
        const modules = [sauce, side].filter(Boolean);
        if (selectionIssues(eggs, choices, modules).length) continue;
        valid++;
        const prepared = prepareRecipe(eggs, choices, {}, null, modules);
        assert.ok(Number.isFinite(prepared.water) && prepared.water >= 0, prepared.title);
        assert.ok(prepared.time >= prepared.active, prepared.title);
        assert.ok(prepared.eggConditional);
        const ids = prepared.ingredients.map((i) => i.id);
        assert.equal(new Set(ids).size, ids.length, prepared.title);
        for (const item of prepared.ingredients)
          if (item.package) assert.equal(item.amount, item.package.edible);
        const steps = recipeSteps(eggs, choices, modules, prepared);
        assert.ok(steps.length >= 3, prepared.title);
        assert.ok(steps[0].includes('Разбейте яйца непосредственно перед готовкой'));
        assert.ok(steps.at(-1).startsWith('Съешьте сразу'));
      }
  assert.ok(valid >= 20);
});

test('Each named egg dish is a valid combination that carries its name', () => {
  for (const dish of eggs.generator.dishes) {
    const choices = { technique: dish.base };
    assert.deepEqual(selectionIssues(eggs, choices, dish.modules), [], dish.name);
    assert.equal(prepareRecipe(eggs, choices, {}, null, dish.modules).title, dish.name);
  }
});

test('Egg rules explain themselves and repair a selection', () => {
  assert.deepEqual(normalizeSelection(eggs, { technique: 'poach' }, []), ['tomato']);
  assert.deepEqual(normalizeSelection(eggs, { technique: 'dip' }, []), ['bread']);
  assert.deepEqual(normalizeSelection(eggs, { technique: 'fry' }, ['tomato', 'bread']), ['bread']);
  assert.match(optionBlocked(eggs, { technique: 'scramble' }, [], 'curry'), /томят/);
  assert.match(optionBlocked(eggs, { technique: 'omelette' }, [], 'rice'), /Рис/);
  assert.equal(optionBlocked(eggs, { technique: 'scramble' }, [], 'tomato'), null);
  assert.match(optionBlocked(eggs, { technique: 'fry' }, [], 'milk'), /взбитые/);
});

const migrated = (entry) => {
  const { choices, modules, packSizes } = migrateRecipeEntry(entry);
  return prepareRecipe(eggs, choices, packSizes, null, normalizeSelection(eggs, choices, modules));
};
const amounts = (prepared) =>
  Object.fromEntries(prepared.ingredients.map((i) => [i.id, `${i.amount} ${i.unit}`]));

test('Fried eggs with bread and shakshuka keep the numbers of the former recipes', () => {
  for (const before of legacy.filter((c) => c.id !== 'french-toast')) {
    const label = `${before.id} ${before.modules.join('+')} ${JSON.stringify(before.choices)}`;
    const after = migrated({
      recipeId: before.id,
      modules: before.modules,
      choices: before.choices,
      packSizes: before.packs,
    });
    for (const key of ['time', 'active', 'water', 'yieldGrams', 'shore'])
      assert.equal(after[key], before[key], `${label} ${key}`);
    assert.deepEqual(amounts(after), before.ingredients, label);
  }
});

// French toast moved to the chapter's portion: two slices and measured milk powder
// instead of 150 g of bread and a 125 ml carton; time, work and toppings stay.
test('French toast keeps its time and toppings on measured milk powder', () => {
  for (const before of legacy.filter((c) => c.id === 'french-toast')) {
    const after = migrated({ recipeId: before.id, modules: before.modules });
    assert.equal(after.title, 'Французские тосты');
    for (const key of ['time', 'active', 'shore']) assert.equal(after[key], before[key], key);
    const { bread, milk, ...rest } = before.ingredients;
    assert.deepEqual(amounts(after), { ...rest, bread: '100 г', milkPowder: '15 г' });
    assert.ok(bread && milk);
    assert.equal(after.water, 75);
  }
  assert.equal(prepareRecipe(eggs, { technique: 'dip' }, {}, null, ['bread']).title, 'Гренки');
  const offered = (technique) =>
    effectiveIngredients(eggs, ['bread'], { technique })
      .find((i) => i.id === 'bread')
      .alternatives.map((a) => a.id);
  assert.ok(offered('fry').includes('crispbread'));
  assert.ok(!offered('dip').includes('crispbread'));
  // Powder is measured by the portion; the chapter does not offer a carton of milk.
  assert.ok(!effectiveIngredients(eggs, ['milk']).at(-1).alternatives.length);
  // A chosen substitute that the technique rules out falls back to the bread itself.
  const soaked = prepareRecipe(eggs, { technique: 'dip', bread: 'crispbread' }, {}, null, [
    'bread',
  ]);
  assert.ok(soaked.ingredients.some((i) => i.id === 'bread'));
});

test('Toppings and ham follow the toast rules', () => {
  const toast = { technique: 'dip' };
  assert.match(optionBlocked(eggs, { technique: 'fry' }, ['bread'], 'honey'), /тостам/);
  assert.match(optionBlocked(eggs, toast, ['bread', 'honey'], 'seasoning'), /не солят/);
  assert.match(optionBlocked(eggs, toast, ['bread', 'honey'], 'ham'), /к мёду/);
  assert.match(optionBlocked(eggs, { technique: 'poach' }, ['tomato'], 'ham'), /в соус/);
  assert.equal(optionBlocked(eggs, { technique: 'fry' }, [], 'ham'), null);
  assert.deepEqual(normalizeSelection(eggs, toast, ['bread', 'honey', 'seasoning']), [
    'bread',
    'honey',
  ]);
  const steps = recipeSteps(eggs, toast, ['bread', 'ham', 'cheese']);
  assert.ok(steps.some((s) => s.includes('по готовым тостам')));
  assert.ok(!recipeSteps(eggs, { technique: 'fry' }, ['ham']).some((s) => s.includes('тостам')));
});

test('Tomato substitutes keep the sauce liquid and change the sauce step', () => {
  const sauce = (choices) => {
    const prepared = prepareRecipe(eggs, { technique: 'poach', ...choices }, {}, null, ['tomato']);
    return {
      water: prepared.water,
      step: recipeSteps(eggs, { technique: 'poach', ...choices }, ['tomato'], prepared)[1],
    };
  };
  assert.match(sauce({}).step, /пассату/);
  assert.match(sauce({ passata: 'tomatoPaste' }).step, /томатную пасту водой/);
  assert.match(sauce({ passata: 'ketchup' }).step, /кетчуп/);
  assert.match(sauce({ passata: 'tomato' }).step, /Нарежьте томаты/);
  assert.ok(sauce({ passata: 'tomatoPaste' }).water > 100);
  assert.equal(sauce({ passata: 'tomato' }).water, 20);
  const curry = (choices) =>
    prepareRecipe(eggs, { technique: 'poach', ...choices }, {}, null, ['curry']).water;
  assert.ok(curry({ tomatoPaste: 'passata' }) < curry({}));
});

test('Saved egg recipes, plans and passage overrides move into the chapter', () => {
  for (const id of ['eggs-bread', 'shakshuka', 'french-toast'])
    assert.equal(recipeMigrations[id].recipeId, 'eggs-generator');
  const favorites = normalizeFavorites([
    { recipeId: 'eggs-bread', modules: ['seasoning'] },
    { recipeId: 'shakshuka', modules: ['potato'], packSizes: { passata: 500 } },
    { recipeId: 'french-toast', modules: ['ham-cheese'], choices: { milk: 'milkPowder' } },
  ]);
  assert.deepEqual(favorites.map(favoriteKey), [
    'eggs-generator:fry:bread,seasoning',
    'eggs-generator:poach:potato,tomato',
    'eggs-generator:dip:bread,cheese,ham,milk',
  ]);
  assert.deepEqual(favorites[1].packSizes, { passata: 500 });
  assert.deepEqual(favorites[2].choices, { technique: 'dip' });
  const { saved } = loadState({
    getItem: () =>
      JSON.stringify({
        plan: [{ recipeId: 'french-toast', modules: ['jam'], count: 1 }],
        builderMeta: { kind: 'trip', days: 2, overrides: { '1-lunch': 'shakshuka' } },
      }),
  });
  assert.equal(saved.plan[0].recipeId, 'eggs-generator');
  assert.deepEqual(saved.plan[0].modules, ['bread', 'milk', 'jam']);
  assert.equal(saved.plan[0].choices.technique, 'dip');
  assert.equal(saved.builderMeta.overrides['1-lunch'], 'eggs-generator');
});

test('A passage with eggs has sweet French toast at breakfast and shakshuka at lunch', () => {
  const plan = buildTrip({ days: 2, includeEggs: true });
  const toast = plan.entries.find((e) => e.day === 1 && e.slot === 'breakfast');
  const shakshuka = plan.entries.find((e) => e.day === 2 && e.slot === 'lunch');
  for (const [entry, title] of [
    [toast, 'Французские тосты'],
    [shakshuka, 'Шакшука'],
  ]) {
    assert.equal(entry.recipeId, 'eggs-generator');
    assert.deepEqual(selectionIssues(eggs, entry.choices, entry.modules), []);
    assert.equal(prepareRecipe(eggs, entry.choices, {}, null, entry.modules).title, title);
  }
  assert.ok(toast.modules.includes('honey'));
  assert.ok(!toast.modules.includes('seasoning'));
  assert.ok(shakshuka.modules.includes('aromatics'));
});

test('The map infers shakshuka from eggs and passata, and cheese needs the shore', () => {
  const inferred = choicesForSelection(eggs, ['eggs', 'passata']);
  assert.equal(inferred.choices.technique, 'poach');
  assert.equal(prepareRecipe(eggs, inferred.choices, {}, null, inferred.modules).title, 'Шакшука');
  assert.equal(choicesForSelection(eggs, ['eggs']).choices.technique, 'fry');
  assert.equal(prepareRecipe(eggs, { technique: 'fry' }, {}, null, ['cheese']).shore, true);
});
