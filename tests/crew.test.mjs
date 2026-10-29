import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipeById } from '../src/data.js';
import { prepareRecipe, normalizeSelection } from '../src/model.js';
import { buildTrip, buildSeason, waterBudget } from '../src/planner.js';
import { buildRecipeCard } from '../src/export/recipe-card.js';
import { localizeRecipeCard } from '../src/i18n/recipe-card.js';
import { buildShoppingText } from '../src/export/shopping-list.js';
import { createTranslator } from '../src/i18n/messages.js';
import { loadState, saveState } from '../src/state/storage.js';

const grain = recipeById['grain-generator'];
const pilaf = grain.generator.dishes.find((dish) => dish.legacyId === 'pilaf');
const pilafChoices = { technique: pilaf.base };
const pilafModules = normalizeSelection(grain, pilafChoices, pilaf.modules);
const preparePilaf = (crew, packSizes = {}) =>
  prepareRecipe(grain, pilafChoices, packSizes, null, pilafModules, { crew });

test('A crew takes more whole packs and scales the rest from the anchor pack', () => {
  const one = preparePilaf(1);
  const two = preparePilaf(2);
  assert.equal(one.crew, 1);
  assert.equal(two.crew, 2);
  const stew = (prepared) => prepared.ingredients.find((i) => i.id === 'stew');
  assert.deepEqual([stew(one).package.count, stew(two).package.count], [1, 2]);
  assert.equal(stew(two).amount, 2 * stew(one).amount);
  assert.equal(two.ingredients.find((i) => i.id === 'rice').amount, 180);
  assert.equal(two.water, 2 * one.water);
  assert.equal(two.prepWater, 2 * one.prepWater);
  assert.equal(two.yieldGrams, 2 * one.yieldGrams);
  // A pack size chosen by hand stays; the crew then takes as many of it as it needs.
  const small = preparePilaf(4, { stew: 200 });
  assert.equal(stew(small).package.size, 200);
  assert.equal(stew(small).package.count, 4);
});

test('Without a crew the recipes stay exactly as before', () => {
  for (const recipe of Object.values(recipeById)) {
    const plain = prepareRecipe(recipe);
    const single = prepareRecipe(recipe, {}, {}, null, [], { crew: 1 });
    assert.deepEqual(single, plain, recipe.id);
    assert.ok(
      plain.ingredients.every((i) => !i.package || i.package.count === 1),
      recipe.id,
    );
  }
});

test('The trip, its water and the season kit grow with the crew', () => {
  const solo = buildTrip({ days: 3 });
  const pair = buildTrip({ days: 3, crew: 2 });
  assert.equal(pair.crew, 2);
  assert.equal(pair.water.drinking, 2 * solo.water.drinking);
  assert.equal(pair.water.washing, 2 * solo.water.washing);
  assert.ok(pair.water.cooking > solo.water.cooking);
  const total = (trip) => trip.items.reduce((sum, item) => sum + item.amount, 0);
  assert.ok(total(pair) > total(solo));
  assert.equal(waterBudget(solo.entries, { days: 3, crew: 9 }).crew, 4);
  const season = buildSeason(90, [], 1);
  const crewSeason = buildSeason(90, [], 3);
  const rice = (plan) => plan.items.find((item) => item.id === 'rice');
  assert.ok(rice(crewSeason).amount >= 3 * rice(season).amount - 1);
});

test('The crew is stored with the visitor state and clamped to 1–4', () => {
  let stored = '';
  const storage = { getItem: () => stored, setItem: (_, value) => (stored = value) };
  saveState(storage, { favorites: [], pantry: [], plan: [], manual: [], checked: [], crew: 3 });
  assert.equal(loadState(storage).saved.crew, 3);
  stored = JSON.stringify({ crew: 12 });
  assert.equal(loadState(storage).saved.crew, 4);
  stored = JSON.stringify({});
  assert.equal(loadState(storage).saved.crew, 1);
});

test('The PNG card and the shopping text name the crew in every language', () => {
  const selection = { choices: pilafChoices, modules: pilafModules };
  assert.equal(localizeRecipeCard(buildRecipeCard(grain, selection)).labels.crew, null);
  const card = buildRecipeCard(grain, selection, { crew: 2 });
  assert.equal(card.crew, 2);
  assert.equal(card.perPerson, Math.round(card.yieldGrams / 2));
  assert.ok(card.ingredients.some((i) => i.package?.startsWith('2 уп. ×')));
  assert.equal(
    localizeRecipeCard(card).labels.crew,
    `Экипаж: 2 · ≈ ${card.perPerson} г на человека`,
  );
  const trip = buildTrip({ days: 2, crew: 2 });
  const input = {
    plan: trip.entries,
    items: trip.items,
    builderMeta: { kind: 'trip', days: 2 },
    crew: 2,
  };
  assert.match(buildShoppingText(input), /^Экипаж: 2$/m);
  assert.doesNotMatch(buildShoppingText({ ...input, crew: 1 }), /Экипаж/);
  for (const language of ['en', 'de']) {
    const translate = createTranslator(
      JSON.parse(readFileSync(`locales/${language}.json`)),
      language,
    );
    const labels = localizeRecipeCard(card, translate, language).labels;
    assert.ok(!/[А-Яа-яЁё]/u.test(labels.crew), labels.crew);
    const packages = localizeRecipeCard(card, translate, language).ingredients.map(
      (i) => i.package || '',
    );
    assert.ok(
      packages.every((text) => !/[А-Яа-яЁё]/u.test(text)),
      packages.join('\n'),
    );
    const text = buildShoppingText(input, { translate, language });
    assert.ok(!/[А-Яа-яЁё]/u.test(text), text);
    assert.match(text, /Crew: 2/);
  }
});
