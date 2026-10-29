import { buildShoppingText } from './export/shopping-list.js';
import { createAppState, parseRoute, routeHash, parsePagePath, pagePath } from './state/session.js';
import {
  language,
  t,
  localizeMarkup,
  languageSelector,
  refreshLanguageLinks,
  legalUrl,
} from './i18n/browser.js';
import { localizeRecipeCard } from './i18n/recipe-card.js';
import { renderRecipeDialog } from './ui/recipe-dialog.js';
import { getBrowserStorage, loadState, saveState } from './state/storage.js';
import { icon } from './ui/icons.js';
import { createCatalog } from './ui/catalog.js';
import { renderMap } from './ui/views/map.js';
import { renderPantry } from './ui/views/pantry.js';
import { renderRecipes } from './ui/views/recipes.js';
import { renderShopping } from './ui/views/shopping.js';
import { renderGenerators } from './ui/views/generators.js';
import { renderShell } from './ui/shell.js';
import { renderProductDetail } from './ui/product-detail.js';
import { openStove } from './stove.js';
import { createPlannerView } from './ui/views/planner.js';
import { drawGraph } from './ui/graph.js';
import { initThemeToggle } from './theme.js';
import { selectionSnapshot, sameSelection, favoriteKey } from './preferences.js';
import { buildRecipeCard, downloadRecipePng } from './recipe-export.js';

import { buildTrip, buildSeason } from './planner.js';
import {
  productById,
  recipeById,
  sources,
  starterPantry,
  productFamilies,
  generatorBySlug,
} from './data.js';
import {
  prepareRecipe,
  recipeSteps,
  effectiveIngredients,
  recipeProductIds,
  choicesForSelection,
  normalizeSelection,
} from './model.js';
import { generatorProfile, dishSlug } from './generator-engine.js';

const titles = {
  map: 'Карта вкусов',
  generators: 'Главы',
  pantry: 'Продукты',
  recipes: 'Рецепты',
  shopping: 'Список закупки',
  planner: 'План похода',
};
const storage = getBrowserStorage();
const restored = loadState(storage);
let storageFailed = restored.failed;

const persisted = restored.saved;
// The app's root, also when it boots on a prerendered page deeper in the site; that page
// gives the starting view (a chapter, a dish, a recipe or product drawer) unless a hash does.
const rootPath = new URL('../', import.meta.url).pathname;
const pageAt = (pathname) =>
  pathname.startsWith(rootPath) ? parsePagePath(pathname.slice(rootPath.length)) : null;
function pageHash(page) {
  if (!page) return '';
  if (page.kind === 'contents') return '#generators';
  if (page.kind === 'chapter') {
    const recipe = generatorBySlug[page.slug];
    const dish = recipe?.generator.dishes?.find((d) => dishSlug(recipe, d) === page.dish);
    return routeHash({
      view: 'generators',
      slug: page.slug,
      base: dish?.base || null,
      modules: dish?.modules || [],
    });
  }
  return page.kind === 'recipe' ? '#recipes' : '#pantry';
}
const currentRoute = () => parseRoute(location.hash || pageHash(pageAt(location.pathname)));
const state = createAppState(persisted, location.hash || pageHash(pageAt(location.pathname)));
const catalog = createCatalog(state);
const {
  activeRecipeSelection,
  searchedDish,
  recipeContext,
  visibleRecipes,
  recipeCard,
  searchBox,
  recipeFilters,
  empty,
  resolvedPlan,
  cartItems,
} = catalog;
const { renderPlanner, tripOptions } = createPlannerView(state);

let currentRecipe = null;
let currentProduct = null;
let choices = {};
let packSizes = {};
let anchorId = null;
let moduleIds = [];
let lastFocus = null;
// The open generator chapter keeps its own selection, apart from the recipe dialog.
let chapter = null;
let chapterActive = false;
let chapterDirty = false;
let toastTimer;

