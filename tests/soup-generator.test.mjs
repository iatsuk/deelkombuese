import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeById } from '../src/data.js';
import { prepareRecipe, recipeSteps, optionBlocked, choicesForSelection } from '../src/model.js';
import { buildTrip } from '../src/planner.js';

const soup = recipeById['soup-generator'];
const on = (technique) => ({ technique });
const prepared = (technique, modules = [], choices = {}) =>
  prepareRecipe(soup, { technique, ...choices }, {}, null, modules);

test('Each soup brings its own liquid, thickener and pack', () => {
  const passata = prepared('tomato').ingredients.find((i) => i.id === 'passata');
  assert.equal(passata.amount, 500);
  assert.equal(prepared('lentil').prepWater, 100);
  assert.equal(prepared('sauerkraut', ['rinse']).prepWater, 300);
  // Passata instead of paste brings its own liquid; its whole 200 g pack scales the pot.
  assert.equal(prepared('lentil', [], { tomatoPaste: 'passata' }).water, 467);
  // Soy needs its own water once, not twice.
  assert.equal(prepared('broth', ['meat'], { stew: 'soy' }).water, 575);
  assert.equal(prepared('broth', [], { potato: 'pasta' }).time, 15);
});

test('Soup rules keep each addition with the soup it suits', () => {
  assert.match(optionBlocked(soup, on('lentil'), [], 'fish'), /на бульоне/);
  assert.match(optionBlocked(soup, on('broth'), [], 'bouillon'), /уже есть/);
  assert.match(optionBlocked(soup, on('broth'), [], 'borscht'), /в щи/);
  assert.match(optionBlocked(soup, on('tomato'), [], 'milk'), /суп-пюре/);
  assert.equal(optionBlocked(soup, on('lentil'), [], 'curry'), null);
  assert.equal(optionBlocked(soup, on('sauerkraut'), [], 'meat'), null);
});

test('Soup steps follow the base and the chosen forms', () => {
  assert.match(recipeSteps(soup, on('broth'), [], prepared('broth'))[1], /картофель/);
  assert.match(recipeSteps(soup, { technique: 'broth', potato: 'rice' })[1], /рис/);
  assert.match(recipeSteps(soup, { technique: 'tomato', passata: 'tomatoPaste' })[0], /пасту/);
  const shchi = recipeSteps(soup, on('sauerkraut'), ['rinse', 'borscht']);
  assert.match(shchi[0], /промойте питьевой водой/);
  assert.ok(
    shchi.findIndex((s) => /свёклы/.test(s)) > shchi.findIndex((s) => /капусты слейте/.test(s)),
  );
  assert.equal(prepared('sauerkraut', ['borscht']).title, 'Борщ с квашеной капустой');
});

test('The map picks the soup that uses the products the reader chose', () => {
  const title = (ids) => {
    const inferred = choicesForSelection(soup, ids);
    return prepareRecipe(soup, inferred.choices, {}, null, inferred.modules).title;
  };
  assert.equal(title(['lentils']), 'Чечевичный суп');
  assert.equal(title(['sauerkraut', 'beetCanned']), 'Борщ с квашеной капустой');
  assert.equal(title(['potato', 'tuna']), 'Суп на бульоне с рыбой');
});

test('A passage has four soup lunches with stock where the soup takes it', () => {
  const plan = buildTrip({ days: 7 });
  const lunch = (day) => plan.entries.find((e) => e.day === day && e.slot === 'lunch');
  const title = (e) => prepareRecipe(soup, e.choices, {}, null, e.modules).title;
  assert.equal(title(lunch(2)), 'Томатный суп из целого пакета');
  assert.equal(title(lunch(3)), 'Суп на бульоне с рыбой');
  // Day three's stock soup already has stock, so it gets salt and pepper instead.
  assert.ok(lunch(3).modules.includes('seasoning'));
  assert.ok(!lunch(3).modules.includes('bouillon'));
  assert.equal(title(lunch(5)), 'Чечевичный суп');
  assert.ok(lunch(5).modules.includes('bouillon'));
  assert.ok(lunch(6).modules.includes('rinse'));
});
