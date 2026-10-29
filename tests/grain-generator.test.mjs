import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipeById } from '../src/data.js';
import {
  prepareRecipe,
  recipeSteps,
  optionBlocked,
  choicesForSelection,
  migrateRecipeEntry,
  normalizeSelection,
} from '../src/model.js';
import { buildTrip } from '../src/planner.js';

const grain = recipeById['grain-generator'];
const prepared = (technique, modules = [], choices = {}) =>
  prepareRecipe(grain, { technique, ...choices }, {}, null, modules);
const legacy = JSON.parse(
  readFileSync(new URL('./fixtures/legacy-grain-recipes.json', import.meta.url), 'utf8'),
);
const migrated = ({ id, modules, choices, packs }) => {
  const entry = migrateRecipeEntry({ recipeId: id, modules, choices, packSizes: packs });
  const ids = normalizeSelection(grain, entry.choices, entry.modules);
  return prepareRecipe(grain, entry.choices, entry.packSizes, null, ids);
};

test('Rice and buckwheat take water by the mug rule, couscous and oats by the batch', () => {
  assert.equal(prepared('rice').water, 225);
  assert.equal(prepared('buckwheat').water, 250);
  // A whole can of coconut milk brings part of the liquid for a curry.
  assert.equal(prepared('rice', ['chickpeas', 'curry', 'coconut']).water, 113);
  assert.equal(prepared('couscous').water, 120);
  assert.equal(prepared('oats').water, 280);
  assert.match(recipeSteps(grain, { technique: 'rice' }, ['tuna']).join(' '), /сухую кружку/);
  assert.match(recipeSteps(grain, { technique: 'couscous' }, ['chickpeas'])[1], /Выключите огонь/);
  assert.match(recipeSteps(grain, { technique: 'oats' }, ['tuna']).join(' '), /консервы целиком/);
});

// Pilaf and the paella-style rice moved to one 90 g portion of grain, like the other rice
// dishes; buckwheat with meat gives the carrot the same 3 minutes as pilaf.
test('Pilaf, paella-style rice and buckwheat with meat change only where intended', () => {
  for (const before of legacy.filter((c) => ['pilaf', 'paella'].includes(c.id))) {
    const after = migrated(before);
    const ingredients = Object.fromEntries(
      after.ingredients.map((i) => [i.id, `${i.amount} ${i.unit}`]),
    );
    assert.equal(after.time, before.time, before.id);
    assert.equal(after.active, before.active, before.id);
    for (const [id, amount] of Object.entries(before.ingredients))
      if (id !== 'rice' && !Object.keys(before.packs).length && !before.choices.tomatoPaste)
        assert.equal(ingredients[id], amount, `${before.id} ${id}`);
    if (!Object.keys(before.packs).length && !before.choices.tomatoPaste)
      assert.equal(ingredients.rice, '90 г');
  }
  for (const before of legacy.filter((c) => c.id === 'buckwheat-stew')) {
    const after = migrated(before);
    assert.equal(after.time, before.time + 1);
    assert.equal(after.active, 7);
    assert.equal(after.water, before.water);
  }
});

test('Grain rules keep each option with the grain it suits', () => {
  const on = (technique) => ({ technique });
  assert.match(optionBlocked(grain, on('rice'), ['paprika'], 'coconut'), /соусе карри/);
  assert.equal(optionBlocked(grain, on('rice'), ['curry'], 'coconut'), null);
  assert.match(optionBlocked(grain, on('couscous'), [], 'carrot'), /под крышкой/);
  assert.match(optionBlocked(grain, on('oats'), [], 'cumin'), /без пряностей/);
  assert.match(optionBlocked(grain, on('oats'), [], 'bouillon'), /на бульоне/);
  assert.match(optionBlocked(grain, on('oats'), [], 'seasoning'), /солёная/);
  assert.match(optionBlocked(grain, on('rice'), [], 'raisins'), /кускусом/);
  assert.match(optionBlocked(grain, on('rice'), [], 'cheese'), /овсянку/);
});

test('Grain dishes are named, and other combinations name their parts', () => {
  assert.equal(prepared('rice', ['stew', 'cumin', 'carrot']).title, 'Походный плов');
  assert.equal(prepared('buckwheat', ['tuna', 'paprika']).title, 'Гречка · с тунцом · с паприкой');
  assert.match(prepared('rice', ['stew', 'cumin', 'carrot']).tip, /Если нет моркови/);
  assert.match(prepared('couscous').tip, /запаривают/);
  const map = (ids) => {
    const inferred = choicesForSelection(grain, ids);
    return prepareRecipe(grain, inferred.choices, {}, null, inferred.modules).title;
  };
  assert.equal(map(['buckwheat', 'peas']), 'Гречка с зелёным горошком');
  assert.equal(map(['couscous', 'chickpeas']), 'Кускус с нутом');
  assert.equal(map(['oats']), 'Несладкая овсянка');
});

test('A passage takes grain lunches and savoury oats for breakfast', () => {
  const plan = buildTrip({ days: 7 });
  const entry = (day, slot) => plan.entries.find((e) => e.day === day && e.slot === slot);
  const title = (e) => prepareRecipe(grain, e.choices, {}, null, e.modules).title;
  assert.equal(title(entry(1, 'lunch')), 'Гречка с зелёным горошком');
  assert.deepEqual(entry(1, 'lunch').modules, ['peas', 'aromatics', 'bouillon']);
  assert.equal(entry(1, 'lunch').choices.aromatics, 'driedOnion');
  assert.equal(title(entry(4, 'lunch')), 'Рис с кукурузой и тунцом');
  assert.ok(entry(4, 'lunch').modules.includes('seasoning'));
  assert.equal(title(entry(7, 'lunch')), 'Кускус с нутом');
  assert.equal(title(entry(5, 'breakfast')), 'Несладкая овсянка');
  assert.deepEqual(entry(5, 'breakfast').modules, []);
});
