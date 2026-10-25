import { bases, recipeKinds } from '../../data.js';
import { icon } from '../icons.js';
import { t, plural } from '../../i18n/runtime.js';
export function renderRecipes({ state, catalog }) {
  const { visibleRecipes, recipeCard, searchBox, recipeFilters, empty } = catalog;

  const list = visibleRecipes();
  return `<section class="page-intro"><div class="eyebrow">03 / ОДНА ОСНОВА, НЕСКОЛЬКО ВАРИАНТОВ</div><h1>Меню простого <em>камбуза.</em></h1><p>Выбирайте приём пищи, вид блюда и основу независимо.<br>В универсальной карточке меняйте соус, наполнитель и подачу.</p></section><div class="recipe-generator-banner"><img class="generator-image" src="./assets/galley.png" width="1536" height="1024" alt="" loading="lazy" decoding="async"/><div><span class="eyebrow small">ОСНОВА → СОУС → НАПОЛНЕНИЕ</span><h2>Один вкус. Три разные основы.</h2><p>Паста, ризотто или картофель — с отдельной техникой и расчётом воды.</p></div><button class="button primary" data-action="recipe" data-id="dish-generator">Собрать блюдо ${icon('arrow')}</button></div>
    <div class="filter-caption">ПРИЁМ ПИЩИ</div><div class="meal-tabs" role="group" aria-label="Приём пищи">${[
      ['all', 'Всё меню'],
      ['main', 'Обед и ужин'],
      ['breakfast', 'Завтраки'],
      ['snack', 'Перекусы и закуски'],
    ]
      .map(
        ([id, label]) =>
          `<button data-action="meal" data-id="${id}" aria-pressed="${state.meal === id}" class="${state.meal === id ? 'active' : ''}">${icon({ all: 'book', main: 'pot', breakfast: 'sun', snack: 'bread' }[id])}${label}</button>`,
      )
      .join('')}</div>
    <div class="catalog-toolbar recipe-library-toolbar">${searchBox('Найти блюдо или ингредиент')}<label class="recipe-kind-select" for="recipe-kind"><span>Вид блюда</span><select id="recipe-kind" aria-label="Вид блюда"><option value="all">Все виды блюд</option>${recipeKinds.map((k) => `<option value="${k.id}" ${state.kind === k.id ? 'selected' : ''}>${k.name}</option>`).join('')}</select></label>${recipeFilters()}</div>
    <div class="filter-caption">ОСНОВА ИЗ ПРОДУКТОВ</div><div class="category-tabs" role="group" aria-label="Основы рецептов"><button data-action="base" data-id="all" aria-pressed="${state.base === 'all'}" class="${state.base === 'all' ? 'active' : ''}">Все основы</button>${bases.map((b) => `<button data-action="base" data-id="${b.id}" aria-pressed="${state.base === b.id}" class="${state.base === b.id ? 'active' : ''}">${b.name}</button>`).join('')}</div>
    <div class="result-heading"><span>${list.length} ${plural(list.length, 'рецепт', 'рецепта', 'рецептов')} ${t(state.mode === 'sea' ? 'для автономного запаса' : 'включая покупки с берега')}</span><span>${icon('swap')} Варианты внутри карточек</span></div><div class="active-recipe-filters" aria-live="polite">${state.meal !== 'all' ? `<span>Приём: ${state.meal === 'breakfast' ? 'завтрак' : state.meal === 'main' ? 'обед / ужин' : 'перекус'}</span>` : ''}${state.kind !== 'all' ? `<span>Вид: ${recipeKinds.find((k) => k.id === state.kind).name}</span>` : ''}${state.base !== 'all' ? `<span>Основа: ${bases.find((b) => b.id === state.base).name}</span>` : ''}${state.meal !== 'all' || state.kind !== 'all' || state.base !== 'all' ? '<button data-action="reset-filters">Сбросить фильтры ×</button>' : ''}</div>
    <div class="recipe-grid all-recipes">${list.map((r) => recipeCard(r)).join('') || empty(state.favoritesOnly && !state.favorites.length ? 'Избранное пока пусто' : 'Рецептов с этим сочетанием нет', state.favoritesOnly && !state.favorites.length ? 'Нажмите звёздочку у рецепта или сохраните выбранный вариант в его карточке.' : 'Снимите один из фильтров или выберите другую основу.')}</div><div class="storage-banner recipe-bottom">${icon('pot')}<p><strong>Планируйте одну готовку без открытых остатков.</strong> Скоропортящиеся упаковки расходуются целиком; размер определяет выход. Большую готовку съесть сейчас или разделить с попутчиком. Для блинов, оладий и котлет нужна также миска; работа у плиты указана в карточке.</p></div>`;
}
