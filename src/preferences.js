import { recipeById } from './data.js';
import {
  effectiveIngredients,
  resolveIngredient,
  prepareRecipe,
  migrateRecipeEntry,
} from './model.js';

// Keep one configured favourite per recipe; saving again updates that variant.
export function selectionSnapshot(
  recipe,
  choices = {},
  packSizes = {},
  anchorId = null,
  modules = [],
) {
  const prepared = prepareRecipe(recipe, choices, packSizes, anchorId, modules);
  const selectedChoices = {};
  for (const ingredient of effectiveIngredients(recipe, modules)) {
    const chosen = resolveIngredient(ingredient, choices[ingredient.id]);
    if (chosen.id !== ingredient.id) selectedChoices[ingredient.id] = chosen.id;
  }
  return {
    recipeId: recipe.id,
    choices: Object.fromEntries(Object.entries(selectedChoices).sort()),
    packSizes: Object.fromEntries(
      prepared.ingredients
        .filter((i) => i.package)
        .map((i) => [i.id, i.package.size])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
    anchorId: prepared.anchorId,
    modules: prepared.modules.map((m) => m.id).sort(),
  };
}
export function sameSelection(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
export function normalizeFavorites(value) {
  if (!Array.isArray(value)) return [];
  const result = new Map();
  for (const raw of value.slice(0, 100)) {
    if (!raw || typeof raw !== 'object' || typeof raw.recipeId !== 'string') continue;
    const entry = migrateRecipeEntry(raw),
      recipe = recipeById[entry.recipeId];
    if (!recipe) continue;
    const saved = selectionSnapshot(
      recipe,
      entry.choices && typeof entry.choices === 'object' ? entry.choices : {},
      entry.packSizes && typeof entry.packSizes === 'object' ? entry.packSizes : {},
      typeof entry.anchorId === 'string' ? entry.anchorId : null,
      Array.isArray(entry.modules) ? entry.modules : [],
    );
    result.set(recipe.id, saved);
  }
  return [...result.values()];
}
