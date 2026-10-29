import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeById } from '../src/data.js';
import {
  prepareRecipe,
  recipeSteps,
  selectionIssues,
  normalizeSelection,
  optionBlocked,
  choicesForSelection,
} from '../src/model.js';

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

test('Fried eggs with bread and shakshuka match the existing recipes', () => {
  for (const [legacyId, technique, modules] of [
    ['eggs-bread', 'fry', ['bread']],
    ['shakshuka', 'poach', ['tomato']],
  ]) {
    const legacy = prepareRecipe(recipeById[legacyId]);
    const generated = prepareRecipe(eggs, { technique }, {}, null, modules);
    for (const key of ['time', 'active', 'water', 'yieldGrams'])
      assert.equal(generated[key], legacy[key], `${legacyId} ${key}`);
    const amounts = (p) =>
      Object.fromEntries(p.ingredients.map((i) => [i.id, `${i.amount} ${i.unit}`]));
    assert.deepEqual(amounts(generated), amounts(legacy), legacyId);
  }
});

test('The map infers shakshuka from eggs and passata, and cheese needs the shore', () => {
  const inferred = choicesForSelection(eggs, ['eggs', 'passata']);
  assert.equal(inferred.choices.technique, 'poach');
  assert.equal(prepareRecipe(eggs, inferred.choices, {}, null, inferred.modules).title, 'Шакшука');
  assert.equal(choicesForSelection(eggs, ['eggs']).choices.technique, 'fry');
  assert.equal(prepareRecipe(eggs, { technique: 'fry' }, {}, null, ['cheese']).shore, true);
});
