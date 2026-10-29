import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, recipeById } from '../src/data.js';
import {
  prepareRecipe,
  recipeSteps,
  selectionIssues,
  optionBlocked,
  choicesForSelection,
  filterRecipes,
} from '../src/model.js';
import { cookingBasics, recipeUtensils } from '../src/cooking-guide.js';
import { buildTrip } from '../src/planner.js';

const batter = recipeById['batter-generator'];
const base = (technique) => ({ technique });
const prepared = (technique, modules = [], choices = {}) =>
  prepareRecipe(batter, { technique, ...choices }, {}, null, modules);

test('Each batter brings its own ingredients, water and time', () => {
  const ids = (technique) => prepared(technique).ingredients.map((i) => i.id);
  assert.deepEqual(ids('crepes'), ['flour', 'eggs', 'oil']);
  assert.deepEqual(ids('oat-cutlets'), ['oats', 'flour', 'driedOnion', 'paprika', 'oil']);
  assert.deepEqual(ids('potato-pancakes'), ['potato', 'flour', 'driedOnion', 'oil']);
  assert.equal(prepared('fritters').water, 120);
  assert.equal(prepared('flatbread').satiety, '2–3 ч');
  assert.ok(prepared('crepes').eggConditional);
  assert.ok(!prepared('fritters').eggConditional);
  // Thin pancakes take more milk powder than fritters.
  const powder = (technique) =>
    prepared(technique, ['milk']).ingredients.find((i) => i.id === 'milkPowder').amount;
  assert.equal(powder('crepes'), 20);
  assert.equal(powder('fritters'), 15);
});

test('Batter rules keep toppings and fillings with the batters they suit', () => {
  assert.match(optionBlocked(batter, base('oat-cutlets'), [], 'honey'), /блинам и оладьям/);
  assert.match(optionBlocked(batter, base('fritters'), [], 'corn'), /овсяные оладьи/);
  assert.match(optionBlocked(batter, base('fritters'), [], 'fish'), /котлеты или подают/);
  assert.match(optionBlocked(batter, base('oat-cutlets'), [], 'milk'), /жидком тесте/);
  assert.match(optionBlocked(batter, base('fritters'), [], 'seasoning'), /котлеты и драники/);
  assert.equal(optionBlocked(batter, base('potato-pancakes'), [], 'fish'), null);
  assert.deepEqual(selectionIssues(batter, base('oat-fritters'), ['corn', 'milk']), []);
});

test('Batter utensils, notes and steps follow the chosen batter', () => {
  const utensils = (technique) => recipeUtensils(batter, prepared(technique));
  assert.deepEqual(utensils('potato-pancakes'), [
    'сковорода',
    'лопатка',
    'миска для смешивания',
    'тёрка',
  ]);
  assert.deepEqual(utensils('flatbread'), ['сковорода', 'лопатка']);
  assert.ok(!cookingBasics(batter, prepared('potato-pancakes')).some((t) => /Кубики/.test(t)));
  assert.match(prepared('flatbread').tip, /не полноценный обед/);
  const uht = { technique: 'crepes', milkPowder: 'milk' };
  assert.match(recipeSteps(batter, uht, ['milk'])[0], /Вместо воды/);
  assert.match(recipeSteps(batter, base('crepes')).at(-1), /сырым яйцом/);
  const cutlets = recipeSteps(batter, base('oat-cutlets'), ['fish']);
  assert.ok(cutlets.findIndex((s) => /вмешайте в овсяную/.test(s)) < cutlets.length - 2);
  assert.match(recipeSteps(batter, base('potato-pancakes'), ['fish']).at(-2), /к готовым драникам/);
});

test('The map picks the batter that uses the products the reader chose', () => {
  const technique = (ids) => choicesForSelection(batter, ids).choices.technique;
  assert.equal(technique(['oats']), 'oat-fritters');
  assert.equal(technique(['potato']), 'potato-pancakes');
  assert.equal(technique(['eggs', 'flour']), 'crepes');
  assert.equal(technique(['oats', 'beans']), 'oat-cutlets');
  const corn = choicesForSelection(batter, ['oats', 'corn']);
  assert.equal(
    prepareRecipe(batter, corn.choices, {}, null, corn.modules).title,
    'Овсяные оладьи с кукурузой',
  );
});

test('Chapters appear under the dish kinds they cover', () => {
  const kind = (id) => filterRecipes(recipes, { kind: id }).map((r) => r.id);
  assert.ok(kind('pancakes').includes('batter-generator'));
  assert.ok(kind('eggs').includes('eggs-generator'));
  assert.ok(kind('snack').includes('no-cook-generator'));
  for (const { id } of [{ id: 'pancakes' }, { id: 'eggs' }, { id: 'pasta' }, { id: 'snack' }])
    assert.ok(kind(id).length, id);
});

test('A passage has fritters with honey and oat fritters with raisins for breakfast', () => {
  const plan = buildTrip({ days: 4 });
  const breakfast = (day) => plan.entries.find((e) => e.day === day && e.slot === 'breakfast');
  for (const [day, technique, modules] of [
    [2, 'fritters', ['honey']],
    [4, 'oat-fritters', ['sweet']],
  ]) {
    const entry = breakfast(day);
    assert.equal(entry.recipeId, 'batter-generator');
    assert.equal(entry.choices.technique, technique);
    assert.deepEqual(entry.modules, modules);
  }
});
