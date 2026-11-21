import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, recipeById } from '../src/data.js';
import { prepareRecipe, seaStates, seaFits, seaVariant, seaNote } from '../src/model.js';
import { createAppState } from '../src/state/session.js';
import { loadState } from '../src/state/storage.js';
import { createCatalog } from '../src/ui/catalog.js';
import { renderMap } from '../src/ui/views/map.js';
import { renderGenerators } from '../src/ui/views/generators.js';
import { renderRecipeDialog } from '../src/ui/recipe-dialog.js';
import { buildRecipeCard } from '../src/export/recipe-card.js';
import { localizeRecipeCard } from '../src/i18n/recipe-card.js';

const sea = (id, base, modules = []) => {
  const recipe = recipeById[id];
  const choices = base ? { [recipe.generator.choiceKey]: base } : {};
  return prepareRecipe(recipe, choices, {}, null, modules);
};
const freshState = () => createAppState(loadState({ getItem: () => null }).saved);

test('Every base and standalone recipe says how rough a sea it copes with', () => {
  for (const recipe of recipes) {
    const declared = recipe.generator
      ? recipe.generator.bases.map((base) => [base.id, base.seaState])
      : [[recipe.id, recipe.seaState]];
    for (const [id, state] of declared) assert.ok(seaStates.includes(state), `${recipe.id} ${id}`);
  }
  // Pan dishes that work in a deep pot go underway; a flat pan keeps the rest at anchor.
  for (const base of ['fry', 'poach', 'scramble', 'omelette'])
    assert.equal(sea('eggs-generator', base).potInstead, true, base);
  assert.equal(sea('eggs-generator', 'dip').seaState, 'calm');
  for (const base of recipeById['batter-generator'].generator.bases)
    assert.equal(base.seaState, 'calm', base.id);
  assert.equal(sea('potato-skillet').seaState, 'underway');
  assert.equal(sea('potato-skillet').potInstead, true);
  assert.equal(sea('breakfast-generator', 'mix').seaState, 'heavy');
  assert.equal(sea('drinks-generator', 'tea').seaState, 'heavy');
  assert.equal(sea('drinks-generator', 'compote').seaState, 'underway');
  assert.equal(sea('no-cook-generator', 'beans').seaState, 'heavy');
  // A thermos only needs boiling water, so it turns a stove dish into a heavy-weather one.
  assert.equal(sea('grain-generator', 'buckwheat').seaState, 'underway');
  assert.equal(sea('grain-generator', 'buckwheat', ['thermos']).seaState, 'heavy');
});

test('A dish fit for a rougher sea also fits a calmer one', () => {
  const heavy = sea('drinks-generator', 'tea');
  const calm = sea('batter-generator', 'crepes');
  for (const level of seaStates) assert.ok(seaFits(heavy, level), level);
  assert.ok(seaFits(calm, 'calm'));
  assert.ok(!seaFits(calm, 'underway'));
  assert.ok(!seaFits(sea('soup-generator', 'lentil'), 'heavy'));
});

test('A chapter offers the variant that suits the sea and keeps the picked products', () => {
  const grain = recipeById['grain-generator'];
  assert.deepEqual(seaVariant(recipeById['breakfast-generator'], {}, 'heavy'), {
    choices: { technique: 'mix' },
    modules: [],
  });
  // Buckwheat with meat goes into the thermos; rice never does, so a picked stew moves to buckwheat.
  const buckwheat = { choices: { technique: 'buckwheat' }, modules: ['stew'] };
  assert.deepEqual(seaVariant(grain, buckwheat, 'heavy', ['buckwheat']).modules, [
    'stew',
    'thermos',
  ]);
  const rice = { choices: { technique: 'rice' }, modules: ['stew'] };
  assert.deepEqual(seaVariant(grain, rice, 'heavy', ['stew']), {
    choices: { technique: 'buckwheat' },
    modules: ['stew', 'thermos'],
  });
  // Carrot cannot go into the thermos, so the dish named after it has no heavy-weather version.
  const carrot = { choices: { technique: 'buckwheat' }, modules: ['stew', 'carrot'] };
  assert.equal(seaVariant(grain, carrot, 'heavy', [], { sameDish: true }), null);
  // A substitute the reader picked stays in the variant.
  const sardines = { choices: { technique: 'bread', tuna: 'sardines' }, modules: ['tuna'] };
  assert.equal(
    seaVariant(recipeById['no-cook-generator'], sardines, 'heavy', ['sardines']),
    sardines,
  );
  assert.equal(seaVariant(recipeById['batter-generator'], {}, 'underway'), null);
  assert.equal(seaVariant(recipeById['eggs-generator'], {}, 'heavy'), null);
  assert.equal(seaVariant(recipeById['potato-skillet'], {}, 'heavy'), null);
  const calm = { choices: {}, modules: [] };
  assert.equal(seaVariant(recipeById['batter-generator'], calm, 'calm'), calm);
});