function save() {
  if (!saveState(storage, state)) {
    storageFailed = true;
    toast('Браузер не дал сохранить данные. В этой вкладке они остаются доступны.');
  }
}
function toast(text) {
  const el = document.querySelector('#toast');
  el.textContent = t(text);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

function shell() {
  document.querySelector('#app').innerHTML = localizeMarkup(
    renderShell({ languageLinks: languageSelector(), legalUrl }),
  );
  initThemeToggle(document.querySelector('[data-theme-toggle]'), t);
  render();
}

function handlePlannerAction(action, id, button) {
  if (action === 'graph-product') {
    const family = productFamilies.find((f) => f.members.includes(id));
    state.graphSelected = state.graphSelected.includes(id)
      ? state.graphSelected.filter((x) => x !== id)
      : [...state.graphSelected.filter((x) => !family?.members.includes(x)), id];
    render();
    return true;
  }
  if (action === 'graph-unavailable') {
    state.showUnavailable = !state.showUnavailable;
    render();
    return true;
  }
  if (action === 'graph-clear') {
    state.graphSelected = [];
    state.graphQuery = '';
    render();
    return true;
  }
  if (action === 'graph-focus') {
    state.graphFocus = state.graphFocus === id ? null : id;
    if (state.graphFocus) {
      const ids = recipeProductIds(recipeById[id]);
      document.querySelectorAll('.network-group').forEach((group) => {
        if (
          [...group.querySelectorAll('[data-product-node]')].some((n) =>
            ids.includes(n.dataset.productNode),
          )
        )
          group.open = true;
      });
    }
    requestAnimationFrame(() => drawGraph(state));
    return true;
  }
  if (action === 'graph-results') {
    document.querySelector('#graph-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  if (action === 'generator-base' && currentRecipe) {
    choices[recipeById[currentRecipe].generator.choiceKey] = id;
    openRecipe(currentRecipe, true);
    return true;
  }
  if (action === 'recipe-preset' && currentRecipe) {
    const recipe = recipeById[currentRecipe],
      preset = (recipe.generator?.presets || recipe.presets || []).find((p) => p.id === id);
    if (preset && (!preset.shore || state.mode === 'shore')) {
      moduleIds = [...preset.modules];
      anchorId = null;
      openRecipe(currentRecipe, true);
    }
    return true;
  }
  if (action === 'module' && currentRecipe) {
    const recipe = recipeById[currentRecipe],
      module = recipe.modules.find((m) => m.id === id);
    if (!module || (module.shore && state.mode !== 'shore')) return true;
    if (moduleIds.includes(id)) moduleIds = moduleIds.filter((x) => x !== id);
    else {
      if (module.group && !module.multiple)
        moduleIds = moduleIds.filter(
          (x) => recipe.modules.find((m) => m.id === x)?.group !== module.group,
        );
      moduleIds.push(id);
    }
    openRecipe(currentRecipe, true);
    return true;
  }
  if (action === 'trip-days') {
    state.tripDays = Number(id);
    render();
    return true;
  }
  if (action === 'planner-mode') {
    state.plannerMode = id;
    render();
    return true;
  }
  if (action === 'crew') {
    const inDetail = button.closest('#detail');
    state.crew = Number(id);
    // A season list is a snapshot of products, so it is rebuilt for the new crew.
    if (state.builderMeta?.kind === 'season')
      state.manual = [
        ...state.manual.filter((p) => p.source !== 'builder'),
        ...buildSeason(state.builderMeta.days, state.pantry, state.crew).items.map((i) => ({
          ...i,
          source: 'builder',
        })),
      ];
    save();
    if (inDetail && currentRecipe) openRecipe(currentRecipe, true);
    render();
    document
      .querySelector(inDetail ? '#detail' : '#main')
      .querySelector(`[data-action="crew"][data-id="${id}"]`)
      ?.focus();
    return true;
  }
  if (action === 'trip-recipe') {
    const entry = buildTrip(tripOptions()).entries.find((e) => e.key === id);
    if (entry) {
      choices = { ...entry.choices };
      packSizes = { ...entry.packSizes };
      anchorId = entry.anchorId;
      moduleIds = [...entry.modules];
      openRecipe(entry.recipeId, true);
      document.querySelector('#detail').scrollTop = 0;
    }
    return true;
  }
  if (action === 'apply-builder') {
    state.plan = state.plan.filter((p) => p.source !== 'builder');
    state.manual = state.manual.filter((p) => p.source !== 'builder');
    state.checked = [];
    if (state.plannerMode === 'trip') {
      const plan = buildTrip(tripOptions());
      state.plan.push(...plan.entries.map((e) => ({ ...e, key: crypto.randomUUID() })));
      state.builderMeta = { kind: 'trip', ...tripOptions() };
      delete state.builderMeta.pantry;
    } else {
      const plan = buildSeason(state.seasonDays, state.pantry, state.crew);
      state.manual.push(...plan.items.map((i) => ({ ...i, source: 'builder' })));
      state.builderMeta = { kind: 'season', days: plan.days };
    }
    save();
    goToHash('#shopping');
    toast('Список закупки сформирован');
    return true;
  }
  return false;
}
window.addEventListener('resize', () => {
  if (state.view === 'map') requestAnimationFrame(() => drawGraph(state));
});
document.fonts?.ready.then(() => requestAnimationFrame(() => drawGraph(state)));
document.addEventListener(
  'toggle',
  (event) => {
    if (event.target.classList?.contains('network-group'))
      requestAnimationFrame(() => drawGraph(state));
  },
  true,
);

function chapterFromRoute(route) {
  const recipe = generatorBySlug[route.slug];
  if (!recipe) return null;
  const choices = { ...route.choices };
  if (recipe.generator.bases.some((b) => b.id === route.base))
    choices[recipe.generator.choiceKey] = route.base;
  const kept = chapter?.recipeId === recipe.id ? chapter : null;
  return {
    recipeId: recipe.id,
    choices,
    packSizes: kept?.packSizes || {},
    anchorId: kept?.anchorId || null,
    moduleIds: normalizeSelection(recipe, choices, route.modules),
  };
}
function chapterHash() {
  const recipe = recipeById[chapter.recipeId];
  const { choiceKey } = recipe.generator;
  const swaps = Object.fromEntries(
    Object.entries(chapter.choices).filter(([key]) => key !== choiceKey),
  );
  return routeHash({
    view: 'generators',
    slug: recipe.generator.slug,
    base:
      generatorProfile(recipe, chapter.choices).id === recipe.generator.bases[0].id
        ? null
        : generatorProfile(recipe, chapter.choices).id,
    modules: chapter.moduleIds,
    choices: swaps,
  });
}
function chapterView() {
  if (state.view !== 'generators' || !state.route.slug) return null;
  if (!chapter || recipeById[chapter.recipeId].generator.slug !== state.route.slug)
    chapter = chapterFromRoute(state.route);
  if (!chapter) return null;
  const recipe = recipeById[chapter.recipeId];
  const prepared = prepareRecipe(
    recipe,
    chapter.choices,
    chapter.packSizes,
    chapter.anchorId,
    chapter.moduleIds,
    { crew: state.crew },
  );
  return {
    recipe,
    prepared,
    selection: {
      ...chapter,
      moduleIds: prepared.modules.map((m) => m.id),
      modules: prepared.modules,
    },
  };
}
// Runs a recipe action against the chapter's selection when it comes from the chapter page.
function inChapterContext(target, run) {
  if (!chapter || !target?.closest?.('.chapter-page')) return run();
  const outer = { currentRecipe, choices, packSizes, anchorId, moduleIds };
  ({ choices, packSizes, anchorId, moduleIds } = chapter);
  choices = { ...choices };
  packSizes = { ...packSizes };
  moduleIds = [...moduleIds];
  currentRecipe = chapter.recipeId;
  chapterActive = true;
  try {
    return run();
  } finally {
    chapter = { recipeId: chapter.recipeId, choices, packSizes, anchorId, moduleIds };
    ({ currentRecipe, choices, packSizes, anchorId, moduleIds } = outer);
    chapterActive = false;
    if (chapterDirty) {
      chapterDirty = false;
      window.history.replaceState(null, '', location.pathname + location.search + chapterHash());
      state.route = parseRoute(location.hash);
      render();
    }
  }
}
function openChapter(recipe, selection = {}) {
  chapter = {
    recipeId: recipe.id,
    choices: { ...(selection.choices || {}) },
    packSizes: { ...(selection.packSizes || {}) },
    anchorId: selection.anchorId || null,
    moduleIds: normalizeSelection(recipe, selection.choices || {}, selection.modules || []),
  };
  goToHash(chapterHash());
}

function render() {
  const focus = document.activeElement;
  const searchFocused = focus?.id === 'search';
  const cursor = searchFocused ? focus.selectionStart : null;
  document.querySelector('#main').innerHTML = localizeMarkup(
    {
      map: () => renderMap({ state, catalog }),
      pantry: () => renderPantry({ state, catalog }),
      generators: () => renderGenerators({ state, chapter: chapterView() }),
      recipes: () => renderRecipes({ state, catalog }),
      planner: renderPlanner,
      shopping: () => renderShopping({ state, catalog }),
    }[state.view](),
  );
  document.querySelectorAll('[data-nav]').forEach((n) => {
    n.classList.toggle('active', n.dataset.nav === state.view);
    if (n.dataset.nav === state.view) n.setAttribute('aria-current', 'page');
    else n.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-action="mode"]').forEach((n) => {
    n.classList.toggle('active', n.dataset.mode === state.mode);
    n.setAttribute('aria-pressed', String(n.dataset.mode === state.mode));
  });
  document.querySelector('#cart-count').textContent = t(cartItems().length);
  const chapterTitle =
    state.view === 'generators' && chapter && state.route.slug
      ? recipeById[chapter.recipeId].generator.chapter.title
      : null;
  document.title = t(`${chapterTitle || titles[state.view]} · Дельный камбуз · deelstuff`);
  refreshLanguageLinks();
  if (state.view === 'map') requestAnimationFrame(() => drawGraph(state));
  if (searchFocused) {
    const input = document.querySelector('#search');
    input?.focus();
    if (input && cursor !== null) input.setSelectionRange(cursor, cursor);
  }
}

function openDialog(content, kind = '', preserveScroll = false) {
  const dialog = document.querySelector('#detail');
  const previousScroll = dialog.scrollTop;
  if (!dialog.open) lastFocus = document.activeElement;
  document.querySelector('#detail-content').innerHTML = localizeMarkup(
    `<div class="drawer-top"><span class="eyebrow small">Камбуз / ${kind || 'Заметки на полях'}</span><button class="icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button></div>${content}`,
  );
  dialog.classList.toggle('recipe-sheet', kind === 'Рецепты');
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = preserveScroll ? previousScroll : 0;
  document.body.classList.add('dialog-open');
}
function openProduct(id) {
  const p = productById[id];
  if (!p) return;
  currentProduct = id;
  currentRecipe = null;
  openDialog(renderProductDetail(p, state), 'Продукты');
  showPage(pagePath(language, 'products', id), { dialog: 'product', id });
}
// A drawer takes the address of its prerendered page, so it can be shared and reloaded.
function showPage(path, entry) {
  if (location.pathname === rootPath + path) return;
  // One history step per open drawer: moving between drawers replaces it.
  if (window.history.state?.dialog) window.history.replaceState(entry, '', rootPath + path);
  else window.history.pushState(entry, '', rootPath + path);
  refreshLanguageLinks();
}
// Moves to an app view; away from a page address it keeps the document and its base.
function goToHash(hash) {
  if (location.pathname === rootPath) {
    location.hash = hash;
    return;
  }
  const dialog = document.querySelector('#detail');
  if (dialog.open) {
    leavingDrawer = true;
    dialog.close();
  }
  window.history.pushState(null, '', rootPath + location.search + hash);
  applyRoute();
}

function openFavorite(key) {
  const favorite = state.favorites.find((f) => favoriteKey(f) === key);
  if (!favorite) return;
  choices = { ...favorite.choices };
  packSizes = { ...favorite.packSizes };
  anchorId = favorite.anchorId;
  moduleIds = [...favorite.modules];
  const recipe = recipeById[favorite.recipeId];
  if (recipe.generator?.chapter) return openChapter(recipe, { ...favorite });
  openRecipe(favorite.recipeId, true);
}
// A card star toggles every saved variant of its recipe; in the favourites view it
// removes the one variant the card shows.
function toggleFavorite(id) {
  const keyed = state.favorites.find((f) => favoriteKey(f) === id);
  const recipe = recipeById[keyed?.recipeId || id];
  if (!recipe) return;
  const exists = Boolean(keyed) || state.favorites.some((f) => f.recipeId === id);
  if (keyed) state.favorites = state.favorites.filter((f) => f !== keyed);
  else if (exists) state.favorites = state.favorites.filter((f) => f.recipeId !== id);
  else {
    const context = recipeContext(recipe);
    state.favorites.push(
      selectionSnapshot(
        recipe,
        context.choices,
        context.packSizes,
        context.anchorId,
        context.modules,
      ),
    );
  }
  save();
  render();
  toast(exists ? 'Рецепт убран из избранного' : 'Рецепт добавлен в избранное');
}
function saveCurrentFavorite() {
  const recipe = recipeById[currentRecipe];
  if (!recipe) return;
  const snapshot = selectionSnapshot(recipe, choices, packSizes, anchorId, moduleIds),
    key = favoriteKey(snapshot),
    saved = state.favorites.find((f) => favoriteKey(f) === key);
  state.favorites = state.favorites.filter((f) => favoriteKey(f) !== key);
  if (!saved || !sameSelection(saved, snapshot)) state.favorites.push(snapshot);
  save();
  render();
  openRecipe(recipe.id, true);
  toast(
    saved && sameSelection(saved, snapshot)
      ? 'Рецепт убран из избранного'
      : saved
        ? 'Вариант в избранном обновлён'
        : 'Выбранный вариант сохранён в избранном',
  );
}

// The cooking mode takes the dish as it is selected now, in the drawer or the chapter.
function openCurrentStove() {
  const recipe = recipeById[currentRecipe];
  if (!recipe) return;
  const prepared = prepareRecipe(recipe, choices, packSizes, anchorId, moduleIds, {
    crew: state.crew,
  });
  openStove({
    title: prepared.title,
    prepared,
    steps: recipeSteps(recipe, choices, moduleIds, prepared),
  });
}
async function exportCurrentRecipe() {
  const recipe = recipeById[currentRecipe];
  if (!recipe) return;
  const card = localizeRecipeCard(
    buildRecipeCard(recipe, selectionSnapshot(recipe, choices, packSizes, anchorId, moduleIds), {
      crew: state.crew,
    }),
    t,
    language,
  );
  const button = document.querySelector('[data-action="recipe-png"]');
  if (button?.disabled) return;
  if (button) {
    button.disabled = true;
    button.textContent = t('Готовлю PNG…');
  }
  try {
    await downloadRecipePng(card);
    toast('PNG-карточка с выбранным вариантом сохранена');
  } catch {
    toast('Не удалось создать PNG. Попробуйте ещё раз в этой вкладке.');
  } finally {
    if (button?.isConnected) {
      button.disabled = false;
      button.innerHTML = localizeMarkup(icon('download') + ' Скачать PNG');
    }
  }
}
function openRecipe(id, keepChoices = false) {
  const r = recipeById[id];
  if (!r) return;
  if (chapterActive && keepChoices) {
    const prepared = prepareRecipe(
      r,
      choices,
      packSizes,
      anchorId,
      normalizeSelection(r, choices, moduleIds),
      { crew: state.crew },
    );
    anchorId = prepared.anchorId;
    moduleIds = prepared.modules.map((m) => m.id);
    chapterDirty = true;
    return;
  }
  if (!keepChoices) {
    choices = {};
    packSizes = {};
    anchorId = null;
    moduleIds = [];
    r.ingredients.forEach((i) => {
      if (!state.pantry.includes(i.id)) {
        const alt = i.alternatives.find((a) => state.pantry.includes(a.id));
        if (alt) choices[i.id] = alt.id;
      }
    });
  }
  const openingSelection =
    currentProduct &&
    document.querySelector('#detail').open &&
    recipeProductIds(r).includes(currentProduct)
      ? [currentProduct]
      : activeRecipeSelection();
  if (!keepChoices && openingSelection.length) {
    const inferred = choicesForSelection(r, openingSelection, state.pantry);
    choices = { ...choices, ...inferred.choices };
    moduleIds = inferred.modules;
  }
  const dish = !keepChoices && searchedDish(r);
  if (dish)
    return openChapter(r, {
      choices: { [r.generator.choiceKey]: dish.base },
      modules: dish.modules,
    });
  if (r.generator?.chapter && !keepChoices)
    return openChapter(r, { choices, packSizes, anchorId, modules: moduleIds });
  if (!keepChoices) showPage(pagePath(language, 'recipes', id), { dialog: 'recipe', id });
  currentRecipe = id;
  currentProduct = null;
  const prepared = prepareRecipe(r, choices, packSizes, anchorId, moduleIds, {
    crew: state.crew,
  });
  anchorId = prepared.anchorId;
  moduleIds = prepared.modules.map((m) => m.id);
  openDialog(
    renderRecipeDialog(r, prepared, { state, choices, packSizes, anchorId, moduleIds }),
    'Рецепты',
    keepChoices,
  );
}

function showSources() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Не календарь годности.<br>Навигатор по запасам.</h2><div class="prose"><p>Для яхты нет универсальной таблицы сроков: температура рундука, конденсат, упаковка и исходное качество меняют результат. Мы не выдаём домашние справочники за испытания во влажном море.</p><h3>Как читать карточки</h3><p><strong>«3–6 месяцев»</strong> — редакционный план ротации сухого запаса в герметичной пищевой упаковке, в тени, желательно при 15–21 °C. Он ограничен сроком и условиями производителя. Это не обещание безопасности на весь период.</p><p><strong>«План: 2–3 дня»</strong> — когда съесть свежие покупки, а не установленный срок годности. Проверяйте овощи каждый день. В жару берите только на ближайшее приготовление.</p><p><strong>После открытия</strong> — отдельный ориентир в каждой строке: для сухой крупы это месяцы, для хлеба дни, для вскрытых консервов часы. Открытие не продлевает заводской срок. Условия конкретного продукта могут требовать более короткого хранения.</p><h3>Защита от яхтенной влаги</h3><p>Сухую крупу и муку фасуйте в плотный пищевой zip-lock и убирайте в жёсткий герметичный контейнер. Пакет должен быть сухим внутри. Zip-lock защищает от влаги только при исправном замке; он не защищает от проколов и грызунов. Свежим целым луку и картофелю нужна вентиляция.</p><h3>После приготовления</h3><p>Готовая еда и вскрытые скоропортящиеся продукты без холода — максимум 2 часа; выше 32 °C — 1 час. Это суммарное время, не новый отсчёт после каждого разогрева. Без холодильника удобнее готовить на один раз.</p><h3>Сытость</h3><p>Часы в карточках — условная редакционная оценка, не данные исследования. Для специй и соусов время не указано. Размер порции, белок, клетчатка, жиры, сон и нагрузка меняют ощущение голода. Ориентиры не определяют норму питания.</p><h3>Проверенные источники</h3><p class="muted">Проверено 25 октября 2026. Рецепты и короткие планы ротации — редакционная адаптация для одиночного камбуза.</p><div class="sources-list">${sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.title} ↗</strong><span>${s.text}</span></a>`).join('')}</div></div>`,
    'Условия и источники',
  );
}
function showSubstitutions() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Меняйте продукты.<br>Сохраняйте идею.</h2><div class="prose"><p>Замена работает по роли: основа, белок, аромат, соус. Вкус и время при этом могут измениться.</p><div class="swap-card"><h3>Томатная паста ↔ другие томаты</h3><p><strong>40 г кетчупа</strong> — меньше соли, вкус слаще.<br><strong>Пассата</strong> — весь выбранный пакет; сухая основа пересчитывается под него, вода уменьшается по концентрации.<br><strong>200 г свежих томатов</strong> — примерно на 150 мл меньше воды, добавить время на размягчение.</p><p class="muted">Это стартовые пропорции, не точные эквиваленты: густота и кислотность различаются.</p></div><div class="swap-card"><h3>Свежие ароматы ↔ сухие</h3><p>Ориентир: 1 небольшая луковица ↔ 1 ст. л. сушёных луковых хлопьев или 1 ч. л. лукового порошка; 1 зубчик чеснока ↔ примерно ⅛ ч. л. порошка; 1 ч. л. тёртого имбиря ↔ ¼ ч. л. сухого.</p><p class="muted">Начинайте с меньшего количества. Смесь в рецептах — удобная ароматическая добавка, а не эквивалент объёма свежих овощей. Сухие специи не обжаривают так долго, как лук.</p></div><div class="swap-card"><h3>Белок ↔ белок</h3><p>Тунец ↔ сардины: целая небольшая банка. Мясные консервы ↔ соевый текстурат: гидратировать по инструкции. Фасоль ↔ нут: близкая масса без жидкости, но другой вкус.</p></div><div class="swap-card"><h3>Основа ↔ другая основа</h3><p>Рис, картофель и бобовые роднит принцип блюда, но не соотношение воды и время. Кускус запаривают, пасту помешивают, чечевицу разваривают. Сухую красную фасоль нельзя просто добавить вместо готовой.</p></div><p>В карточках выберите замену и размер её упаковки. Для пассаты используем весь пакет, а основу и начальный объём воды считаем от него. Закупка запомнит размер; банка 200 г и банка 500 г — разные позиции.</p></div>`,
    'Замены',
  );
}
function showMethod() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Один принцип.<br>Разные способы.</h2><div class="prose"><p>Граф показывает родство блюд, а точные количества и порядок находятся в рецептах.</p><h3>1. Ароматическая основа</h3><p>Масло + свежий лук или сухие ароматы. Свежий лук обжаривают несколько минут, сухие специи прогревают только 20–30 секунд, чтобы не сжечь.</p><h3>2. Основа и жидкость</h3><p>Рис впитывает воду под крышкой; паста варится в небольшом количестве воды с помешиванием; красная чечевица разваривается. Картофель нарезают мелкими кубиками. Консервированные бобовые уже готовы.</p><h3>3. Характер блюда</h3><p>Зира и морковь ведут к плову. Томаты и паприка — к рису с рыбой или чили. Карри и кокосовое молоко — к далу или карри. Рыбные и мясные консервы обычно добавляют ближе к концу, затем хорошо прогревают.</p><div class="detail-notice">${icon('info')}<p>Кускус — отдельная ветка: его добавляют после выключения огня. Свежий фарш обжаривают в начале и проверяют термометром. Общая схема не заменяет эти различия.</p></div></div>`,
    'Общая схема',
  );
}
function showSatiety() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Сытость — ориентир,<br>а не таймер.</h2><div class="prose"><p>Нельзя надёжно обещать, что 100 г риса обеспечат конкретному человеку ровно три часа сытости. Часы в каталоге — условные редакционные диапазоны для бытового планирования.</p><h3>Что мы показываем</h3><p>У основы — порцию сухого продукта перед приготовлением. У бобовых — массу без жидкости. У консервированного белка — порцию в составе еды. У соусов и специй — «добавка» вместо часов.</p><h3>Как собрать более сытную еду</h3><p>Добавьте к рису, пасте или картофелю белок: чечевицу, нут, фасоль, рыбу, мясные консервы или текстурат. Небольшое количество масла повышает энергетическую ценность, овощи и бобовые добавляют клетчатку.</p><p>Подстраивайте порцию под свой аппетит, физическую работу, погоду и длину вахты. Мужской пол сам по себе не задаёт порцию. Приложение не рассчитывает дневные калории, белок или достаточность питания на переход.</p><a class="source-link" href="https://pubmed.ncbi.nlm.nih.gov/7498104/" target="_blank" rel="noopener noreferrer">Исследование Holt et al.: сравнение сытости, а не часы для нашего каталога ↗</a></div>`,
    'Сытость',
  );
}

function addManual(id) {
  if (!productById[id]) return;
  if (state.pantry.includes(id)) {
    toast('Продукт уже отмечен в рундуке и исключён из закупки.');
    return;
  }
  if (!state.manual.some((i) => i.id === id)) state.manual.push({ id, amount: 1, unit: 'уп.' });
  state.checked = state.checked.filter((k) => !k.startsWith(id + ':'));
  save();
  render();
  toast('Добавлено в список закупки');
}
function exportList() {
  const text = buildShoppingText({ ...state, items: cartItems() }, { translate: t, language });
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + text], {
      type: 'text/plain;charset=utf-8',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'deelkombuese-zakupka.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Список и меню сохранены в текстовый файл');
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.blockedReason) return toast(button.dataset.blockedReason);
  inChapterContext(button, () => handleClick(event, button));
});
function handleClick(event, button) {
  const { action, id } = button.dataset;
  if (action === 'favorite-recipe') return openFavorite(id);
  if (action === 'favorite-toggle') return toggleFavorite(id);
  if (action === 'favorite-current') return saveCurrentFavorite();
  if (action === 'recipe-png') return exportCurrentRecipe();
  if (action === 'stove') return openCurrentStove();
  if (action === 'recipe') return openRecipe(id);
  if (action === 'planned-recipe') {
    const entry = state.plan.find((p) => p.key === id);
    if (entry) {
      choices = { ...entry.choices };
      packSizes = { ...entry.packSizes };
      anchorId = entry.anchorId;
      moduleIds = [...(entry.modules || [])];
      openRecipe(entry.recipeId, true);
    }
    return;
  }
  if (action === 'product') return openProduct(id);
  if (action === 'sources') return showSources();
  if (action === 'substitutions') return showSubstitutions();
  if (action === 'satiety') return showSatiety();
  if (action === 'method') return showMethod();
  if (action === 'close') return document.querySelector('#detail').close();
  if (action === 'mode') {
    state.mode = button.dataset.mode;
    if (state.category === 'С берега' && state.mode === 'sea') state.category = 'all';
    save();
    render();
    toast(
      state.mode === 'shore'
        ? 'Доступны охлаждённые продукты для ближайшей готовки'
        : 'Показан запас без холодильника',
    );
    return;
  }
  if (action === 'base') state.base = state.base === id ? 'all' : id;
  if (action === 'favorites-only') state.favoritesOnly = !state.favoritesOnly;
  if (action === 'quick') state.quick = !state.quick;
  if (action === 'pantry-only') state.pantryOnly = !state.pantryOnly;
  if (action === 'owned-only') state.ownedOnly = !state.ownedOnly;
  if (action === 'category') state.category = id;
  if (action === 'sort') {
    if (state.sortKey === id) state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    else {
      state.sortKey = id;
      state.sortDirection = 'asc';
    }
  }
  if (action === 'meal') {
    state.meal = id;
    state.base = 'all';
    state.kind = 'all';
  }
  if (action === 'reset-filters') {
    state.graphSelected = [];
    state.graphQuery = '';
    state.query = '';
    state.base = 'all';
    state.category = 'all';
    state.quick = false;
    state.pantryOnly = false;
    state.ownedOnly = false;
    state.meal = 'all';
    state.kind = 'all';
    state.favoritesOnly = false;
  }
  if (action === 'starter') {
    state.pantry = [...new Set([...state.pantry, ...starterPantry])];
    save();
    toast('Добавлен базовый набор из 10 продуктов. Проверьте фактическое наличие.');
  }
  if (action === 'toggle-pantry') {
    if (!productById[id] || productById[id].state === 'shore') return;
    state.pantry = state.pantry.includes(id)
      ? state.pantry.filter((x) => x !== id)
      : [...state.pantry, id];
    save();
    if (currentProduct && document.querySelector('#detail').open) openProduct(currentProduct);
  }
  if (action === 'manual') return addManual(id);
  if (action === 'manual-select') {
    const select = document.querySelector('#manual-product');
    if (select.value) addManual(select.value);
    return;
  }
  if (action === 'add-plan') {
    const existing = state.plan.find(
      (p) =>
        p.recipeId === id &&
        JSON.stringify(p.choices) === JSON.stringify(choices) &&
        JSON.stringify(p.packSizes || {}) === JSON.stringify(packSizes) &&
        p.anchorId === anchorId &&
        JSON.stringify(p.modules || []) === JSON.stringify(moduleIds),
    );
    if (existing) existing.count = Math.min(30, existing.count + 1);
    else
      state.plan.push({
        key: crypto.randomUUID(),
        recipeId: id,
        count: 1,
        choices: { ...choices },
        packSizes: { ...packSizes },
        anchorId,
        modules: [...moduleIds],
        source: 'user',
      });
    state.checked = [];
    save();
    render();
    toast('В закупке сохранены целые упаковки и выбранные замены.');
    return;
  }
  if (action === 'plan-minus' || action === 'plan-plus') {
    const entry = state.plan.find((p) => p.key === id);
    if (entry) {
      entry.count = Math.min(30, Math.max(1, entry.count + (action === 'plan-plus' ? 1 : -1)));
      state.checked = [];
      save();
    }
  }
  if (action === 'plan-remove') {
    state.plan = state.plan.filter((p) => p.key !== id);
    state.checked = [];
    save();
  }
  if (action === 'clear-plan') {
    const previous = {
      plan: state.plan,
      manual: state.manual,
      checked: state.checked,
      builderMeta: state.builderMeta,
    };
    state.plan = [];
    state.manual = [];
    state.checked = [];
    state.builderMeta = null;
    save();
    render();
    const el = document.querySelector('#toast');
    toast('План очищен.');
    const undo = document.createElement('button');
    undo.textContent = t('Отменить');
    undo.onclick = () => {
      Object.assign(state, previous);
      save();
      render();
      toast('План восстановлен');
    };
    el.append(' ', undo);
    return;
  }
  if (action === 'export') return exportList();
  if (handlePlannerAction(action, id, button)) return;
  render();
}
document.addEventListener('input', (event) => {
  if (event.target.id === 'search') {
    state.query = event.target.value;
    render();
  }
  if (event.target.id === 'graph-search') {
    state.graphQuery = event.target.value;
    const cursor = event.target.selectionStart;
    render();
    const input = document.querySelector('#graph-search');
    input.focus();
    input.setSelectionRange(cursor, cursor);
  }
});
document.addEventListener('change', (event) =>
  inChapterContext(event.target, () => handleChange(event)),
);
function handleChange(event) {
  // The chapter sentence: a base or a single-choice group such as the sauce or filling.
  const axis = event.target.dataset.generatorAxis;
  if (axis && currentRecipe) {
    const recipe = recipeById[currentRecipe];
    if (axis === 'base') choices[recipe.generator.choiceKey] = event.target.value;
    else {
      moduleIds = moduleIds.filter((id) => recipe.modules.find((m) => m.id === id)?.group !== axis);
      if (event.target.value) moduleIds.push(event.target.value);
    }
    openRecipe(currentRecipe, true);
    return;
  }
  if (event.target.id === 'recipe-kind') {
    state.kind = event.target.value;
    render();
  }
  if (event.target.dataset.swap && currentRecipe) {
    const ingredient = effectiveIngredients(recipeById[currentRecipe], moduleIds).find(
      (i) => i.id === event.target.dataset.swap,
    );
    if (!ingredient) return;
    choices[ingredient.id] = event.target.value;
    if (productById[event.target.value].packages) anchorId = event.target.value;
    else if (anchorId === ingredient.id) anchorId = null;
    const focusId = event.target.id;
    openRecipe(currentRecipe, true);
    document.getElementById(focusId)?.focus();
  }
  if (event.target.dataset.variant) {
    state.variants[event.target.dataset.variant] = event.target.value;
    state.category = 'all';
    render();
  }
  if (event.target.dataset.pack && currentRecipe) {
    packSizes[event.target.dataset.pack] = Number(event.target.value);
    anchorId = event.target.dataset.pack;
    const focusId = event.target.id;
    openRecipe(currentRecipe, true);
    document.getElementById(focusId)?.focus();
  }
  if (event.target.id === 'pack-anchor' && currentRecipe) {
    anchorId = event.target.value;
    openRecipe(currentRecipe, true);
    document.getElementById('pack-anchor')?.focus();
  }
  if (event.target.dataset.tripOverride) {
    state.tripOverrides[event.target.dataset.tripOverride] = event.target.value;
    render();
  }
  if (event.target.dataset.builderField) {
    const field = event.target.dataset.builderField;
    state[field] =
      event.target.type === 'checkbox'
        ? event.target.checked
        : Math.min(
            Number(event.target.max) || Infinity,
            Math.max(Number(event.target.min) || 0, Number(event.target.value) || 0),
          );
    // The stove's gas rate and the kettle belong to the galley, not to one list.
    if (['burnerRate', 'kettleMinutes'].includes(field)) save();
    render();
  }
  if (event.target.dataset.shoppingKey) {
    const key = event.target.dataset.shoppingKey;
    state.checked = event.target.checked
      ? [...new Set([...state.checked, key])]
      : state.checked.filter((k) => k !== key);
    save();
    render();
  }
}
function applyRoute() {
  const route = currentRoute();
  if (route.view === 'generators' && route.slug) chapter = chapterFromRoute(route);
  state.route = route;
  state.view = route.view;
  state.query = '';
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('#main').focus({ preventScroll: true });
}
window.addEventListener('hashchange', applyRoute);
// Back and forward move between drawers and views; a drawer's own page reopens it.
let leavingDrawer = false;
window.addEventListener('popstate', (event) => {
  const entry = event.state;
  const page = pageAt(location.pathname);
  const dialog = document.querySelector('#detail');
  if (entry?.dialog === 'recipe') return openRecipe(entry.id);
  if (entry?.dialog === 'product') return openProduct(entry.id);
  if (dialog.open) {
    leavingDrawer = true;
    dialog.close();
  }
  if (route(state.route) !== route(currentRoute())) applyRoute();
  refreshLanguageLinks();
  if (!location.hash && page?.kind === 'recipe') openRecipe(page.id);
  if (!location.hash && page?.kind === 'product') openProduct(page.id);
});
const route = (r) => JSON.stringify([r.view, r.slug, r.base, r.modules, r.choices]);
document.querySelector('#detail').addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  currentRecipe = null;
  currentProduct = null;
  lastFocus?.isConnected && lastFocus.focus();
  // Leave the drawer's address: back to where it was opened, or, for a reader who arrived
  // on the drawer's own page, to the app view under it.
  if (leavingDrawer) leavingDrawer = false;
  else if (window.history.state?.dialog) window.history.back();
  else if (['recipe', 'product'].includes(pageAt(location.pathname)?.kind))
    window.history.replaceState(null, '', rootPath + location.search + '#' + state.view);
  refreshLanguageLinks();
});
// Links to app views stay in the app, also on a prerendered page or a drawer's address.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  const hash = link?.getAttribute('href');
  if (!hash || hash === '#main' || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
  event.preventDefault();
  goToHash(hash);
});
document.querySelector('#detail').addEventListener('click', (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  if (
    event.target === event.currentTarget &&
    (event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom)
  )
    event.currentTarget.close();
});
shell();
// A prerendered recipe or product page opens its drawer over the app view.
{
  const page = pageAt(location.pathname);
  if (!location.hash && page?.kind === 'recipe') openRecipe(page.id);
  if (!location.hash && page?.kind === 'product') openProduct(page.id);
}
if (storageFailed) toast('Сохранение в браузере недоступно. Данные останутся в текущей вкладке.');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('../sw.js', import.meta.url))
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      const el = document.querySelector('#offline-status');
      el.classList.add('ready');
      el.innerHTML = localizeMarkup('<i></i> Без связи тоже работает');
    })
    .catch(() => {
      document.querySelector('#offline-status').textContent = t(
        'Для офлайна откройте через localhost или HTTPS',
      );
    });
}
