import { generators, recipes } from '../../data.js';
import { guides } from '../../catalog/guides.js';
import { optionBlocked } from '../../model.js';
import { generatorProfile } from '../../generator-engine.js';
import { routeHash, pagePath } from '../../state/session.js';
import { renderRecipeDialog } from '../recipe-dialog.js';
import { icon, esc } from '../icons.js';
import { t, plural, language } from '../../i18n/runtime.js';

const knownDishes = (recipe) => recipe.generator.dishes || recipe.generator.presets || [];
// Each chapter has a gouache named after its slug (provenance in docs/visual-assets.md).
const chapterImage = (recipe, loading) =>
  `<img src="./assets/chapters/${recipe.generator.slug}.jpg" width="1200" height="800" alt="${esc(recipe.generator.chapter.alt)}" loading="${loading}" decoding="async"/>`;

// The meal a reader looks for; the chapters and the flavour map cover kinds and products.
const meals = [
  ['all', 'Всё меню', 'book'],
  ['main', 'Обед и ужин', 'pot'],
  ['breakfast', 'Завтраки', 'sun'],
  ['snack', 'Перекусы и закуски', 'bread'],
];
const filtered = (state) =>
  Boolean(
    state.query.trim() ||
    state.favoritesOnly ||
    state.quick ||
    state.pantryOnly ||
    state.meal !== 'all',
  );

function renderChapterList() {
  return `<ol class="chapter-list">${generators
    .map((recipe, index) => {
      const { chapter, slug } = recipe.generator;
      const dishes = knownDishes(recipe);
      return `<li><a href="#generators/${slug}">${chapterImage(recipe, index < 2 ? 'eager' : 'lazy')}<span class="chapter-number">Глава ${index + 1}</span><strong>${chapter.title}</strong><span class="chapter-formula">${chapter.formula}</span><span class="chapter-dishes">${dishes
        .slice(0, 5)
        .map((d) => d.name || d.label)
        .join(
          ', ',
        )}</span><span class="chapter-count">${dishes.length} ${plural(dishes.length, 'сочетание', 'сочетания', 'сочетаний')} ${icon('arrow')}</span></a></li>`;
    })
    .join('')}</ol>`;
}

// Search results, a meal or favourites replace the contents with matching cards.
function renderResults(state, catalog) {
  const { visibleRecipes, recipeCard, empty } = catalog;
  const list = visibleRecipes();
  const active = [
    state.meal !== 'all' &&
      `<span>Приём: ${state.meal === 'breakfast' ? 'завтрак' : state.meal === 'main' ? 'обед / ужин' : 'перекус'}</span>`,
  ].filter(Boolean);
  return `<div class="result-heading"><span>${list.length} ${plural(list.length, 'рецепт', 'рецепта', 'рецептов')} ${t(state.mode === 'sea' ? 'для автономного запаса' : 'включая покупки с берега')}</span><span>${icon('swap')} Варианты внутри карточек</span></div><div class="active-recipe-filters" aria-live="polite">${active.join('')}<button data-action="reset-filters">Сбросить фильтры ×</button></div>
    <div class="recipe-grid all-recipes">${list.map((r) => recipeCard(r)).join('') || empty(state.favoritesOnly && !state.favorites.length ? 'Избранное пока пусто' : 'Рецептов с этим сочетанием нет', state.favoritesOnly && !state.favorites.length ? 'Нажмите звёздочку у рецепта или сохраните выбранный вариант в его карточке.' : 'Снимите один из фильтров или поищите другое блюдо.')}</div>`;
}

// The skipper's cheat sheets close the contents; each card links to its own page.
function renderGuideShelf() {
  return `<section class="guide-shelf"><h2>Шпаргалки шкипера</h2><div class="guide-cards">${guides
    .map(
      (guide) =>
        `<a class="guide-card" href="${pagePath(language, 'guides', guide.id)}" data-action="guide" data-id="${guide.id}"><img src="./assets/guides/${guide.id}.jpg" width="1200" height="800" alt="" loading="lazy" decoding="async"/><strong>${guide.title}</strong><span>${guide.summary}</span></a>`,
    )
    .join('')}</div></section>`;
}

// The cookbook contents, the start screen: chapters, then the recipes outside a chapter.
// Search, meals and favourites narrow it to cards.
function renderContents(state, catalog) {
  const { searchBox, recipeFilters, recipeCard } = catalog;
  const standalone = recipes.filter((r) => !r.generator);
  return `<section class="page-intro chapters-intro"><div class="eyebrow">Рецепты</div><h1>Книга кока</h1><p>Каждая глава — способ готовки, в котором основу и наполнение можно менять. Выберите, что есть на борту, — получится блюдо с расчётом воды, времени и закупки.</p></section>
    <div class="meal-tabs" role="group" aria-label="Приём пищи">${meals
      .map(
        ([id, label, glyph]) =>
          `<button data-action="meal" data-id="${id}" aria-pressed="${state.meal === id}" class="${state.meal === id ? 'active' : ''}">${icon(glyph)}${label}</button>`,
      )
      .join('')}</div>
    <div class="catalog-toolbar recipe-library-toolbar">${searchBox('Найти блюдо или ингредиент')}${recipeFilters()}</div>
    ${
      filtered(state)
        ? renderResults(state, catalog)
        : `${renderChapterList()}<section class="standalone-recipes"><h2>Отдельные рецепты</h2><div class="recipe-grid">${standalone
            .map((r) => recipeCard(r, false, { link: true }))
            .join('')}</div></section>${renderGuideShelf()}`
    }
    <div class="storage-banner recipe-bottom">${icon('pot')}<p><strong>Планируйте одну готовку без открытых остатков.</strong> Скоропортящиеся упаковки расходуются целиком; размер определяет выход. Большую готовку съесть сейчас или разделить с попутчиком. Для блинов, оладий и котлет нужна также миска; работа у плиты указана в карточке.</p></div>`;
}