test('The switch narrows the contents, the map counts and the ideas', () => {
  const state = freshState();
  const catalog = createCatalog(state);
  const contents = () => renderGenerators({ state, chapter: null, catalog });
  assert.match(contents(), /chapter-list/);
  assert.match(
    contents(),
    /role="group" aria-label="Качка"><button class="filter-pill active" data-action="sea-state" data-id="calm" aria-pressed="true">/,
  );
  state.seaState = 'heavy';
  const heavy = contents();
  // A rough sea turns the contents into matching cards and names the filter.
  assert.doesNotMatch(heavy, /chapter-list/);
  assert.match(heavy, /Качка: свежая погода/);
  assert.deepEqual(
    catalog.visibleRecipes().map((r) => r.id),
    ['breakfast-generator', 'no-cook-generator', 'grain-generator', 'drinks-generator'],
  );
  const ideas = catalog.ideaCandidates();
  assert.ok(ideas.length > 0);
  for (const idea of ideas) {
    const prepared = prepareRecipe(recipeById[idea.recipeId], idea.choices, {}, null, idea.modules);
    assert.ok(seaFits(prepared, 'heavy'), idea.name);
  }
  assert.ok(ideas.some((idea) => idea.modules.includes('thermos')));
  state.seaState = 'underway';
  const underway = catalog.visibleRecipes().map((r) => r.id);
  assert.ok(!underway.includes('batter-generator'));
  assert.ok(underway.includes('eggs-generator') && underway.includes('potato-skillet'));
  // Eggs on the map lead to fewer dishes in heavy weather: none at all.
  state.view = 'map';
  state.seaState = 'heavy';
  const map = renderMap({ state, catalog });
  assert.match(map, /data-action="graph-product" data-id="eggs" aria-pressed="false" disabled/);
  assert.match(map, /data-action="graph-product" data-id="buckwheat" aria-pressed="false" +title/);
});

test('The recipe margin and the PNG card name the sea the dish suits', () => {
  const state = freshState();
  const eggs = recipeById['eggs-generator'];
  const prepared = prepareRecipe(eggs, { technique: 'fry' });
  assert.equal(seaNote(prepared), 'На ходу: в глубокой кастрюле вместо сковороды');
  assert.equal(
    seaNote(sea('grain-generator', 'oats', ['thermos'])),
    'Свежая погода: кипяток и термос',
  );
  assert.equal(seaNote(sea('breakfast-generator', 'mix')), 'Свежая погода: без плиты');
  // A kettle drink only boils water; cocoa on UHT milk and couscous spend a few minutes on the flame.
  assert.equal(seaNote(sea('drinks-generator', 'broth')), 'Свежая погода: только кипяток');
  const uht = prepareRecipe(recipeById['drinks-generator'], {
    technique: 'cocoa',
    milkPowder: 'milk',
  });
  assert.equal(seaNote(uht), 'Свежая погода: несколько минут на огне');
  assert.equal(
    seaNote(sea('grain-generator', 'couscous')),
    'Свежая погода: несколько минут на огне',
  );
  assert.equal(
    seaNote(sea('batter-generator', 'crepes')),
    'Только на стоянке: нужна плоская сковорода',
  );
  const html = renderRecipeDialog(eggs, prepared, {
    state,
    choices: { technique: 'fry' },
    packSizes: {},
    anchorId: null,
    moduleIds: [],
  });
  assert.match(
    html,
    /<dt>Качка<\/dt><dd>На ходу: в глубокой кастрюле вместо сковороды<small><a href="guides\/seaway\/" data-action="guide" data-id="seaway">/,
  );
  const card = buildRecipeCard(recipeById['drinks-generator'], { choices: { technique: 'tea' } });
  assert.equal(card.sea, 'Свежая погода: только кипяток');
  assert.equal(localizeRecipeCard(card).labels.sea, 'Качка · Свежая погода: только кипяток');
});
