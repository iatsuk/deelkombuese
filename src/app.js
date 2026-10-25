import { buildShoppingText } from './export/shopping-list.js';
import { createAppState, views } from './state/session.js';
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
import { createPlannerView } from './ui/views/planner.js';
import { drawGraph } from './ui/graph.js';
import { selectionSnapshot, sameSelection } from './preferences.js';
import { buildRecipeCard, downloadRecipePng } from './recipe-export.js';

import { productGlyph } from './cooking-visuals.js';
import { buildTrip, buildSeason } from './planner.js';
import {
  productById,
  recipes,
  recipeById,
  sources,
  starterPantry,
  variantGroups,
  productFamilies,
} from './data.js';
import {
  formatAmount,
  prepareRecipe,
  effectiveIngredients,
  recipeProductIds,
  choicesForSelection,
} from './model.js';

const titles = {
  map: 'Карта вкусов',
  pantry: 'Продукты',
  recipes: 'Рецепты',
  shopping: 'Список закупки',
  planner: 'План похода',
};
const storage = getBrowserStorage();
const restored = loadState(storage);
let storageFailed = restored.failed;

const persisted = restored.saved;
const state = createAppState(persisted, location.hash);
const catalog = createCatalog(state);
const {
  activeRecipeSelection,
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
  document.querySelector('#app').innerHTML = localizeMarkup(`<aside class="sidebar">
    <a class="brand" href="#map" aria-label="Дельный камбуз — главная"><span class="brand-mark">${icon('pot')}</span><span class="brand-name">дельный<br>камбуз<span class="brand-by">a deelstuff project</span></span></a>
    <div class="sidebar-label">ЕДА ПОД ПАРУСОМ</div>
    <nav aria-label="Основная навигация">${[
      ['map', 'map', 'Карта вкусов'],
      ['pantry', 'box', 'Продукты'],
      ['recipes', 'book', 'Рецепты'],
      ['planner', 'anchor', 'План похода'],
      ['shopping', 'bag', 'Закупка'],
    ]
      .map(
        ([v, ic, t]) =>
          `<a href="#${v}" data-nav="${v}" aria-label="${t}">${icon(ic)}<span>${t}</span>${v === 'shopping' ? '<span id="cart-count" class="nav-count">0</span>' : ''}</a>`,
      )
      .join('')}</nav>
    <div class="sidebar-note"><span class="tiny-label">ПРАВИЛО КАМБУЗА № 01</span><p>Хороший ужин начинается с простого рундука.</p><span class="note-line"></span>${icon('wave')}</div>
    <button class="sidebar-source" data-action="sources">${icon('info')} О хранении и источниках</button>
    <a class="deelstuff-link" href="https://deelstuff.com" target="_blank" rel="noopener noreferrer">deelstuff<span>жизнь под парусом ↗</span></a>
  </aside>
  <div class="workspace"><header class="topbar"><div class="breadcrumb">deelstuff <span>/</span> <strong>Дельный камбуз</strong></div><div class="topbar-right">${languageSelector()}<span class="offline-state" id="offline-status"><i></i> Подготовка к работе без сети…</span><div class="mode-switch" role="group" aria-label="Условия закупки"><button data-action="mode" data-mode="sea">${icon('wave')} В море</button><button data-action="mode" data-mode="shore">${icon('anchor')} У берега</button></div></div></header><main id="main" tabindex="-1"></main><footer class="page-footer"><span>Дельный камбуз / deelstuff</span><nav class="footer-links" aria-label="Информация о сайте"><a href="${legalUrl('impressum')}">Impressum</a><a href="${legalUrl('datenschutz')}">Datenschutz</a><button data-action="sources">Условия и источники ${icon('arrow')}</button></nav></footer></div>`);
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
    choices.pasta = id;
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
      const plan = buildSeason(state.seasonDays, state.pantry);
      state.manual.push(...plan.items.map((i) => ({ ...i, source: 'builder' })));
      state.builderMeta = { kind: 'season', days: plan.days };
    }
    save();
    location.hash = 'shopping';
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

