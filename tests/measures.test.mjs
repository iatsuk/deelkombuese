import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { volumeHint, volumeMeasures } from '../src/catalog/measures.js';
import { recipeById, sources } from '../src/data.js';
import { prepareRecipe, recipeSteps } from '../src/model.js';
import { buildRecipeCard } from '../src/export/recipe-card.js';
import { localizeRecipeCard } from '../src/i18n/recipe-card.js';
import { createTranslator } from '../src/i18n/messages.js';
import { renderCookingMode } from '../src/ui/cooking-mode.js';

test('Measures are USDA household weights, and unreliable products get none', () => {
  assert.deepEqual(
    [volumeMeasures.rice.grams, volumeMeasures.rice.per, volumeMeasures.rice.fdcId],
    [185, 'cup', 168877],
  );
  assert.equal(Math.round(volumeMeasures.oats.mugGrams), 86);
  assert.equal(volumeMeasures.honey.per, 'tbsp');
  for (const id of ['milkPowder', 'pasta', 'driedCarrot', 'soy', 'passata', 'potato'])
    assert.equal(volumeHint(id, 100, 'г'), null, id);
  assert.ok(sources.some((source) => source.id === 'usda-fdc'));
});

test('A hint keeps to quarter mugs, half tablespoons and coarse teaspoons', () => {
  const cases = [
    ['rice', 90, '≈ ½ кружки'],
    ['rice', 185, '≈ 1 кружка'],
    ['rice', 360, '≈ 1¾ кружки'],
    ['rice', 390, '≈ 2 кружки'],
    ['oats', 80, '≈ 1 кружка'],
    ['flour', 30, '≈ 4 ст. л.'],
    ['raisins', 25, '≈ 2½ ст. л.'],
    // A US tablespoon of onion flakes weighs 5 g and reads as one tablespoon.
    ['driedOnion', 5, '≈ 1 ст. л.'],
    ['honey', 15, '≈ 2 ч. л.'],
    ['bakingPowder', 4, '≈ ¾ ч. л.'],
  ];
  for (const [id, grams, hint] of cases) assert.equal(volumeHint(id, grams, 'г'), hint, id);
  assert.equal(volumeHint('rice', 1, 'ч. л.'), null);
  assert.equal(volumeHint('bakingPowder', 0.5, 'г'), null);
  assert.equal(volumeHint('rice', 0, 'г'), null);
});

test('The recipe page, the stove and the card show the hint for the crew’s amount', () => {
  const grain = recipeById['grain-generator'];
  const choices = { technique: 'rice' };
  const one = prepareRecipe(grain, choices);
  const three = prepareRecipe(grain, choices, {}, null, [], { crew: 3 });
  const rice = (p) => p.ingredients.find((i) => i.id === 'rice');
  assert.notEqual(
    volumeHint('rice', rice(one).amount, 'г'),
    volumeHint('rice', rice(three).amount, 'г'),
  );
  const stove = renderCookingMode({
    title: one.title,
    prepared: one,
    steps: recipeSteps(grain, choices, [], one),
    index: 0,
    timers: {},
    now: 0,
  });
  assert.match(
    stove,
    new RegExp(`<small class="stove-measure">${volumeHint('rice', rice(one).amount, 'г')}</small>`),
  );
  const card = buildRecipeCard(grain, { choices }, { crew: 3 });
  assert.equal(
    card.ingredients.find((i) => i.id === 'rice').measure,
    volumeHint('rice', rice(three).amount, 'г'),
  );
  const en = createTranslator(JSON.parse(readFileSync('locales/en.json', 'utf8')), 'en');
  const localized = localizeRecipeCard(buildRecipeCard(grain, { choices }), en, 'en');
  assert.match(localized.ingredients.find((i) => i.id === 'rice').measure, /^≈ .+ mugs?$/);
});
