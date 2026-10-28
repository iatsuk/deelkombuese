import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { recipeById } from '../src/data.js';
import { prepareRecipe, recipeSteps } from '../src/model.js';
import { buildTrip } from '../src/planner.js';

// Snapshot of the pasta / risotto / rice / potato generator before the generator engine was
// generalised. Run with UPDATE_GOLDEN=1 only when a change to its output is intended.
const fixture = new URL('./fixtures/dish-generator.golden.json', import.meta.url);
const recipe = recipeById['dish-generator'];

const moduleSets = [
  { modules: [] },
  ...recipe.generator.presets.map((preset) => ({ modules: preset.modules })),
  { modules: ['sauce-cream'], choices: { cream: 'milkPowder' } },
  { modules: ['sauce-cream', 'mushrooms'], choices: { cream: 'milk' } },
  { modules: ['sauce-tomato'], choices: { tomatoPaste: 'passata' }, packSizes: { passata: 700 } },
  { modules: ['sauce-tomato', 'fish'], choices: { tomatoPaste: 'tomato', tuna: 'sardines' } },
  { modules: ['sauce-tomato', 'beans'], choices: { tomatoPaste: 'ketchup' } },
  { modules: ['sauce-tomato', 'fish'], packSizes: { tomatoPaste: 140, tuna: 185 } },
  { modules: ['sauce-tomato', 'soy', 'onion'] },
  { modules: ['sauce-broth', 'bouillon', 'onion', 'herbs', 'chili', 'ginger', 'curry'] },
  { modules: ['sauce-tomato', 'mince', 'cheese'] },
  { modules: ['sauce-peanut', 'corn', 'olives', 'mushrooms', 'meat'] },
  { modules: ['sauce-pesto', 'peas'], anchorId: 'peas' },
];

function snapshot() {
  const cases = [];
  for (const base of recipe.generator.bases)
    for (const set of moduleSets) {
      const choices = { pasta: base.id, ...(set.choices || {}) };
      const prepared = prepareRecipe(
        recipe,
        choices,
        set.packSizes || {},
        set.anchorId || null,
        set.modules,
      );
      cases.push({
        base: base.id,
        input: set,
        title: prepared.title,
        ingredients: prepared.ingredients.map((i) => [
          i.id,
          i.amount,
          i.unit,
          i.package?.size ?? null,
          i.moduleId ?? null,
        ]),
        modules: prepared.modules.map((m) => m.id),
        water: prepared.water,
        prepWater: prepared.prepWater,
        time: prepared.time,
        active: prepared.active,
        yieldGrams: prepared.yieldGrams,
        shore: prepared.shore,
        anchorId: prepared.anchorId,
        generator: {
          profile: prepared.generator.profile.id,
          water: prepared.generator.water,
          hydrationWater: prepared.generator.hydrationWater,
        },
        steps: recipeSteps(recipe, choices, set.modules, prepared),
      });
    }
  const trip = buildTrip({ days: 7 })
    .entries.filter((entry) => entry.recipeId === recipe.id)
    .map(({ day, choices, modules }) => ({ day, choices, modules }));
  return { cases, trip };
}

test('The pasta generator reproduces its recorded output', () => {
  const current = snapshot();
  if (process.env.UPDATE_GOLDEN) writeFileSync(fixture, JSON.stringify(current, null, 1) + '\n');
  assert.deepEqual(current, JSON.parse(readFileSync(fixture, 'utf8')));
});
