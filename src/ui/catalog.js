import { searchText } from './format.js';
import { t, language } from '../i18n/runtime.js';
import { recipeGlyph, productGlyph } from '../cooking-visuals.js';
import { retailPurchases } from '../planner.js';
import { productById, recipes, recipeById } from '../data.js';
import {
  availableRecipe,
  shoppingItems,
  prepareRecipe,
  recipeProductIds,
  recipeMatches,
  choicesForSelection,
  filterRecipes,
} from '../model.js';
import { icon, esc } from './icons.js';
export function createCatalog(state) {
  function activeRecipeSelection() {
    return state.view === 'map'
      ? state.graphSelected
      : state.view === 'recipes' && productById[state.base]
        ? [state.base]
        : [];
  }

  function recipeContext(recipe) {
    if (state.view === 'recipes' && state.favoritesOnly)
      return state.favorites.find((f) => f.recipeId === recipe.id) || {};
    return choicesForSelection(recipe, activeRecipeSelection());
  }

  function visibleRecipes() {
    const q = state.query.trim().toLocaleLowerCase(language),
      onMap = state.view === 'map';
    const favoriteView = state.view === 'recipes' && state.favoritesOnly;
    return filterRecipes(recipes, {
      mode: state.mode,
      meal: onMap ? 'all' : state.meal,
      base: onMap || favoriteView ? 'all' : state.base,
      kind: onMap ? 'all' : state.kind,
    }).filter((r) => {
      const selected = recipeContext(r),
        prepared = prepareRecipe(
          r,
          selected.choices,
          selected.packSizes,
          selected.anchorId,
          selected.modules,
        );
      const baseMatches =
        !favoriteView ||
        state.base === 'all' ||
        r.base === state.base ||
        prepared.ingredients.some(
          (i) =>
            i.id === state.base ||
            (state.base === 'legumes' && ['beans', 'chickpeas', 'lentils'].includes(i.id)),
        );
      return (
        (!favoriteView || state.favorites.some((f) => f.recipeId === r.id)) &&
        (!favoriteView || state.mode === 'shore' || !prepared.shore) &&
        baseMatches &&
        (!onMap || recipeMatches(r, state.graphSelected)) &&
        (!state.quick || prepared.time <= 20) &&
        (!state.pantryOnly ||
          (favoriteView
            ? prepared.ingredients.every((i) => state.pantry.includes(i.id))
            : availableRecipe(r, state.pantry, selected.modules))) &&
        (!q ||
          searchText([
            r.title,
            prepared.title,
            r.desc,
            ...recipeProductIds(r).map((id) => productById[id].name),
          ]).includes(q))
      );
    });
  }

  function recipeCard(r, compact = false) {
    const selected = recipeContext(r),
      prepared = prepareRecipe(
        r,
        selected.choices,
        selected.packSizes,
        selected.anchorId,
        selected.modules,
      );
    const favorite = state.favorites.some((f) => f.recipeId === r.id),
      favoriteView = state.view === 'recipes' && state.favoritesOnly;
    const possible = availableRecipe(r, state.pantry, selected.modules);
    return `<article class="recipe-card-shell"><button class="recipe-card ${r.tone} ${compact ? 'compact' : ''}" data-action="${favoriteView ? 'favorite-recipe' : 'recipe'}" data-id="${r.id}">
    <span class="recipe-card-top"><span class="dish-icon">${icon(recipeGlyph(r))}</span><span class="recipe-kind">${r.generator ? 'КОНСТРУКТОР' : r.shore ? 'С БЕРЕГА' : r.vessel === 'cold' ? 'БЕЗ ПЛИТЫ' : r.meal === 'breakfast' ? (r.mealTags?.includes('main') ? 'ЗАВТРАК / ОБЕД' : 'ЗАВТРАК') : r.vessel === 'pan' ? 'НА СКОВОРОДЕ' : 'ONE-POT'}</span><span class="card-arrow">↗</span></span>
    <strong>${favoriteView ? prepared.title : r.title}</strong><span class="recipe-desc">${favoriteView && prepared.modules.length ? prepared.modules.map((m) => m.label).join(' · ') : r.desc}</span>
    <span class="recipe-ingredient-icons" aria-hidden="true">${prepared.ingredients
      .slice(0, 4)
      .map(
        (i) =>
          `<span title="${esc(productById[i.id].name)}">${icon(productGlyph(productById[i.id]))}</span>`,
      )
      .join(
        '',
      )}</span>${r.template ? '<span class="recipe-template-label">Универсальная основа · выбрать вариант ↗</span>' : ''}<span class="recipe-meta"><span>${icon('clock')} ${prepared.time} мин</span><span>${icon(r.vessel === 'cold' ? 'person' : 'pot')} ${prepared.active} мин ${r.vessel === 'cold' ? 'подготовки' : 'у плиты'}</span></span>
    ${possible ? '<span class="can-cook">Всё есть в рундуке</span>' : ''}
  </button><button class="favorite-toggle ${favorite ? 'active' : ''}" data-action="favorite-toggle" data-id="${r.id}" aria-label="${t(favorite ? 'Убрать из избранного' : 'Добавить в избранное')}: ${esc(t(r.title))}" aria-pressed="${favorite}" title="${favorite ? 'Убрать из избранного' : 'Добавить в избранное'}">${icon('star')}</button></article>`;
  }

  function searchBox(placeholder) {
    return `<label class="search-box">${icon('search')}<input id="search" type="search" value="${esc(state.query)}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off"/></label>`;
  }

  function recipeFilters() {
    return `<div class="recipe-filters">${state.view === 'recipes' ? `<button class="filter-pill ${state.favoritesOnly ? 'active' : ''}" data-action="favorites-only" aria-pressed="${state.favoritesOnly}">${icon('star')} Избранное ${state.favorites.length}</button>` : ''}<button class="filter-pill ${state.quick ? 'active' : ''}" data-action="quick" aria-pressed="${state.quick}">${icon('clock')} До 20 минут ${state.quick ? icon('check') : ''}</button><button class="filter-pill ${state.pantryOnly ? 'active' : ''}" data-action="pantry-only" aria-pressed="${state.pantryOnly}">${icon('box')} Из моего рундука ${state.pantryOnly ? icon('check') : ''}</button><button class="text-button reset-base ${state.base === 'all' ? 'hidden' : ''}" data-action="base" data-id="all">Все основы ×</button></div>`;
  }

  function empty(title, text) {
    return `<div class="empty-state">${icon('pot')}<h3>${title}</h3><p>${text}</p><button class="button secondary" data-action="reset-filters">Сбросить фильтры</button></div>`;
  }

  function resolvedPlan() {
    return state.plan.map((entry) => ({
      count: entry.count,
      ingredients: prepareRecipe(
        recipeById[entry.recipeId],
        entry.choices,
        entry.packSizes,
        entry.anchorId,
        entry.modules,
      ).ingredients,
    }));
  }

  function cartItems() {
    const items = shoppingItems(resolvedPlan(), state.pantry, state.manual);
    return state.builderMeta?.kind === 'trip' ? retailPurchases(items) : items;
  }
  return {
    activeRecipeSelection,
    recipeContext,
    visibleRecipes,
    recipeCard,
    searchBox,
    recipeFilters,
    empty,
    resolvedPlan,
    cartItems,
  };
}
