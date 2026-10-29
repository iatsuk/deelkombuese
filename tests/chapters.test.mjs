import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { generators, recipeById, recipeMigrations } from '../src/data.js';
import {
  prepareRecipe,
  recipeSteps,
  selectionIssues,
  normalizeSelection,
  migrateRecipeEntry,
} from '../src/model.js';

// Every base with each combination of single-choice groups, as a chapter page offers them.
function combinations(recipe) {
  const groups = [
    ...new Set(recipe.modules.filter((m) => m.group && !m.multiple).map((m) => m.group)),
  ].map((group) => [null, ...recipe.modules.filter((m) => m.group === group).map((m) => m.id)]);
  const sets = groups.reduce(
    (all, options) => all.flatMap((set) => options.map((id) => (id ? [...set, id] : set))),
    [[]],
  );
  return recipe.generator.bases.flatMap((base) =>
    sets.map((modules) => ({ choices: { [recipe.generator.choiceKey]: base.id }, modules })),
  );
}

test('Every valid combination of every chapter is cookable with whole packs', () => {
  for (const recipe of generators) {
    let valid = 0;
    for (const { choices, modules } of combinations(recipe)) {
      if (selectionIssues(recipe, choices, modules).length) continue;
      valid++;
      const prepared = prepareRecipe(recipe, choices, {}, null, modules);
      const label = `${recipe.id} ${prepared.title}`;
      assert.ok(Number.isFinite(prepared.water) && prepared.water >= 0, label);
      assert.ok(prepared.time >= prepared.active, label);
      const ids = prepared.ingredients.map((i) => i.id);
      assert.equal(new Set(ids).size, ids.length, label);
      for (const item of prepared.ingredients)
        if (item.package) assert.equal(item.amount, item.package.edible, label);
      assert.ok(recipeSteps(recipe, choices, modules, prepared).length >= 2, label);
      assert.ok(prepared.satiety, label);
    }
    assert.ok(valid >= 5, recipe.id);
  }
});

test('Each named dish of a chapter is a valid combination that carries its name', () => {
  for (const recipe of generators)
    for (const dish of recipe.generator.dishes || []) {
      const choices = dish.base ? { [recipe.generator.choiceKey]: dish.base } : {};
      assert.deepEqual(selectionIssues(recipe, choices, dish.modules), [], dish.name);
      assert.equal(prepareRecipe(recipe, choices, {}, null, dish.modules).title, dish.name);
    }
});

test('A former recipe opens as its dish in the chapter', () => {
  for (const recipe of generators)
    for (const dish of (recipe.generator.dishes || []).filter((d) => d.legacyId)) {
      assert.equal(recipeMigrations[dish.legacyId]?.recipeId, recipe.id, dish.legacyId);
      assert.equal(recipeById[dish.legacyId], undefined, dish.legacyId);
      const { choices, modules } = migrateRecipeEntry({ recipeId: dish.legacyId });
      assert.equal(prepareRecipe(recipe, choices, {}, null, modules).title, dish.name);
    }
});

// Numbers of standalone recipes, recorded in tests/fixtures/legacy-*.json before they moved
// into a chapter: the default, each module, substitute and pack size.
const deliberate = {
  'french-toast': 'moved to the chapter portion; checked in eggs-generator.test.mjs',
  pilaf: 'one portion of 90 g rice; checked in grain-generator.test.mjs',
  paella: 'one portion of 90 g rice; checked in grain-generator.test.mjs',
  'buckwheat-stew': 'carrot takes the same time as in pilaf; checked in grain-generator.test.mjs',
};
test('Recipes folded into chapters keep their recorded numbers', () => {
  const folder = new URL('./fixtures/', import.meta.url);
  for (const file of readdirSync(folder).filter((name) => /^legacy-.+\.json$/.test(name)))
    for (const before of JSON.parse(readFileSync(new URL(file, folder), 'utf8'))) {
      if (deliberate[before.id]) continue;
      const entry = migrateRecipeEntry({
        recipeId: before.id,
        modules: before.modules,
        choices: before.choices,
        packSizes: before.packs,
      });
      const recipe = recipeById[entry.recipeId];
      const modules = normalizeSelection(recipe, entry.choices, entry.modules);
      const after = prepareRecipe(recipe, entry.choices, entry.packSizes, null, modules);
      const label = `${before.id} ${before.modules.join('+')} ${JSON.stringify(before.choices)} ${JSON.stringify(before.packs)}`;
      for (const key of ['time', 'active', 'yieldGrams', 'shore', 'satiety'])
        if (key in before) assert.equal(after[key], before[key], `${label} ${key}`);
      // A former minimum water times the pack scale could be fractional; chapters round it.
      assert.equal(after.water, Math.round(before.water), `${label} water`);
      assert.deepEqual(
        Object.fromEntries(after.ingredients.map((i) => [i.id, `${i.amount} ${i.unit}`])),
        before.ingredients,
        label,
      );
    }
});
