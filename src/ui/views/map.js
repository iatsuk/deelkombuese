import { productGlyph } from '../../cooking-visuals.js';
import { products, productById, recipes, productFamilies, mapProductGroups } from '../../data.js';
import { availableRecipe, prepareRecipe, recipeMatches, choicesForSelection } from '../../model.js';
import { icon, esc } from '../icons.js';
import { plural, t, language } from '../../i18n/runtime.js';
export function renderMap({ state, catalog }) {
  const { visibleRecipes, recipeCard, recipeFilters, empty } = catalog;

  const list = visibleRecipes();
  const candidates = recipes.filter((r) => state.mode === 'shore' || !r.shore);
  const allProducts = products.filter((p) => state.mode === 'shore' || p.state !== 'shore');
  const counts = new Map(
    allProducts.map((p) => {
      const family = productFamilies.find((f) => f.members.includes(p.id));
      const selected = [
        ...new Set([...state.graphSelected.filter((id) => !family?.members.includes(id)), p.id]),
      ];
      const count = candidates.filter((r) => {
        if (!recipeMatches(r, selected)) return false;
        const inferred = choicesForSelection(r, selected);
        return (
          (!state.quick ||
            prepareRecipe(r, inferred.choices, {}, null, inferred.modules).time <= 20) &&
          (!state.pantryOnly ||
            availableRecipe(r, state.pantry, inferred.modules, inferred.choices))
        );
      }).length;
      return [p.id, count];
    }),
  );
  const allowed = allProducts.filter(
    (p) =>
      !state.graphSelected.length ||
      state.showUnavailable ||
      counts.get(p.id) > 0 ||
      state.graphSelected.includes(p.id),
  );
  const q = state.graphQuery.trim().toLocaleLowerCase('ru');
  const groups = mapProductGroups.map((g) => [g.name, (p) => p.graphGroup === g.id, g.note, g.id]);
  const used = new Set();
  return `<section class="page-intro network-intro"><div class="eyebrow">Карта ингредиентов</div><h1>Что приготовим <em>из этого?</em></h1><p>Выбирайте продукты — остаются блюда, в которых они встречаются вместе.<br>Учитываются замены и необязательные добавки. Каждый новый продукт сужает выбор.</p><figure class="galley-cover"><img src="./assets/galley.png" width="1536" height="1024" alt="Иллюстрация яхтенного камбуза: кастрюля с рисом и овощами, мерная кружка, закрытый пакет крупы и море в иллюминаторе" decoding="async" fetchpriority="high"/><figcaption>Простой запас. Понятные действия. Одна кастрюля.</figcaption></figure></section>
    <div class="network-controls"><label class="search-box">${icon('search')}<input id="graph-search" type="search" value="${esc(state.graphQuery)}" placeholder="Найти ингредиент" aria-label="Найти ингредиент"/></label>${recipeFilters()}${state.graphSelected.length ? `<button class="filter-pill" data-action="graph-unavailable" aria-pressed="${state.showUnavailable}">${state.showUnavailable ? 'Скрыть несовместимые' : 'Все продукты'}</button>` : ''}</div>
    <div class="selected-products" aria-live="polite">${state.graphSelected.length ? state.graphSelected.map((id) => `<button data-action="graph-product" data-id="${id}">${productById[id].name} ×</button>`).join('') + '<button class="clear-graph" data-action="graph-clear">Сбросить выбор</button>' : '<span>Можно начать с яиц, томатов, риса или любого другого продукта.</span>'}<button class="network-count" data-action="graph-results">${state.graphSelected.length ? 'Получится' : 'Всего'} <strong>${list.length}</strong> ${plural(list.length, 'рецепт', 'рецепта', 'рецептов')} ↓</button></div>
    <div class="map-groups ${state.graphSelected.length ? 'narrowed' : ''}" aria-label="Продукты по группам">${groups
      .map(([name, predicate, note, groupId]) => {
        const entries = allowed.filter((p) => !used.has(p.id) && predicate(p));
        entries.forEach((p) => used.add(p.id));
        const filtered = entries.filter(
          (p) => !q || t(p.name).toLocaleLowerCase(language).includes(q),
        );
        if (!filtered.length) return '';
        return `<section class="map-group" data-map-group="${groupId}"><h3>${name}<span>${filtered.length}</span></h3><div class="map-chips">${filtered
          .map((p) => {
            const count = counts.get(p.id) || 0;
            const family = productFamilies.find((f) => f.id === p.familyId);
            const selected = state.graphSelected.includes(p.id);
            return `<button class="map-chip" data-action="graph-product" data-id="${p.id}" aria-pressed="${selected}" ${!count && !selected ? 'disabled' : ''} title="${esc(family?.note || p.hint)}">${icon(productGlyph(p))}<span>${p.name}</span><small>${count}</small></button>`;
          })
          .join('')}</div>${note ? `<p>${note}</p>` : ''}</section>`;
      })
      .join('')}</div>
    <div id="graph-results" class="network-results"><div class="section-heading"><div><div class="eyebrow small">Продукты → состав → блюда</div><h2>${list.length} ${plural(list.length, 'подходящий рецепт', 'подходящих рецепта', 'подходящих рецептов')}</h2></div><a class="inline-link" href="#planner">Собрать закупку ${icon('arrow')}</a></div><div class="recipe-grid network-recipes ${list.length === 1 ? 'single' : ''}">${list.map((r) => recipeCard(r, true)).join('') || empty('Нет общего блюда', 'Уберите один из ингредиентов или сбросьте фильтр.')}</div></div>`;
}
