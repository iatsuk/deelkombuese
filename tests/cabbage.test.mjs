import test from 'node:test';
import assert from 'node:assert/strict';
import { productById, recipeById, bases } from '../src/data.js';
import { prepareRecipe, recipeMatches, recipeSteps } from '../src/model.js';
test('Whole fresh cabbage is a ventilated short-term provision; cut cabbage is used immediately', () => {
  const cabbage = productById.freshCabbage;
  assert.equal(cabbage.state, 'fresh');
  assert.match(cabbage.storage, /проветриваем/);
  assert.match(cabbage.afterLife, /2 ч/);
  assert.match(cabbage.after, /весь кочан/);
  assert.ok(bases.some((base) => base.id === 'freshCabbage'));
});
test('Braised cabbage and unstuffed rolls share a base; optional rice, tomatoes and protein remain independent', () => {
  const recipe = recipeById['cabbage-stew'];
  const plain = prepareRecipe(recipe);
  const rolls = prepareRecipe(recipe, {}, {}, null, ['rice', 'tomato', 'meat']);
  assert.ok(!plain.ingredients.some((i) => i.id === 'rice'));
  assert.ok(rolls.ingredients.some((i) => i.id === 'rice'));
  assert.ok(rolls.water > plain.water);
  assert.equal(plain.prepWater, 300);
  assert.equal(rolls.prepWater, 400);
  assert.ok(rolls.time > plain.time);
  assert.equal(rolls.ingredients.find((i) => i.id === 'freshCabbage').package.count, 1);
  assert.ok(recipeMatches(recipe, ['freshCabbage', 'rice', 'stew']));
  assert.ok(
    recipeSteps(recipe, {}, ['rice', 'tomato', 'meat'], rolls)
      .join(' ')
      .includes('ещё две мерки сверху не добавляйте'),
  );
  const shore = prepareRecipe(recipe, {}, {}, null, ['mince']);
  assert.equal(shore.shore, true);
  for (const size of [600, 900, 1200]) {
    const prepared = prepareRecipe(recipe, {}, { freshCabbage: size }, 'freshCabbage', [
      'rice',
      'meat',
    ]);
    assert.equal(prepared.ingredients.find((i) => i.id === 'freshCabbage').amount, size);
    assert.ok(prepared.water > 0);
  }
});
