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
import { buildTrip } from '../src/planner.js';

const cold = recipeById['no-cook-generator'];
const title = (choices, modules) => prepareRecipe(cold, choices, {}, null, modules).title;

test('No-stove rules keep peanut butter on bread and corn in a bowl', () => {
  const bread = { bread: 'bread' };
  const beans = { bread: 'beans' };
  assert.match(optionBlocked(cold, beans, [], 'peanut'), /на хлеб/);
  assert.match(optionBlocked(cold, bread, ['peanut'], 'garlic-oil'), /без масляной/);
  assert.match(optionBlocked(cold, bread, [], 'corn'), /в миске/);
  assert.match(optionBlocked(cold, bread, ['tuna'], 'honey'), /арахисовой/);
  assert.equal(optionBlocked(cold, bread, ['peanut'], 'honey'), null);
  // An empty carrier gets the first filling or dressing it needs.
  assert.deepEqual(normalizeSelection(cold, bread, []), ['tuna']);
  assert.deepEqual(normalizeSelection(cold, beans, []), ['onion-paprika']);
  assert.deepEqual(selectionIssues(cold, { bread: 'crispbread' }, ['peanut']), []);
});

test('No-stove dishes are named by carrier and filling and keep their own satiety', () => {
  assert.equal(title({}, ['tuna', 'garlic-oil']), 'Хлеб с тунцом');
  assert.equal(title({ bread: 'chickpeas' }, ['tuna', 'onion-paprika']), 'Нут с тунцом');
  assert.equal(title({ bread: 'crispbread' }, ['peanut']), 'Хлеб с арахисовой пастой');
  assert.equal(prepareRecipe(cold, {}, {}, null, ['garlic-oil']).satiety, '1–2 ч');
  assert.equal(prepareRecipe(cold, {}, {}, null, ['tuna']).satiety, '2–3 ч');
  assert.equal(prepareRecipe(cold, { bread: 'beans' }, {}, null, ['corn']).satiety, '3–4 ч');
});

test('No-stove steps follow the carrier: spread on bread or mix in a bowl', () => {
  const toast = recipeSteps(cold, {}, ['tuna', 'oil-pepper']);
  assert.deepEqual(toast.slice(0, 3), [
    'Откройте банку рыбы и слейте жидкость.',
    'Разомните рыбу с маслом и перцем на тарелке.',
    'Разложите всю рыбу по хлебу или хлебцам. Если рыбы много, добавьте хлеба.',
  ]);
  assert.match(toast.at(-1), /^Съешьте сразу/);
  const salad = recipeSteps(cold, { bread: 'beans', driedOnion: 'onion' }, [
    'corn',
    'onion-paprika',
  ]);
  assert.match(salad[0], /банку фасоли/);
  assert.match(salad[1], /кукурузы/);
  assert.match(salad[2], /мелко нарезанный лук/);
  assert.ok(!recipeSteps(cold, {}, ['tuna', 'garlic-oil']).some((s) => s.includes('миску круп')));
  assert.match(recipeSteps(cold, {}, ['peanut']).at(-1), /аллергию на арахис/);
});

test('The map finds a no-stove dish from the tins the reader picked', () => {
  const salad = choicesForSelection(cold, ['beans', 'corn']);
  assert.equal(title(salad.choices, salad.modules), 'Фасоль с кукурузой');
  const tuna = choicesForSelection(cold, ['chickpeas', 'tuna']);
  assert.equal(title(tuna.choices, tuna.modules), 'Нут с тунцом');
  assert.equal(title(...Object.values(choicesForSelection(cold, ['tuna']))), 'Хлеб с тунцом');
});

test('A passage takes peanut butter on crispbread at breakfast and garlic bread as a snack', () => {
  const plan = buildTrip({ days: 3, includeEggs: true });
  const breakfast = plan.entries.find((e) => e.day === 3 && e.slot === 'breakfast');
  const snack = plan.entries.find((e) => e.day === 1 && e.slot === 'snack');
  for (const entry of [breakfast, snack]) {
    assert.equal(entry.recipeId, 'no-cook-generator');
    assert.deepEqual(selectionIssues(cold, entry.choices, entry.modules), []);
  }
  assert.deepEqual(breakfast.modules, ['peanut']);
  assert.equal(breakfast.choices.bread, 'crispbread');
  assert.deepEqual(snack.modules, ['garlic-oil']);
  assert.deepEqual(snack.choices, { garlic: 'driedGarlic' });
});
