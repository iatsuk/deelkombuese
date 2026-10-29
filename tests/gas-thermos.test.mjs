import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipes, recipeById } from '../src/data.js';
import { prepareRecipe, recipeSteps, normalizeSelection, optionBlocked } from '../src/model.js';
import { buildTrip, gasBudget } from '../src/planner.js';
import { grainDiagram } from '../src/cooking-visuals.js';
import { stepDuration } from '../src/cooking-guide.js';
import { buildRecipeCard } from '../src/export/recipe-card.js';
import { localizeRecipeCard } from '../src/i18n/recipe-card.js';
import { buildShoppingText } from '../src/export/shopping-list.js';
import { createTranslator } from '../src/i18n/messages.js';
import { loadState, saveState } from '../src/state/storage.js';

const grain = recipeById['grain-generator'];
const prepareGrain = (base, modules = [], crew = 1) => {
  const choices = { technique: base };
  return prepareRecipe(grain, choices, {}, null, normalizeSelection(grain, choices, modules), {
    crew,
  });
};

test('Every dish names its burner minutes: none without a stove, never more than its time', () => {
  for (const recipe of recipes) {
    const bases = recipe.generator ? recipe.generator.bases.map((b) => b.id) : [null];
    for (const base of bases)
      for (const crew of [1, 2, 4]) {
        const choices = base ? { [recipe.generator.choiceKey]: base } : {};
        const p = prepareRecipe(recipe, choices, {}, null, [], { crew });
        const label = `${recipe.id} ${base} ×${crew}`;
        assert.ok(Number.isInteger(p.burner), label);
        if (recipe.vessel === 'cold') assert.equal(p.burner, 0, label);
        else assert.ok(p.burner > 0 && p.burner <= p.time, label);
      }
  }
  // Rice rests 5 minutes off the heat; couscous only needs the water boiled.
  assert.equal(prepareGrain('rice').burner, prepareGrain('rice').time - 5);
  assert.equal(prepareGrain('couscous').burner, 5);
  // A bigger pot takes longer to boil; a pan fries in batches.
  assert.ok(prepareGrain('rice', [], 4).burner > prepareGrain('rice').burner);
  const batter = recipeById['batter-generator'];
  const crepes = (crew) => prepareRecipe(batter, { technique: 'crepes' }, {}, null, [], { crew });
  assert.equal(crepes(3).burner, crepes(1).burner * 2);
});

test('Buckwheat, couscous and oats can swell in a thermos; rice cannot', () => {
  assert.match(optionBlocked(grain, { technique: 'rice' }, [], 'thermos'), /Bacillus cereus/);
  assert.ok(optionBlocked(grain, { technique: 'buckwheat' }, ['thermos'], 'carrot'));
  for (const base of ['buckwheat', 'couscous', 'oats']) {
    assert.equal(optionBlocked(grain, { technique: base }, [], 'thermos'), null, base);
    const stove = prepareGrain(base, ['stew']);
    const jar = prepareGrain(base, ['stew', 'thermos']);
    const steps = recipeSteps(grain, { technique: base }, ['stew', 'thermos'], jar);
    assert.ok(jar.generator.profile.thermos, base);
    assert.equal(jar.water, stove.water, base);
    assert.equal(jar.prepWater, stove.prepWater + 300, base);
    assert.ok(jar.burner < stove.burner || base === 'couscous', base);
    assert.match(steps[0], /Прогрейте пищевой термос/);
    assert.match(steps.at(-1), /в течение 3 часов/);
    assert.ok(!steps.some((step) => /слабого огня|под закрытой крышкой/.test(step)), base);
    assert.equal(grainDiagram(grain, jar), null);
  }
  const buckwheat = recipeSteps(grain, { technique: 'buckwheat' }, ['thermos']);
  assert.equal(stepDuration(buckwheat.find((s) => /60–90/.test(s))).seconds, 60 * 60);
  // Normalising a selection drops the thermos when the base becomes rice.
  assert.ok(!normalizeSelection(grain, { technique: 'rice' }, ['thermos']).includes('thermos'));
});

test('A passage counts gas from burner minutes, a kettle and the reserve', () => {
  const trip = buildTrip({ days: 3 });
  const options = { days: 3, burnerRate: 120, kettleMinutes: 6, reservePct: 50 };
  const gas = gasBudget(trip.entries, options);
  const minutes = trip.entries.reduce(
    (sum, e) =>
      sum +
      prepareRecipe(recipeById[e.recipeId], e.choices, e.packSizes, e.anchorId, e.modules).burner,
    0,
  );
  assert.equal(gas.dishMinutes, minutes);
  assert.equal(gas.kettleMinutes, 18);
  assert.equal(gas.dishes, (minutes * 120) / 60);
  assert.equal(gas.reserve, (gas.dishes + gas.kettle) / 2);
  assert.equal(gas.total, gas.dishes + gas.kettle + gas.reserve);
  assert.equal(gasBudget(trip.entries, { days: 3, burnerRate: 9999 }).rate, 400);
  assert.ok(trip.gas.total > 0);
  const pair = buildTrip({ days: 3, crew: 2 });
  assert.equal(pair.gas.kettleMinutes, 2 * trip.gas.kettleMinutes);
  assert.ok(pair.gas.dishMinutes > trip.gas.dishMinutes);
});

test('The stove rate and kettle minutes are stored with the galley and clamped', () => {
  let stored = '';
  const storage = { getItem: () => stored, setItem: (_, value) => (stored = value) };
  saveState(storage, { burnerRate: 200, kettleMinutes: 0, crew: 1 });
  assert.deepEqual(
    [loadState(storage).saved.burnerRate, loadState(storage).saved.kettleMinutes],
    [200, 0],
  );
  stored = JSON.stringify({ burnerRate: 5, kettleMinutes: 99 });
  assert.deepEqual(
    [loadState(storage).saved.burnerRate, loadState(storage).saved.kettleMinutes],
    [50, 30],
  );
  stored = JSON.stringify({});
  assert.deepEqual(
    [loadState(storage).saved.burnerRate, loadState(storage).saved.kettleMinutes],
    [150, 5],
  );
});

test('The PNG card and the shopping text carry burner minutes, gas and the thermos note', () => {
  const selection = { choices: { technique: 'buckwheat' }, modules: ['peas', 'thermos'] };
  const card = buildRecipeCard(grain, selection);
  assert.equal(card.burner, prepareGrain('buckwheat', ['peas', 'thermos']).burner);
  assert.ok(card.notes.some((note) => note.startsWith('Термос:')));
  assert.equal(localizeRecipeCard(card).labels.burner, `Горелка ≈ ${card.burner} мин`);
  const trip = buildTrip({ days: 2 });
  const input = { plan: trip.entries, items: trip.items, builderMeta: { kind: 'trip', days: 2 } };
  assert.match(buildShoppingText(input), /ГАЗ НА 2 ДНЕЙ/);
  assert.match(buildShoppingText(input), /Расход горелки: 150 г\/ч/);
  for (const language of ['en', 'de']) {
    const translate = createTranslator(
      JSON.parse(readFileSync(`locales/${language}.json`)),
      language,
    );
    const localized = localizeRecipeCard(card, translate, language);
    for (const value of [localized.labels.burner, ...localized.notes, ...localized.steps])
      assert.ok(!/[А-Яа-яЁё]/u.test(value), value);
    const text = buildShoppingText(input, { translate, language });
    assert.ok(!/[А-Яа-яЁё]/u.test(text), text);
    assert.match(text, language === 'en' ? /GAS FOR 2 DAYS/ : /GAS FÜR 2 TAGE/);
  }
});
