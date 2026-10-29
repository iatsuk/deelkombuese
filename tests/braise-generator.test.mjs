import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeById } from '../src/data.js';
import { prepareRecipe, recipeSteps, optionBlocked, choicesForSelection } from '../src/model.js';
import { buildTrip } from '../src/planner.js';

const braise = recipeById['braise-generator'];
const on = (technique) => ({ technique });
const title = (choices, modules = []) => prepareRecipe(braise, choices, {}, null, modules).title;

test('Braises keep their own vegetables, sauce and time', () => {
  assert.equal(prepareRecipe(braise, on('cabbage')).prepWater, 300);
  assert.equal(prepareRecipe(braise, on('cabbage')).satiety, '2–3 ч');
  assert.equal(prepareRecipe(braise, on('chili-con')).shore, true);
  // A whole can of coconut milk replaces water and sets the pack scale of the pot.
  assert.equal(prepareRecipe(braise, on('dal'), {}, null, ['coconut']).water, 333);
  // Passata instead of paste brings its own liquid to the potato stew.
  const stew = prepareRecipe(braise, { technique: 'potato', tomatoPaste: 'passata' });
  assert.ok(stew.water < prepareRecipe(braise, on('potato')).water * 1.5);
  assert.match(prepareRecipe(braise, on('chili-sin')).tip, /Сухая красная фасоль/);
});

test('Braise rules keep rice, cans and coconut with the bases they suit', () => {
  assert.match(optionBlocked(braise, on('potato'), [], 'rice'), /ленивые голубцы/);
  assert.match(optionBlocked(braise, on('chili-sin'), [], 'tomato'), /уже есть/);
  assert.match(optionBlocked(braise, on('dal'), [], 'meat'), /тушёной капусте/);
  assert.match(optionBlocked(braise, on('cabbage'), [], 'coconut'), /в дал/);
  assert.equal(optionBlocked(braise, on('sauerkraut'), [], 'meat'), null);
});

test('Braised cabbage becomes unstuffed rolls or bigos', () => {
  assert.equal(title(on('cabbage'), ['rice']), 'Ленивые голубцы');
  assert.equal(title(on('cabbage'), ['rice', 'meat', 'tomato']), 'Ленивые голубцы с мясом');
  assert.equal(title(on('sauerkraut'), ['meat', 'tomato']), 'Походный бигос');
  const steps = recipeSteps(braise, on('cabbage'), ['mince', 'rice']);
  assert.ok(steps.findIndex((s) => /фарш/.test(s)) < steps.findIndex((s) => /всю капусту/.test(s)));
  assert.ok(steps.some((s) => /мягкой сердцевины риса/.test(s)));
  assert.ok(!recipeSteps(braise, on('cabbage')).some((s) => /сердцевины риса/.test(s)));
});

test('The map tells a can of meat for cabbage from the potato stew’s own', () => {
  const map = (ids) => {
    const inferred = choicesForSelection(braise, ids);
    return title(inferred.choices, inferred.modules);
  };
  assert.equal(map(['freshCabbage', 'rice', 'stew']), 'Ленивые голубцы с мясом');
  assert.equal(map(['potato', 'stew']), 'Картофельное рагу');
  assert.equal(map(['lentils', 'coconut']), 'Дал с кокосовым молоком');
});

test('A passage has chili without meat and dal for dinner', () => {
  const plan = buildTrip({ days: 7 });
  const dinner = (day) => plan.entries.find((e) => e.day === day && e.slot === 'dinner');
  assert.equal(title(dinner(4).choices, dinner(4).modules), 'Чили син карне');
  assert.equal(title(dinner(6).choices, dinner(6).modules), 'Красный чечевичный дал');
  assert.ok(dinner(6).modules.includes('seasoning'));
});
