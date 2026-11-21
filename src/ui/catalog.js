import { searchText } from './format.js';
import { t, language } from '../i18n/runtime.js';
import { recipeGlyph, productGlyph } from '../cooking-visuals.js';
import { retailPurchases } from '../planner.js';
import { productById, recipes, recipeById } from '../data.js';
import { favoriteKey } from '../preferences.js';
import { pagePath } from '../state/session.js';
import {
  availableRecipe,
  shoppingItems,
  prepareRecipe,
  recipeProductIds,
  recipeMatches,
  choicesForSelection,
  filterRecipes,
  seaFits,
  seaVariant,
} from '../model.js';
import { icon, esc } from './icons.js';
export function createCatalog(state) {
  // Search, filters and favourites live on the cookbook contents, the start screen.
  const onContents = () => state.view === 'generators' && !state.route?.slug;
  function activeRecipeSelection() {
    return state.view === 'map' ? state.graphSelected : [];
  }

  // A search for a known dish (shakshuka, French toast) shows the chapter on that dish.
  // A query that also fits the chapter's own title keeps the chapter's default.
  function searchedDish(recipe) {
    const q = state.query.trim().toLocaleLowerCase(language);
    if (!q || !recipe.generator || !onContents() || state.favoritesOnly) return null;
    if (searchText([recipe.title]).includes(q)) return null;
    return (
      (recipe.generator.dishes || []).find((dish) => searchText([dish.name]).includes(q)) || null
    );
  }

  function recipeContext(recipe) {
    if (onContents() && state.favoritesOnly)
      return (
        state.favorites.find((f) =>
          recipe.favoriteKey ? favoriteKey(f) === recipe.favoriteKey : f.recipeId === recipe.id,
        ) || {}
      );
    const dish = searchedDish(recipe);
    if (dish) {
      // A searched dish keeps its name in a rough sea, cooked another way when it can be.
      const context = {
        choices: { [recipe.generator.choiceKey]: dish.base },
        modules: dish.modules,
      };
      return seaVariant(recipe, context, state.seaState, [], { sameDish: true }) || context;
    }
    // In a rough sea a chapter shows the variant that suits it (the breakfast mix, tea).
    const selection = activeRecipeSelection();
    const context = choicesForSelection(recipe, selection);
    return seaVariant(recipe, context, state.seaState, selection) || context;
  }

  function visibleRecipes() {
    const q = state.query.trim().toLocaleLowerCase(language),
      onMap = state.view === 'map';
    const favoriteView = onContents() && state.favoritesOnly;
    // In the favourites view every saved variant is its own card.
    const source = favoriteView
      ? state.favorites
          .filter((f) => recipeById[f.recipeId])
          .map((f) => ({ ...recipeById[f.recipeId], favoriteKey: favoriteKey(f) }))
      : recipes;
    return filterRecipes(source, {
      mode: state.mode,
      meal: onMap ? 'all' : state.meal,
    }).filter((r) => {
      const selected = recipeContext(r),
        prepared = prepareRecipe(
          r,
          selected.choices,
          selected.packSizes,
          selected.anchorId,
          selected.modules,
        );
      return (
        (!favoriteView || state.favorites.some((f) => f.recipeId === r.id)) &&
        (!favoriteView || state.mode === 'shore' || !prepared.shore) &&
        (!onMap || recipeMatches(r, state.graphSelected)) &&
        seaFits(prepared, state.seaState) &&
        (!state.quick || prepared.time <= 20) &&
        (!state.pantryOnly ||
          (favoriteView
            ? prepared.ingredients.every((i) => state.pantry.includes(i.id))
            : availableRecipe(r, state.pantry, selected.modules, selected.choices))) &&
        (!q ||
          searchText([
            r.title,
            prepared.title,
            r.desc,
            // A chapter is found by any of its dishes, e.g. shakshuka or French toast.
            ...(r.generator?.dishes || []).map((dish) => dish.name),
            ...recipeProductIds(r).map((id) => productById[id].name),
          ]).includes(q))
      );
    });
  }

  // `link` makes a standalone recipe's card a link to its own page, which readers without
  // JavaScript and search engines can follow; the app still opens it in place.
  function recipeCard(r, compact = false, { link = false } = {}) {
    const selected = recipeContext(r),
      prepared = prepareRecipe(
        r,
        selected.choices,
        selected.packSizes,
        selected.anchorId,
        selected.modules,
      );
    const favoriteView = onContents() && state.favoritesOnly,
      favorite = favoriteView || state.favorites.some((f) => f.recipeId === r.id),
      cardId = (favoriteView && r.favoriteKey) || r.id;
    const possible = availableRecipe(r, state.pantry, selected.modules, selected.choices);
    const tag = link && !favoriteView && !r.generator ? 'a' : 'button';
    const href = tag === 'a' ? ` href="${pagePath(language, 'recipes', r.id)}"` : '';
    return `<article class="recipe-card-shell"><${tag} class="recipe-card ${r.tone} ${compact ? 'compact' : ''}"${href} data-action="${favoriteView ? 'favorite-recipe' : 'recipe'}" data-id="${cardId}">
    <span class="recipe-card-top"><span class="dish-icon">${icon(recipeGlyph(r))}</span><span class="recipe-kind">${r.generator ? 'Конструктор' : r.shore ? 'С берега' : prepared.vessel === 'cold' ? 'Без плиты' : r.meal === 'breakfast' ? (r.mealTags?.includes('main') ? 'Завтрак / обед' : 'Завтрак') : prepared.vessel === 'pan' ? 'На сковороде' : 'Одна кастрюля'}</span></span>
    <strong>${favoriteView || searchedDish(r) ? prepared.title : r.generator?.chapter.title || r.title}</strong><span class="recipe-desc">${favoriteView && prepared.modules.length ? prepared.modules.map((m) => m.label).join(' · ') : r.desc}</span>
    <span class="recipe-ingredient-icons" aria-hidden="true">${prepared.ingredients
      .slice(0, 4)
      .map(
        (i) =>
          `<span title="${esc(productById[i.id].name)}">${icon(productGlyph(productById[i.id]))}</span>`,
      )
      .join(
        '',
      )}</span>${r.template ? '<span class="recipe-template-label">Универсальная основа · выбрать вариант</span>' : ''}<span class="recipe-meta"><span>${icon('clock')} ${prepared.time} мин</span><span>${icon(prepared.vessel === 'cold' ? 'person' : 'pot')} ${prepared.active} мин ${prepared.vessel === 'cold' ? 'подготовки' : 'у плиты'}</span></span>
    ${possible ? '<span class="can-cook">Всё есть в рундуке</span>' : ''}
  </${tag}><button class="favorite-toggle ${favorite ? 'active' : ''}" data-action="favorite-toggle" data-id="${cardId}" aria-label="${t(favorite ? 'Убрать из избранного' : 'Добавить в избранное')}: ${esc(t(r.title))}" aria-pressed="${favorite}" title="${favorite ? 'Убрать из избранного' : 'Добавить в избранное'}">${icon('star')}</button></article>`;
  }

  // «Подкинь идею» draws from what the contents shows: the saved favourites when that pill is
  // on, otherwise every named chapter dish and standalone recipe of the visible recipes — those
  // that match a search, or all of a chapter that matches it as a whole — that fits the
  // sea/shore mode, the sea state and the quick and pantry pills. The controller picks one at
  // random.
  function ideaCandidates() {
    const fits = (idea) => {
      const recipe = recipeById[idea.recipeId];
      const prepared = prepareRecipe(recipe, idea.choices, {}, null, idea.modules);
      return (
        (state.mode === 'shore' || !(idea.shore || prepared.shore)) &&
        seaFits(prepared, state.seaState) &&
        (!state.quick || prepared.time <= 20) &&
        (!state.pantryOnly || availableRecipe(recipe, state.pantry, idea.modules, idea.choices))
      );
    };
    if (state.favoritesOnly)
      return state.favorites
        .filter((f) => recipeById[f.recipeId])
        .map((f) => ({ recipeId: f.recipeId, choices: f.choices || {}, modules: f.modules || [] }))
        .filter(fits);
    const q = state.query.trim().toLocaleLowerCase(language);
    // An idea is a dish: the drinks chapter stays out of it.
    return visibleRecipes()
      .filter((r) => !r.drink)
      .flatMap((r) => {
        const ideas = r.generator
          ? // The pasta chapter names its combinations as presets.
            (r.generator.dishes || r.generator.presets || []).map((dish) => ({
              recipeId: r.id,
              choices: dish.base ? { [r.generator.choiceKey]: dish.base } : {},
              modules: dish.modules,
              shore: dish.shore,
              name: dish.name || dish.label,
            }))
          : [{ recipeId: r.id, choices: {}, modules: [], name: r.title }];
        const named = q ? ideas.filter((idea) => searchText([idea.name]).includes(q)) : [];
        // In a rough sea a dish may be cooked another way that suits it (buckwheat in a thermos).
        return (named.length ? named : ideas)
          .map((idea) => {
            const fitting = seaVariant(r, idea, state.seaState, [], { sameDish: true });
            return fitting ? { ...idea, ...fitting } : idea;
          })
          .filter(fits);
      });
  }

  function searchBox(placeholder) {
    return `<label class="search-box">${icon('search')}<input id="search" type="search" value="${esc(state.query)}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off"/></label>`;
  }

  function recipeFilters() {
    return `<div class="recipe-filters">${onContents() ? `<button class="filter-pill ${state.favoritesOnly ? 'active' : ''}" data-action="favorites-only" aria-pressed="${state.favoritesOnly}">${icon('star')} Избранное ${state.favorites.length}</button>` : ''}<button class="filter-pill ${state.quick ? 'active' : ''}" data-action="quick" aria-pressed="${state.quick}">${icon('clock')} До 20 минут ${state.quick ? icon('check') : ''}</button><button class="filter-pill ${state.pantryOnly ? 'active' : ''}" data-action="pantry-only" aria-pressed="${state.pantryOnly}">${icon('box')} Из моего рундука ${state.pantryOnly ? icon('check') : ''}</button>${seaSwitch()}</div>`;
  }

  // How rough the sea is: at anchor every dish, underway a pot under its lid, in heavy weather
  // no stove, a kettle or a thermos (the cheat sheet «Камбуз в качку» explains why).
  function seaSwitch() {
    const options = [
      ['calm', 'anchor', 'Стоянка'],
      ['underway', 'wave', 'На ходу'],
      ['heavy', 'thermos', 'Свежая погода'],
    ];
    return `<div class="sea-switch" role="group" aria-label="Качка">${options
      .map(
        ([id, glyph, label]) =>
          `<button class="filter-pill ${state.seaState === id ? 'active' : ''}" data-action="sea-state" data-id="${id}" aria-pressed="${state.seaState === id}">${icon(glyph)} ${label}</button>`,
      )
      .join('')}</div>`;
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
        { crew: state.crew },
      ).ingredients,
    }));
  }

  function cartItems() {
    const items = shoppingItems(resolvedPlan(), state.pantry, state.manual);
    return state.builderMeta?.kind === 'trip' ? retailPurchases(items) : items;
  }
  return {
    activeRecipeSelection,
    searchedDish,
    recipeContext,
    visibleRecipes,
    recipeCard,
    searchBox,
    recipeFilters,
    ideaCandidates,
    empty,
    resolvedPlan,
    cartItems,
  };
}
