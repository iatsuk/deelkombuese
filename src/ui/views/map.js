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
    <div class="visual-start" aria-label="Как пользоваться камбузом">${[
      ['box', '1. Выберите продукты', 'Что уже есть на борту?'],
      ['swap', '2. Соберите вариант', 'Основа, соус и добавки'],
      ['measure', '3. Готовьте по шагам', 'Мерки, вода и слабый огонь'],
      ['download', '4. Сохраните карточку', 'PNG под рукой на вахте'],
    ]
      .map(
        ([ic, title, note]) =>
          `<div>${icon(ic)}<span><strong>${title}</strong><small>${note}</small></span></div>`,
      )
      .join('')}</div>
    <div class="network-controls"><label class="search-box">${icon('search')}<input id="graph-search" type="search" value="${esc(state.graphQuery)}" placeholder="Найти ингредиент" aria-label="Найти ингредиент"/></label>${recipeFilters()}${state.graphSelected.length ? `<button class="filter-pill" data-action="graph-unavailable" aria-pressed="${state.showUnavailable}">${state.showUnavailable ? 'Скрыть несовместимые' : 'Все продукты'}</button>` : ''}<button class="network-count" data-action="graph-results"><strong>${list.length}</strong> ${plural(list.length, 'рецепт', 'рецепта', 'рецептов')} ↓</button></div>
    <div class="selected-products" aria-live="polite">${state.graphSelected.length ? state.graphSelected.map((id) => `<button data-action="graph-product" data-id="${id}">${productById[id].name} ×</button>`).join('') + '<button class="clear-graph" data-action="graph-clear">Сбросить выбор</button>' : '<span>Можно начать с яиц, томатов, риса или любого другого продукта.</span>'}</div>
    <section class="ingredient-network" aria-label="Граф продуктов и рецептов"><svg class="network-lines" aria-hidden="true"></svg><div class="network-products">${groups
      .map(([name, predicate, note, groupId], groupIndex) => {
        const entries = allowed.filter((p) => !used.has(p.id) && predicate(p));
        entries.forEach((p) => used.add(p.id));
        const filtered = entries.filter(
          (p) => !q || t(p.name).toLocaleLowerCase(language).includes(q),
        );
        if (!filtered.length) return '';
        return `<details data-map-group="${groupId}" class="network-group ${filtered.length > 10 ? 'dense' : ''}" ${q || groupIndex < 3 || entries.some((p) => state.graphSelected.includes(p.id)) ? 'open' : ''}><summary>${name}<span>${filtered.length}</span></summary><div>${filtered
          .map((p) => {
            const count = counts.get(p.id) || 0;
            const family = productFamilies.find((f) => f.id === p.familyId);
            return `<button class="graph-node ${state.graphSelected.includes(p.id) ? 'selected' : ''}" data-action="graph-product" data-id="${p.id}" data-product-node="${p.id}" aria-pressed="${state.graphSelected.includes(p.id)}" ${!count && !state.graphSelected.includes(p.id) ? 'disabled' : ''} title="${esc(family?.note || p.hint)}"><span>${icon(productGlyph(p))} ${p.name}</span><small>${count}</small></button>`;
          })
          .join('')}</div>${note ? `<p>${note}</p>` : ''}</details>`;
      })
      .join('')}</div>
    <div class="graph-legend"><span><i></i> обязательный ингредиент / замена</span><span><i class="optional"></i> необязательная добавка</span><span>Кнопка «Связи» показывает состав выбранного блюда.</span></div>
    <div id="graph-results" class="network-results"><div class="section-heading"><div><div class="eyebrow small">Продукты → состав → блюда</div><h2>${list.length} ${plural(list.length, 'подходящий рецепт', 'подходящих рецепта', 'подходящих рецептов')}</h2></div><a class="inline-link" href="#planner">Собрать закупку ${icon('arrow')}</a></div><div class="recipe-grid network-recipes ${list.length === 1 ? 'single' : ''}">${list.map((r) => `<div class="graph-recipe ${state.graphFocus === r.id ? 'focused' : ''}" data-graph-recipe="${r.id}">${recipeCard(r, true)}<button class="graph-focus" data-action="graph-focus" data-id="${r.id}" aria-pressed="${state.graphFocus === r.id}">${icon('map')} Связи ${r.template ? '· гибкое блюдо' : ''}</button></div>`).join('') || empty('Нет общего блюда', 'Уберите один из ингредиентов или сбросьте фильтр.')}</div></div></section>`;
}
