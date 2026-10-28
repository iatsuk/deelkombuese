import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeById } from '../src/data.js';
import {
  prepareRecipe,
  recipeSteps,
  selectionIssues,
  normalizeSelection,
  optionBlocked,
} from '../src/model.js';

const i = (id, amount, unit = 'г') => ({ id, amount, unit, alternatives: [] });
// A small eggs-like generator: the technique is the base, the carrier is a single choice.
const sample = {
  id: 'sample-generator',
  title: 'Sample',
  base: 'eggs',
  time: 8,
  active: 5,
  desc: '',
  ingredients: [i('eggs', 2, 'шт.'), i('oil', 10, 'мл')],
  water: 0,
  steps: [],
  vessel: 'pan',
  meal: 'main',
  satiety: '2–3 ч',
  shore: false,
  tone: 'gold',
  kind: 'generator',
  generator: {
    choiceKey: 'technique',
    defaultModules: ['plain'],
    bases: [
      { id: 'fry', label: 'Яичница', time: 8, active: 5, water: 0 },
      {
        id: 'poach',
        label: 'Яйца в соусе',
        time: 15,
        active: 5,
        water: 20,
        requires: ['tomato'],
        reason: 'Нужен томатный соус.',
        steps: [{ phase: 'cook', text: 'Разбейте яйца в соус.' }],
      },
    ],
    dishes: [
      { name: 'Яичница с хлебом', base: 'fry', modules: ['bread'] },
      { name: 'Шакшука', base: 'poach', modules: ['tomato'] },
      { name: 'Шакшука с картофелем', base: 'poach', modules: ['tomato', 'potato'] },
    ],
    phases: ['prepare', 'cook', 'serve'],
    steps: [
      { phase: 'serve', text: 'Съешьте сразу.' },
      { phase: 'prepare', text: 'Разогрейте сковороду.' },
    ],
  },
  modules: [
    { id: 'plain', label: 'Без основы', group: 'carrier', ingredients: [] },
    { id: 'bread', label: 'Хлеб', group: 'carrier', ingredients: [i('bread', 100)] },
    {
      id: 'tomato',
      label: 'Томаты',
      group: 'carrier',
      ingredients: [i('passata', 200)],
      excludes: ['fry'],
      reason: 'Яйца в томатах готовят способом «томить в соусе».',
      steps: [{ phase: 'prepare', text: 'Прогрейте томаты.' }],
    },
    { id: 'potato', label: 'Картофель', ingredients: [i('potato', 150)] },
  ],
};

test('A generator names the most specific matching dish', () => {
  assert.equal(prepareRecipe(sample, { technique: 'fry' }).title, 'Яичница');
  assert.equal(
    prepareRecipe(sample, { technique: 'fry' }, {}, null, ['bread']).title,
    'Яичница с хлебом',
  );
  assert.equal(
    prepareRecipe(sample, { technique: 'poach' }, {}, null, ['tomato']).title,
    'Шакшука',
  );
  assert.equal(
    prepareRecipe(sample, { technique: 'poach' }, {}, null, ['tomato', 'potato']).title,
    'Шакшука с картофелем',
  );
});

test('Default modules fill an empty group and give way to a choice', () => {
  assert.deepEqual(
    prepareRecipe(sample, { technique: 'fry' }).modules.map((m) => m.id),
    ['plain'],
  );
  assert.deepEqual(
    prepareRecipe(sample, { technique: 'fry' }, {}, null, ['bread']).modules.map((m) => m.id),
    ['bread'],
  );
});

test('Rules report a reason, block options and repair selections', () => {
  assert.deepEqual(selectionIssues(sample, { technique: 'poach' }, ['bread']), [
    { id: 'poach', reason: 'Нужен томатный соус.' },
  ]);
  assert.deepEqual(selectionIssues(sample, { technique: 'fry' }, ['tomato']), [
    { id: 'tomato', reason: 'Яйца в томатах готовят способом «томить в соусе».' },
  ]);
  assert.equal(
    optionBlocked(sample, { technique: 'fry' }, [], 'tomato'),
    'Яйца в томатах готовят способом «томить в соусе».',
  );
  assert.equal(optionBlocked(sample, { technique: 'poach' }, [], 'tomato'), null);
  assert.deepEqual(normalizeSelection(sample, { technique: 'fry' }, ['tomato', 'potato']), [
    'potato',
  ]);
  assert.deepEqual(normalizeSelection(sample, { technique: 'poach' }, ['missing']), ['tomato']);
});

test('Steps from the generator, its base and modules follow the phase order', () => {
  const choices = { technique: 'poach' };
  const prepared = prepareRecipe(sample, choices, {}, null, ['tomato']);
  assert.deepEqual(recipeSteps(sample, choices, ['tomato'], prepared), [
    'Разогрейте сковороду.',
    'Прогрейте томаты.',
    'Разбейте яйца в соус.',
    'Съешьте сразу.',
  ]);
  assert.equal(prepared.time, 15);
  assert.equal(prepared.water, 20);
});

test('Generator option ids are unique across bases and modules', () => {
  for (const recipe of Object.values(recipeById).filter((r) => r.generator)) {
    const ids = [...recipe.generator.bases.map((b) => b.id), ...recipe.modules.map((m) => m.id)];
    assert.equal(new Set(ids).size, ids.length, recipe.id);
    for (const preset of recipe.generator.presets || [])
      assert.deepEqual(selectionIssues(recipe, {}, preset.modules), [], preset.id);
  }
});
