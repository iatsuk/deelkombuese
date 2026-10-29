import { readFileSync, writeFileSync } from 'node:fs';
import { configureLanguage, t, missingMessages } from '../src/i18n/runtime.js';
import { createAppState } from '../src/state/session.js';
import { loadState } from '../src/state/storage.js';
import { createCatalog } from '../src/ui/catalog.js';
import { renderMap } from '../src/ui/views/map.js';
import { renderPantry } from '../src/ui/views/pantry.js';
import { renderRecipes } from '../src/ui/views/recipes.js';
import { renderShopping } from '../src/ui/views/shopping.js';
import { renderGenerators } from '../src/ui/views/generators.js';
import { createPlannerView } from '../src/ui/views/planner.js';
import { renderRecipeDialog } from '../src/ui/recipe-dialog.js';
import { recipes, products, generators } from '../src/data.js';
import {
  prepareRecipe,
  normalizeSelection,
  effectiveIngredients,
  recipeSteps,
} from '../src/model.js';
import { buildTrip } from '../src/planner.js';
import { visibleMessages } from './translation-html.mjs';
import { buildRecipeCard } from '../src/export/recipe-card.js';
import { localizeRecipeCard } from '../src/i18n/recipe-card.js';
export function auditRenderedTranslations(language) {
  configureLanguage(JSON.parse(readFileSync(`locales/${language}.json`)), language);
  const state = createAppState(loadState({ getItem: () => null }).saved);
  const catalog = createCatalog(state);
  const missing = new Set();
  const inspect = (markup) => {
    for (const source of visibleMessages(markup)) {
      const output = t(source);
      if (/[А-Яа-яЁё]/u.test(output) && output !== 'Русский') missing.add(source);
    }
  };
  inspect(renderMap({ state, catalog }));
  inspect(renderPantry({ state, catalog }));
  state.view = 'recipes';
  inspect(renderRecipes({ state, catalog }));
  state.favorites = [{ recipeId: 'cabbage-stew', choices: {}, packSizes: {}, modules: ['rice'] }];
  state.favoritesOnly = true;
  inspect(renderRecipes({ state, catalog }));
  state.query = 'no matching dish';
  inspect(renderRecipes({ state, catalog }));
  state.query = '';
  state.favoritesOnly = false;
  state.favorites = [];
  const planner = createPlannerView(state);
  state.view = 'planner';
  for (const days of [1, 3, 7]) {
    state.tripDays = days;
    inspect(planner.renderPlanner());
  }
  state.plannerMode = 'season';
  inspect(planner.renderPlanner());
  state.plan = buildTrip({ days: 3 }).entries;
  state.view = 'shopping';
  inspect(renderShopping({ state, catalog }));
  // Generator chapters: the contents, every base with each combination of single-choice
  // groups, and every base with each combinable option on its own.
  state.view = 'generators';
  inspect(renderGenerators({ state, chapter: null }));
  for (const recipe of generators) {
    const single = [
      ...new Set(recipe.modules.filter((m) => m.group && !m.multiple).map((m) => m.group)),
    ].map((group) => [null, ...recipe.modules.filter((m) => m.group === group).map((m) => m.id)]);
    const combos = single.reduce(
      (sets, options) => sets.flatMap((set) => options.map((id) => (id ? [...set, id] : set))),
      [[]],
    );
    const extras = recipe.modules.filter((m) => !m.group || m.multiple).map((m) => [m.id]);
    // Rule reasons appear in toasts and tooltips of blocked options.
    for (const option of [...recipe.generator.bases, ...recipe.modules])
      if (option.reason) missing.add(option.reason);
    for (const base of recipe.generator.bases)
      for (const modules of [...combos, ...extras]) {
        const choices = { [recipe.generator.choiceKey]: base.id };
        const moduleIds = normalizeSelection(recipe, choices, modules);
        const prepared = prepareRecipe(recipe, choices, {}, null, moduleIds);
        // Substitutes inside modules change the step wording (tomato paste is diluted).
        for (const ingredient of effectiveIngredients(recipe, moduleIds, choices))
          for (const alternative of ingredient.alternatives)
            for (const step of recipeSteps(
              recipe,
              { ...choices, [ingredient.id]: alternative.id },
              moduleIds,
            ))
              missing.add(step);
        inspect(
          renderGenerators({
            state,
            chapter: {
              recipe,
              prepared,
              selection: {
                choices,
                packSizes: {},
                anchorId: prepared.anchorId,
                moduleIds: prepared.modules.map((m) => m.id),
                modules: prepared.modules,
              },
            },
          }),
        );
      }
  }
  state.view = 'recipes';
  state.mode = 'shore';
  for (const recipe of recipes) {
    const variants = [
      { choices: {}, moduleIds: [] },
      ...recipe.modules.map((module) => ({ choices: {}, moduleIds: [module.id] })),
      ...recipe.ingredients.flatMap((i) =>
        i.alternatives.map((a) => ({ choices: { [i.id]: a.id }, moduleIds: [] })),
      ),
    ];
    for (const selection of variants) {
      const prepared = prepareRecipe(recipe, selection.choices, {}, null, selection.moduleIds);
      inspect(
        renderRecipeDialog(recipe, prepared, {
          state,
          choices: selection.choices,
          packSizes: {},
          anchorId: prepared.anchorId,
          moduleIds: selection.moduleIds,
        }),
      );
      const raw = buildRecipeCard(recipe, {
        choices: selection.choices,
        modules: selection.moduleIds,
      });
      const translated = localizeRecipeCard(raw, t, language);
      for (const value of [
        translated.title,
        ...translated.steps,
        ...translated.notes,
        ...translated.basics,
        ...translated.utensils,
        ...Object.values(translated.labels),
      ])
        if (/[А-Яа-яЁё]/u.test(value)) missing.add(value);
    }
  }
  return [...new Set([...missingMessages, ...missing])]
    .filter((source) => /[А-Яа-яЁё]/u.test(t(source)))
    .sort();
}
if (process.argv[1]?.endsWith('audit-rendered-translations.mjs')) {
  const results = Object.fromEntries(
    ['en', 'de'].map((language) => [language, auditRenderedTranslations(language)]),
  );
  writeFileSync('work/missing-rendered.json', JSON.stringify(results, null, 2) + '\n');
  console.log(
    JSON.stringify(
      Object.fromEntries(Object.entries(results).map(([key, value]) => [key, value.length])),
    ),
  );
  for (const [language, missing] of Object.entries(results))
    console.log(language, missing.slice(0, 10));
}