function sentenceSelect(recipe, selection, part, state) {
  if (part.axis === 'base') {
    const current = generatorProfile(recipe, selection.choices);
    return `<span class="sentence-slot"><select class="sentence-choice" data-generator-axis="base" aria-label="Основа">${recipe.generator.bases
      .map(
        (base) =>
          `<option value="${base.id}" ${base.id === current.id ? 'selected' : ''}>${base.phrase || base.label}</option>`,
      )
      .join('')}</select></span>`;
  }
  const modules = recipe.modules.filter((m) => m.group === part.group);
  const selected = selection.modules.find((m) => m.group === part.group);
  const options = modules.map((module) => {
    const unavailable =
      (module.shore && state.mode !== 'shore') ||
      optionBlocked(recipe, selection.choices, selection.moduleIds, module.id);
    return `<option value="${module.id}" ${module.id === selected?.id ? 'selected' : ''} ${unavailable ? 'disabled' : ''}>${module.phrase || module.label}</option>`;
  });
  if (part.empty) options.unshift(`<option value="">${part.empty}</option>`);
  return `<span class="sentence-slot"><select class="sentence-choice" data-generator-axis="${part.group}" aria-label="${modules[0]?.label || part.group}">${options.join('')}</select></span>`;
}

// Options outside the sentence (vegetables, toppings, spices) stay as toggles.
function renderAdditions(recipe, selection, state) {
  const inSentence = new Set(recipe.generator.sentence.map((part) => part.group).filter(Boolean));
  const groups = [
    ['method', 'Способ'],
    ['vegetables', 'Овощи'],
    ['finish', 'Подача'],
    [null, 'Специи и добавки'],
  ];
  return groups
    .map(([group, label]) => {
      if (inSentence.has(group)) return '';
      const modules = recipe.modules.filter(
        (m) => (m.group || null) === group && !recipe.generator.defaultModules?.includes(m.id),
      );
      if (!modules.length) return '';
      return `<div class="chapter-additions"><span>${label}</span><div class="module-buttons" role="group" aria-label="${label}">${modules
        .map((module) => {
          const active = selection.moduleIds.includes(module.id);
          const reason = optionBlocked(recipe, selection.choices, selection.moduleIds, module.id);
          return `<button data-action="module" data-id="${module.id}" class="${active ? 'active' : ''}" aria-pressed="${active}" ${module.shore && state.mode !== 'shore' ? 'disabled' : ''} ${reason ? `data-blocked-reason="${esc(reason)}" aria-disabled="true" title="${esc(reason)}"` : ''}>${icon(active ? 'check' : 'plus')} ${module.label}</button>`;
        })
        .join('')}</div></div>`;
    })
    .join('');
}

function renderKnown(recipe, selection, state, prepared) {
  const base = generatorProfile(recipe, selection.choices).id;
  return `<div class="chapter-known"><span>Известные сочетания</span><div>${knownDishes(recipe)
    .map((dish) => {
      const href = routeHash({
        view: 'generators',
        slug: recipe.generator.slug,
        base: dish.base || base,
        modules: dish.modules,
      });
      // A named dish is active when it is the current title; a preset when its modules are on.
      const active = dish.name
        ? prepared.title === dish.name
        : dish.modules.every((id) => selection.moduleIds.includes(id));
      return dish.shore && state.mode !== 'shore'
        ? `<span class="known-dish unavailable">${dish.name || dish.label}</span>`
        : `<a class="known-dish ${active ? 'active' : ''}" href="${href}">${dish.name || dish.label}</a>`;
    })
    .join('')}</div></div>`;
}

export function renderGenerators({ state, chapter, catalog }) {
  if (!chapter) return renderContents(state, catalog);
  const { recipe, prepared, selection } = chapter;
  const number = generators.indexOf(recipe) + 1;
  const { title, principle } = recipe.generator.chapter;
  const parts = recipe.generator.sentence.map((part) =>
    typeof part === 'string'
      ? `<span>${part}</span>`
      : sentenceSelect(recipe, selection, part, state),
  );
  // The full stop stays on the line of the last choice.
  const sentence = `${parts.slice(0, -1).join(' ')} <span class="sentence-tail">${parts.at(-1)}.</span>`;
  return `<article class="chapter-page" data-generator="${recipe.id}"><nav class="chapter-crumb" aria-label="${t('Рецепты')}"><a href="#generators">Рецепты</a><span aria-hidden="true">/</span><span>Глава ${number}</span></nav>
    <header class="chapter-head"><div><h1>${title}</h1><p>${principle}</p></div><figure>${chapterImage(recipe, 'eager')}</figure></header>
    <section class="chapter-builder" aria-label="Собрать блюдо"><p class="chapter-sentence">${sentence}</p>${renderAdditions(recipe, selection, state)}${renderKnown(recipe, selection, state, prepared)}</section>
    ${renderRecipeDialog(recipe, prepared, { ...selection, state, embedded: true })}</article>`;
}
