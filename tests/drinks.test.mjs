import test from 'node:test';
import assert from 'node:assert/strict';
import { generators, recipeById, productById, recipes } from '../src/data.js';
import { prepareRecipe, filterRecipes, recipeSteps, normalizeSelection } from '../src/model.js';
import { tripCandidates, waterBudget, gasBudget, mealSlots } from '../src/planner.js';
import { volumeHint } from '../src/catalog/measures.js';
import { recipeUtensils } from '../src/cooking-guide.js';

const drinks = recipeById['drinks-generator'];
const on = (technique) => ({ technique });

test('The drinks chapter closes the book and stays out of the passage planner and meal tabs', () => {
  assert.equal(generators.at(-1), drinks);
  for (const [slot] of mealSlots)
    for (const day of [1, 4, 7]) assert.ok(!tripCandidates(slot, day, true).includes(drinks.id));
  for (const meal of ['breakfast', 'main', 'snack'])
    assert.ok(!filterRecipes(recipes, { meal }).includes(drinks), meal);
  assert.ok(filterRecipes(recipes, { meal: 'all' }).includes(drinks));
  // A kettle drink's water and burner time are the drinking allowance's and the kettle's;
  // compote simmers, so it counts like a dish.
  const entry = (technique) => ({
    recipeId: drinks.id,
    choices: on(technique),
    packSizes: {},
    modules: [],
    count: 2,
  });
  assert.equal(waterBudget([entry('tea')], { days: 1 }).cooking, 0);
  assert.equal(gasBudget([entry('tea')], { days: 1 }).dishMinutes, 0);
  assert.equal(waterBudget([entry('compote')], { days: 1 }).cooking, 0.6);
  assert.equal(gasBudget([entry('compote')], { days: 1 }).dishMinutes, 24);
});

test('Each base is a mug from the dry stock; cocoa on UHT milk stays a full mug', () => {
  for (const technique of ['tea', 'ginger', 'cocoa', 'broth', 'compote']) {
    const p = prepareRecipe(drinks, on(technique));
    assert.equal(p.shore, false, technique);
    assert.ok(p.burner > 0 && p.burner <= p.time, technique);
    assert.ok(recipeSteps(drinks, on(technique), [], p).length >= 3, technique);
  }
  assert.deepEqual(recipeUtensils(drinks, prepareRecipe(drinks, on('tea'))), [
    'чайник или кастрюля с крышкой',
    'кружка',
  ]);
  const uht = prepareRecipe(drinks, { technique: 'cocoa', milkPowder: 'milk' });
  assert.equal(uht.ingredients.find((i) => i.id === 'milk').amount, 250);
  assert.equal(uht.ingredients.find((i) => i.id === 'cocoa').amount, 10);
  assert.equal(uht.title, 'Какао');
  assert.equal(prepareRecipe(drinks, on('compote')).prepWater, 200);
});

test('A tea with ginger and a sweetener keeps both in its name', () => {
  const title = (modules) => prepareRecipe(drinks, on('tea'), {}, null, modules).title;
  assert.equal(title(['tea-ginger', 'honey']), 'Чай с имбирём и мёдом');
  assert.equal(title(['tea-ginger', 'sugar']), 'Сладкий чай с имбирём');
  // Ginger is the ginger drink's own base, so the tea's ginger addition is dropped there.
  assert.deepEqual(normalizeSelection(drinks, on('ginger'), ['tea-ginger']), []);
});

test('Tea, cocoa, sugar and dried fruit are shelf-stable products with retail packs and measures', () => {
  for (const id of ['tea', 'cocoa', 'sugar', 'driedFruit']) {
    assert.equal(productById[id].state, 'dry', id);
    assert.ok(productById[id].retail, id);
  }
  assert.equal(productById.tea.category, 'Чай и какао');
  assert.equal(volumeHint('cocoa', 10, 'г'), '≈ 2 ст. л.');
  assert.equal(volumeHint('sugar', 10, 'г'), '≈ 2½ ч. л.');
  assert.match(productById.driedFruit.note, /сульфит/);
});

test('Cocoa on UHT milk heats the milk first; the stove calls a drink’s water drinking water', async () => {
  const { renderCookingMode } = await import('../src/ui/cooking-mode.js');
  const choices = { technique: 'cocoa', milkPowder: 'milk' };
  const prepared = prepareRecipe(drinks, choices);
  const steps = recipeSteps(drinks, choices, [], prepared);
  assert.match(steps[0], /^Подогрейте всё молоко/);
  assert.ok(!steps.some((step) => /^Вскипятите/.test(step)));
  const tea = prepareRecipe(drinks, on('tea'));
  const screen = renderCookingMode({
    title: tea.title,
    prepared: tea,
    steps: recipeSteps(drinks, on('tea'), [], tea),
    index: 0,
    timers: {},
    now: 0,
  });
  assert.match(screen, /Питьевая вода на кружку/);
});