function render() {
  const focus = document.activeElement;
  const searchFocused = focus?.id === 'search';
  const cursor = searchFocused ? focus.selectionStart : null;
  document.querySelector('#main').innerHTML = localizeMarkup(
    {
      map: () => renderMap({ state, catalog }),
      pantry: () => renderPantry({ state, catalog }),
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
  document.title = t(`${titles[state.view]} · Дельный камбуз · deelstuff`);
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
    `<div class="drawer-top"><span class="eyebrow small">КАМБУЗ / ${kind || 'ЗАМЕТКИ НА ПОЛЯХ'}</span><button class="icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button></div>${content}`,
  );
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = preserveScroll ? previousScroll : 0;
  document.body.classList.add('dialog-open');
}
function openProduct(id) {
  const p = productById[id];
  if (!p) return;
  currentProduct = id;
  currentRecipe = null;
  const related = recipes.filter(
    (r) => (state.mode === 'shore' || !r.shore) && recipeProductIds(r).includes(id),
  );
  const group = variantGroups.find((g) => g.includes(id));
  const source = sources.find((s) => s.id === p.source);
  const family = productFamilies.find((f) => f.id === p.familyId);
  openDialog(
    `<div class="product-detail-head"><span class="product-symbol large ${p.state}">${icon(productGlyph(p))}</span><span class="tag">${p.category}</span><h2>${p.name}</h2><p>${p.hint}</p></div>
    ${group ? `<div class="product-variants">${group.map((v) => `<button data-action="product" data-id="${v}" class="${v === id ? 'active' : ''}">${productById[v].name}</button>`).join('')}</div>` : ''}
    <div class="product-role"><span>Роль в блюде: <strong>${p.role}</strong></span>${family ? `<h3>${family.name}</h3><p>${family.note}</p><div>${family.members.map((id) => `<button data-action="product" data-id="${id}" class="${id === p.id ? 'active' : ''}">${productById[id].name}</button>`).join('')}</div>` : '<p>Прямой универсальной замены нет. В рецептах проверяйте разрешённые варианты по той же роли.</p>'}</div><div class="storage-pair"><div><span>ЗАКРЫТЫЙ / ЦЕЛЫЙ ПРОДУКТ</span><strong>${p.life}</strong></div><div><span>ПОСЛЕ ОТКРЫТИЯ / ПОДГОТОВКИ</span><strong>${p.afterLife}</strong></div></div>
    <section class="detail-section"><h3>${icon('box')} Как хранить на яхте</h3><p>${p.storage}</p></section><section class="detail-section"><h3>${icon('clock')} После открытия</h3><p>${p.after}</p></section>${p.note ? `<div class="detail-notice">${icon('info')}<p>${p.note}</p></div>` : ''}
    ${p.packages ? `<section class="detail-section"><h3>Упаковки для планирования</h3><p>${p.packages.map((pack) => formatAmount(pack.size, pack.unit) + (pack.edible !== pack.size ? ` (примерно ${pack.edible} г без жидкости)` : '')).join(' · ')}. В рецепте выбирайте фактическую упаковку: открытое содержимое используется целиком. Масса без жидкости здесь типовая; проверяйте конкретную банку.</p></section>` : ''}
    <div class="detail-stats"><div><span>СЫТОСТЬ*</span><strong>${p.satiety === 'Добавка' ? 'Добавка к блюду' : p.satiety}</strong><small>${p.portion}</small></div><div><span>УСЛОВИЯ ДЛЯ ОРИЕНТИРА</span><strong>Сухо и прохладно</strong><small>Желательно 15–21 °C, без конденсата</small></div></div>
    <p class="footnote">Числа — ориентир для планирования запаса, ограниченный условиями продукта и остаточным сроком. Открытие не запускает срок заново. Сытость не измерена в часах и зависит от порции и нагрузки.</p>
    <div class="detail-actions">${p.state !== 'shore' ? `<button class="button primary" data-action="toggle-pantry" data-id="${p.id}">${icon(state.pantry.includes(p.id) ? 'check' : 'plus')} ${state.pantry.includes(p.id) ? 'Есть в рундуке · убрать' : 'Есть в рундуке'}</button>` : ''}<button class="button secondary" data-action="manual" data-id="${p.id}">${icon('bag')} В закупку</button></div>
    ${related.length ? `<section class="detail-section"><h3>Что из этого приготовить</h3><div class="related-recipes">${related.map((r) => `<button data-action="recipe" data-id="${r.id}"><span>${r.title}</span><small>${r.time} мин ${icon('arrow')}</small></button>`).join('')}</div></section>` : ''}<a class="source-link" href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} ↗</a>`,
    'ПРОДУКТЫ',
  );
}

function openFavorite(id) {
  const favorite = state.favorites.find((f) => f.recipeId === id);
  if (!favorite) return;
  choices = { ...favorite.choices };
  packSizes = { ...favorite.packSizes };
  anchorId = favorite.anchorId;
  moduleIds = [...favorite.modules];
  openRecipe(id, true);
}
function toggleFavorite(id) {
  const recipe = recipeById[id];
  if (!recipe) return;
  const exists = state.favorites.some((f) => f.recipeId === id);
  if (exists) state.favorites = state.favorites.filter((f) => f.recipeId !== id);
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
    saved = state.favorites.find((f) => f.recipeId === recipe.id);
  state.favorites = state.favorites.filter((f) => f.recipeId !== recipe.id);
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

async function exportCurrentRecipe() {
  const recipe = recipeById[currentRecipe];
  if (!recipe) return;
  const card = localizeRecipeCard(
    buildRecipeCard(recipe, selectionSnapshot(recipe, choices, packSizes, anchorId, moduleIds)),
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
  currentRecipe = id;
  currentProduct = null;
  const prepared = prepareRecipe(r, choices, packSizes, anchorId, moduleIds);
  anchorId = prepared.anchorId;
  moduleIds = prepared.modules.map((m) => m.id);
  openDialog(
    renderRecipeDialog(r, prepared, { state, choices, packSizes, anchorId, moduleIds }),
    'РЕЦЕПТЫ',
    keepChoices,
  );
}

function showSources() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Не календарь годности.<br>Навигатор по запасам.</h2><div class="prose"><p>Для яхты нет универсальной таблицы сроков: температура рундука, конденсат, упаковка и исходное качество меняют результат. Мы не выдаём домашние справочники за испытания во влажном море.</p><h3>Как читать карточки</h3><p><strong>«3–6 месяцев»</strong> — редакционный план ротации сухого запаса в герметичной пищевой упаковке, в тени, желательно при 15–21 °C. Он ограничен сроком и условиями производителя. Это не обещание безопасности на весь период.</p><p><strong>«План: 2–3 дня»</strong> — когда съесть свежие покупки, а не установленный срок годности. Проверяйте овощи каждый день. В жару берите только на ближайшее приготовление.</p><p><strong>После открытия</strong> — отдельный ориентир в каждой строке: для сухой крупы это месяцы, для хлеба дни, для вскрытых консервов часы. Открытие не продлевает заводской срок. Условия конкретного продукта могут требовать более короткого хранения.</p><h3>Защита от яхтенной влаги</h3><p>Сухую крупу и муку фасуйте в плотный пищевой zip-lock и убирайте в жёсткий герметичный контейнер. Пакет должен быть сухим внутри. Zip-lock защищает от влаги только при исправном замке; он не защищает от проколов и грызунов. Свежим целым луку и картофелю нужна вентиляция.</p><h3>После приготовления</h3><p>Готовая еда и вскрытые скоропортящиеся продукты без холода — максимум 2 часа; выше 32 °C — 1 час. Это суммарное время, не новый отсчёт после каждого разогрева. Без холодильника удобнее готовить на один раз.</p><h3>Сытость</h3><p>Часы в карточках — условная редакционная оценка, не данные исследования. Для специй и соусов время не указано. Размер порции, белок, клетчатка, жиры, сон и нагрузка меняют ощущение голода. Ориентиры не определяют норму питания.</p><h3>Проверенные источники</h3><p class="muted">Проверено 25 октября 2026. Рецепты и короткие планы ротации — редакционная адаптация для одиночного камбуза.</p><div class="sources-list">${sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.title} ↗</strong><span>${s.text}</span></a>`).join('')}</div></div>`,
    'УСЛОВИЯ И ИСТОЧНИКИ',
  );
}
function showSubstitutions() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Меняйте продукты.<br>Сохраняйте идею.</h2><div class="prose"><p>Замена работает по роли: основа, белок, аромат, соус. Вкус и время при этом могут измениться.</p><div class="swap-card"><h3>Томатная паста ↔ другие томаты</h3><p><strong>40 г кетчупа</strong> — меньше соли, вкус слаще.<br><strong>Пассата</strong> — весь выбранный пакет; сухая основа пересчитывается под него, вода уменьшается по концентрации.<br><strong>200 г свежих томатов</strong> — примерно на 150 мл меньше воды, добавить время на размягчение.</p><p class="muted">Это стартовые пропорции, не точные эквиваленты: густота и кислотность различаются.</p></div><div class="swap-card"><h3>Свежие ароматы ↔ сухие</h3><p>Ориентир: 1 небольшая луковица ↔ 1 ст. л. сушёных луковых хлопьев или 1 ч. л. лукового порошка; 1 зубчик чеснока ↔ примерно ⅛ ч. л. порошка; 1 ч. л. тёртого имбиря ↔ ¼ ч. л. сухого.</p><p class="muted">Начинайте с меньшего количества. Смесь в рецептах — удобная ароматическая добавка, а не эквивалент объёма свежих овощей. Сухие специи не обжаривают так долго, как лук.</p></div><div class="swap-card"><h3>Белок ↔ белок</h3><p>Тунец ↔ сардины: целая небольшая банка. Мясные консервы ↔ соевый текстурат: гидратировать по инструкции. Фасоль ↔ нут: близкая масса без жидкости, но другой вкус.</p></div><div class="swap-card"><h3>Основа ↔ другая основа</h3><p>Рис, картофель и бобовые роднит принцип блюда, но не соотношение воды и время. Кускус запаривают, пасту помешивают, чечевицу разваривают. Сухую красную фасоль нельзя просто добавить вместо готовой.</p></div><p>В карточках выберите замену и размер её упаковки. Для пассаты используем весь пакет, а основу и начальный объём воды считаем от него. Закупка запомнит размер; банка 200 г и банка 500 г — разные позиции.</p></div>`,
    'ЗАМЕНЫ',
  );
}
function showMethod() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Один принцип.<br>Разные способы.</h2><div class="prose"><p>Граф показывает родство блюд, а точные количества и порядок находятся в рецептах.</p><h3>1. Ароматическая основа</h3><p>Масло + свежий лук или сухие ароматы. Свежий лук обжаривают несколько минут, сухие специи прогревают только 20–30 секунд, чтобы не сжечь.</p><h3>2. Основа и жидкость</h3><p>Рис впитывает воду под крышкой; паста варится в небольшом количестве воды с помешиванием; красная чечевица разваривается. Картофель нарезают мелкими кубиками. Консервированные бобовые уже готовы.</p><h3>3. Характер блюда</h3><p>Зира и морковь ведут к плову. Томаты и паприка — к рису с рыбой или чили. Карри и кокосовое молоко — к далу или карри. Рыбные и мясные консервы обычно добавляют ближе к концу, затем хорошо прогревают.</p><div class="detail-notice">${icon('info')}<p>Кускус — отдельная ветка: его добавляют после выключения огня. Свежий фарш обжаривают в начале и проверяют термометром. Общая схема не заменяет эти различия.</p></div></div>`,
    'ОБЩАЯ СХЕМА',
  );
}
function showSatiety() {
  currentRecipe = null;
  currentProduct = null;
  openDialog(
    `<h2 class="text-dialog-title">Сытость — ориентир,<br>а не таймер.</h2><div class="prose"><p>Нельзя надёжно обещать, что 100 г риса обеспечат конкретному человеку ровно три часа сытости. Часы в каталоге — условные редакционные диапазоны для бытового планирования.</p><h3>Что мы показываем</h3><p>У основы — порцию сухого продукта перед приготовлением. У бобовых — массу без жидкости. У консервированного белка — порцию в составе еды. У соусов и специй — «добавка» вместо часов.</p><h3>Как собрать более сытную еду</h3><p>Добавьте к рису, пасте или картофелю белок: чечевицу, нут, фасоль, рыбу, мясные консервы или текстурат. Небольшое количество масла повышает энергетическую ценность, овощи и бобовые добавляют клетчатку.</p><p>Подстраивайте порцию под свой аппетит, физическую работу, погоду и длину вахты. Мужской пол сам по себе не задаёт порцию. Приложение не рассчитывает дневные калории, белок или достаточность питания на переход.</p><a class="source-link" href="https://pubmed.ncbi.nlm.nih.gov/7498104/" target="_blank" rel="noopener noreferrer">Исследование Holt et al.: сравнение сытости, а не часы для нашего каталога ↗</a></div>`,
    'СЫТОСТЬ',
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
  const { action, id } = button.dataset;
  if (action === 'favorite-recipe') return openFavorite(id);
  if (action === 'favorite-toggle') return toggleFavorite(id);
  if (action === 'favorite-current') return saveCurrentFavorite();
  if (action === 'recipe-png') return exportCurrentRecipe();
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
});
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
document.addEventListener('change', (event) => {
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
});
window.addEventListener('hashchange', () => {
  const next = location.hash.slice(1);
  if (views.includes(next)) {
    state.view = next;
    state.query = '';
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('#main').focus({ preventScroll: true });
  }
});
document.querySelector('#detail').addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  currentRecipe = null;
  currentProduct = null;
  lastFocus?.isConnected && lastFocus.focus();
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
if (storageFailed) toast('Сохранение в браузере недоступно. Данные останутся в текущей вкладке.');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
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
