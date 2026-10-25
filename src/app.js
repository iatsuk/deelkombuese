import {selectionSnapshot,sameSelection,normalizeFavorites} from './preferences.js';
import {buildRecipeCard,downloadRecipePng} from './recipe-export.js';
import {cookingBasics,recipeUtensils} from './cooking-guide.js';
import {buildTrip,buildSeason,waterBudget,retailPurchases,tripCandidates,mealSlots} from './planner.js';
import { products, productById, recipes, recipeById, bases, sources, starterPantry, variantGroups, productFamilies, recipeKinds, recipeMigrations, mapProductGroups } from './data.js';
import { availableRecipe, missingIngredients, resolveIngredient, shoppingItems, formatAmount, prepareRecipe, formatShoppingAmount, recipeSteps, effectiveIngredients, recipeProductIds, recipeMatches, choicesForSelection, sortProducts, filterRecipes, migrateRecipeEntry, recipeTitle } from './model.js';

const paths = {
  star:'m12 2 3.1 6.3 7 .9-5 4.9 1.2 6.9-6.3-3.3L5.7 21l1.2-6.9-5-4.9 7-.9L12 2Z',
  bread:'M5 10c-5-1-5-7 0-8 3-2 11-2 14 0 5 1 5 7 0 8v12H5V10Zm3 3v5m4-5v5m4-5v5',
  egg:'M20 15c0 11-16 11-16 0C4 9 9 1 12 1s8 8 8 14Z',
  pot:'M5 10h14l-1.5 10h-11L5 10ZM3 10h18M9 6c-3-3 3-3 0-6m6 6c-3-3 3-3 0-6M3 13H1m22 0h-2',
  map:'m9 18 6-12M3 4l6 2 6-2 6 2v14l-6-2-6 2-6-2V4Zm6 2v14m6-16v14',
  box:'m3 7 9-4 9 4-9 4-9-4Zm0 0v11l9 4 9-4V7M12 11v11m-5-17 10 4',
  book:'M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z',
  bag:'M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  arrow:'M4 12h16m-6-6 6 6-6 6',
  arrowDown:'M12 4v16m-6-6 6 6 6-6',
  clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  check:'m5 12 4 4L19 6',
  plus:'M12 5v14M5 12h14',
  minus:'M5 12h14',
  close:'m6 6 12 12M6 18 18 6',
  search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  swap:'M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4',
  anchor:'M12 7v15M9 4a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM2 13v3c0 3 4 6 10 6s10-3 10-6v-3M1 16l1-3 3 1m18 2-1-3-3 1',
  wave:'M2 8c3-5 7 5 10 0s7 5 10 0M2 16c3-5 7 5 10 0s7 5 10 0',
  info:'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
  person:'M8 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
  fridge:'M5 2h14v20H5V2Zm0 8h14M9 5v1m0 7v3M2 2l20 20',
  drop:'M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14ZM8 15a4 4 0 0 0 4 4',
  download:'M12 2v13m-5-5 5 5 5-5M3 16v6h18v-6',
  trash:'M3 6h18M9 6V3h6v3M6 6l1 16h10l1-16M10 10v7m4-7v7',
  leaf:'M20 3C8 2 1 7 5 16c8 5 16-1 15-13ZM4 21 17 7',
  grain:'M12 22V3m0 6C5 10 3 6 4 3c5-1 8 2 8 6Zm0 6C5 16 3 12 4 9c5-1 8 2 8 6Zm0 3c7 1 9-3 8-6-5-1-8 2-8 6Zm0-6c7 1 9-3 8-6-5-1-8 2-8 6Z',
  pasta:'M5 3v7m4-7v7m4-7v7M3 10h12M9 10v12M19 3c-3 5-3 11 0 14v5m0-19v14h3V3',
  beans:'M7 4C0 5 1 16 7 18c4 1 7-5 4-8-2-2-3-1-4-6ZM17 8c-1 5-7 3-6 8 1 7 10 5 11-1 1-4-2-7-5-7Z',
  can:'M5 5v14c0 4 14 4 14 0V5M19 5C19 1 5 1 5 5s14 4 14 0ZM5 16c3 3 11 3 14 0m-7-5v3',
  fish:'M18 12c-5-9-13-5-16 0 3 5 11 9 16 0Zm0 0 5-5v10l-5-5ZM7 10v.1',
  potato:'M4 9c2-6 7-7 12-6 5 2 8 7 5 12-2 3-4 7-10 6C4 20 1 15 4 9Zm4 0v.1m7-2v.1M9 16v.1m9-3v.1',
  carrot:'m14 7 3 3-13 12L14 7Zm0 0c-3-5 2-7 3-2 1-6 6-4 3 0 6-1 5 4 0 3m-10 4 2 2m-5 1 2 2',
  onion:'M12 3C10 8 4 9 4 15a8 8 0 0 0 16 0c0-6-6-7-8-12Zm0 0c-5 10-5 18 0 20 5-2 5-10 0-20ZM9 1l3 2 3-2',
  root:'m6 4 4 1 2 5 5-2 3 3-3 4-4-1-2 6-4-1 1-7-4-3 2-5Z',
  tomato:'M12 7C2 1-1 21 9 21h6C25 21 22 1 12 7Zm0 0V2m-4 2 4 3 4-3',
  bottle:'M9 2h6v5l3 4v11H6V11l3-4V2Zm-3 12h12M9 5h6',
  spice:'M7 2h10v4H7V2Zm0 4-2 4v12h14V10l-2-4M8 14h8m-8 4h8',
  meat:'M4 6C0 9 3 21 9 21c3 0 3-5 6-6s7 2 8-4C25 1 11 0 4 6Zm5 3c-3 1-2 5 0 5s4-6 0-5Z',
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.pot}"/></svg>`;
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY = 'deelstuff-kombuese-v1';
const plural = (n,one,few,many) => n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many;
const views = ['map','pantry','recipes','planner','shopping'];
const titles = {map:'Карта вкусов', pantry:'Продукты', recipes:'Рецепты', shopping:'Список закупки',planner:'План похода'};
let storageFailed = false;
function readSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      favorites:normalizeFavorites(raw.favorites),
      pantry: Array.isArray(raw.pantry) ? [...new Set(raw.pantry.filter(id => productById[id] && productById[id].state !== 'shore'))] : [],
      plan: Array.isArray(raw.plan) ? raw.plan.map(migrateRecipeEntry).filter(p => recipeById[p.recipeId]).slice(0,100).map(p => ({key:crypto.randomUUID(), recipeId:p.recipeId, count:Math.min(30,Math.max(1,parseInt(p.count) || 1)), choices:p.choices && typeof p.choices === 'object' ? p.choices : {}, packSizes:p.packSizes&&typeof p.packSizes==='object'?p.packSizes:{}, anchorId:typeof p.anchorId==='string'?p.anchorId:null,modules:Array.isArray(p.modules)?p.modules.filter(id=>recipeById[p.recipeId].modules.some(m=>m.id===id)):[],source:p.source==='builder'?'builder':'user',day:Number(p.day)||null,slot:['breakfast','lunch','dinner','snack'].includes(p.slot)?p.slot:null})) : [],
      manual: Array.isArray(raw.manual) ? raw.manual.filter(p => productById[p.id]).slice(0,100).map(p => ({id:p.id,amount:Math.min(100000,Math.max(0.001,Number(p.amount)||1)),unit:['уп.','г','мл','шт.','ч. л.','кубик','зубчик'].includes(p.unit)?p.unit:'уп.',...(p.package&&Number(p.package.size)>0&&['г','мл','шт.','кубик'].includes(p.package.unit)?{package:{size:Number(p.package.size),unit:p.package.unit,edible:Number(p.package.edible)||Number(p.package.size),count:1}}:{}),source:p.source==='builder'?'builder':'user'})) : [],
      checked: Array.isArray(raw.checked) ? raw.checked.filter(x => typeof x === 'string') : [],
      mode: raw.mode === 'shore' ? 'shore' : 'sea',
      builderMeta:raw.builderMeta&&['trip','season'].includes(raw.builderMeta.kind)?{kind:raw.builderMeta.kind,days:Math.min(180,Math.max(1,Number(raw.builderMeta.days)||3)),drinkLitres:Number(raw.builderMeta.drinkLitres)||3,washLitres:Number(raw.builderMeta.washLitres??1.5),reservePct:Number(raw.builderMeta.reservePct??25),includeEggs:!!raw.builderMeta.includeEggs,overrides:raw.builderMeta.overrides&&typeof raw.builderMeta.overrides==='object'?Object.fromEntries(Object.entries(raw.builderMeta.overrides).filter(([key,value])=>/^\d-(breakfast|lunch|dinner|snack)$/.test(key)&&(recipeById[value]||recipeMigrations[value])).map(([key,value])=>[key,recipeMigrations[value]?.recipeId||value])):{}}:null,
    };
  } catch { storageFailed = true; return {favorites:[],pantry:[],plan:[],manual:[],checked:[],mode:'sea'}; }
}
const persisted=readSaved();
const state = {...persisted, view:views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'map', base:'all', query:'', category:'all', quick:false, pantryOnly:false, ownedOnly:false, favoritesOnly:false, meal:'all', kind:'all', variants:{},sortKey:'name',sortDirection:'asc',graphSelected:[],graphQuery:'',graphFocus:null,showUnavailable:false,plannerMode:persisted.builderMeta?.kind||'trip',tripDays:persisted.builderMeta?.kind==='trip'?persisted.builderMeta.days:3,includeEggs:!!persisted.builderMeta?.includeEggs,drinkLitres:persisted.builderMeta?.drinkLitres??3,washLitres:persisted.builderMeta?.washLitres??1.5,reservePct:persisted.builderMeta?.reservePct??25,seasonDays:persisted.builderMeta?.kind==='season'?persisted.builderMeta.days:90,tripOverrides:persisted.builderMeta?.overrides||{}};
let currentRecipe = null;
let currentProduct = null;
let choices = {};
let packSizes = {};
let anchorId = null;
let moduleIds = [];
let lastFocus = null;
let toastTimer;

function save() {
  try { localStorage.setItem(KEY,JSON.stringify({favorites:state.favorites,pantry:state.pantry,plan:state.plan,manual:state.manual,checked:state.checked,mode:state.mode,builderMeta:state.builderMeta})); }
  catch { storageFailed = true; toast('Браузер не дал сохранить данные. В этой вкладке они остаются доступны.'); }
}
function toast(text) {
  const el = document.querySelector('#toast'); el.textContent = text; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'),3500);
}

const galleyArt = `<svg viewBox="0 0 360 220" fill="none" aria-hidden="true" class="galley-art">
  <circle cx="188" cy="120" r="91" stroke="currentColor" stroke-opacity=".12" stroke-dasharray="3 7"/>
  <path d="M67 167h242M88 176h201M130 196c14-7 22 7 37 0s22 7 37 0 22 7 37 0" stroke="currentColor" stroke-opacity=".3"/>
  <path d="M115 106h150l-14 64H129l-14-64Z" fill="#e7ebdc" stroke="currentColor" stroke-width="2"/>
  <path d="M109 106h162M116 120H97c-11 0-11 16 0 16h23m144-16h16c11 0 11 16 0 16h-19M145 117l8 39m12-39 5 39" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M162 86c-18-19 18-24 1-43m29 43c-18-19 18-24 1-43m29 43c-18-19 18-24 1-43" stroke="#a3633b" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="188" cy="106" rx="75" ry="11" fill="#203e3b"/>
  <path d="m130 104 17-6 18 8m25-5 9-10 11 11" stroke="#ead8b5" stroke-width="3"/>
  <circle cx="224" cy="102" r="10" fill="#ba6846"/><path d="m220 92 4 4 4-5" stroke="#60724f" stroke-width="2"/>
  <path d="m291 59 11-21 1 23m-14 5h23" stroke="currentColor" stroke-width="1.5"/><path d="m307 64-12-18v18" fill="#ba6846"/>
  <path d="m59 98 4-8 4 8-4 8-4-8Zm226 86 3-6 3 6-3 6-3-6Z" fill="#a3633b"/>
  <text x="50" y="56" fill="currentColor" opacity=".5" font-size="10" letter-spacing="2" transform="rotate(-12 50 56)">GALLEY NOTES</text>
</svg>`;

function shell() {
  document.querySelector('#app').innerHTML = `<aside class="sidebar">
    <a class="brand" href="#map" aria-label="Дельный камбуз — главная"><span class="brand-mark">${icon('pot')}</span><span class="brand-name">дельный<br>камбуз<span class="brand-by">a deelstuff project</span></span></a>
    <div class="sidebar-label">ЕДА ПОД ПАРУСОМ</div>
    <nav aria-label="Основная навигация">${[['map','map','Карта вкусов'],['pantry','box','Продукты'],['recipes','book','Рецепты'],['planner','anchor','План похода'],['shopping','bag','Закупка']].map(([v,ic,t]) => `<a href="#${v}" data-nav="${v}" aria-label="${t}">${icon(ic)}<span>${t}</span>${v==='shopping'?'<span id="cart-count" class="nav-count">0</span>':''}</a>`).join('')}</nav>
    <div class="sidebar-note"><span class="tiny-label">ПРАВИЛО КАМБУЗА № 01</span><p>Хороший ужин начинается с простого рундука.</p><span class="note-line"></span>${icon('wave')}</div>
    <button class="sidebar-source" data-action="sources">${icon('info')} О хранении и источниках</button>
    <a class="deelstuff-link" href="https://deelstuff.com" target="_blank" rel="noopener noreferrer">deelstuff<span>жизнь под парусом ↗</span></a>
  </aside>
  <div class="workspace"><header class="topbar"><div class="breadcrumb">deelstuff <span>/</span> <strong>Дельный камбуз</strong></div><div class="topbar-right"><span class="offline-state" id="offline-status"><i></i> Подготовка к работе без сети…</span><div class="mode-switch" role="group" aria-label="Условия закупки"><button data-action="mode" data-mode="sea">${icon('wave')} В море</button><button data-action="mode" data-mode="shore">${icon('anchor')} У берега</button></div></div></header><main id="main" tabindex="-1"></main><footer class="page-footer"><span>Дельный камбуз / deelstuff</span><span>Меньше посуды. Больше горизонта.</span><button data-action="sources">Условия и источники ${icon('arrow')}</button></footer></div>`;
  render();
}
function activeRecipeSelection(){return state.view==='map'?state.graphSelected:state.view==='recipes'&&productById[state.base]?[state.base]:[];}
function recipeContext(recipe){
  if(state.view==='recipes'&&state.favoritesOnly)return state.favorites.find(f=>f.recipeId===recipe.id)||{};
  return choicesForSelection(recipe,activeRecipeSelection());
}
function visibleRecipes() {
  const q=state.query.trim().toLocaleLowerCase('ru'),onMap=state.view==='map';
  const favoriteView=state.view==='recipes'&&state.favoritesOnly;
  return filterRecipes(recipes,{mode:state.mode,meal:onMap?'all':state.meal,base:onMap||favoriteView?'all':state.base,kind:onMap?'all':state.kind}).filter(r=>{
    const selected=recipeContext(r),prepared=prepareRecipe(r,selected.choices,selected.packSizes,selected.anchorId,selected.modules);
    const baseMatches=!favoriteView||state.base==='all'||r.base===state.base||prepared.ingredients.some(i=>i.id===state.base||state.base==='legumes'&&['beans','chickpeas','lentils'].includes(i.id));
    return (!favoriteView||state.favorites.some(f=>f.recipeId===r.id))&&(!favoriteView||state.mode==='shore'||!prepared.shore)&&baseMatches&&(!onMap||recipeMatches(r,state.graphSelected))&&(!state.quick||prepared.time<=20)&&(!state.pantryOnly||(favoriteView?prepared.ingredients.every(i=>state.pantry.includes(i.id)):availableRecipe(r,state.pantry,selected.modules)))&&(!q||`${r.title} ${prepared.title} ${r.desc} ${recipeProductIds(r).map(id=>productById[id].name).join(' ')}`.toLocaleLowerCase('ru').includes(q));
  });
}
function recipeCard(r,compact=false) {
  const selected=recipeContext(r),prepared=prepareRecipe(r,selected.choices,selected.packSizes,selected.anchorId,selected.modules);
  const favorite=state.favorites.some(f=>f.recipeId===r.id),favoriteView=state.view==='recipes'&&state.favoritesOnly;
  const possible=availableRecipe(r,state.pantry,selected.modules);
  return `<article class="recipe-card-shell"><button class="recipe-card ${r.tone} ${compact?'compact':''}" data-action="${favoriteView?'favorite-recipe':'recipe'}" data-id="${r.id}">
    <span class="recipe-card-top"><span class="dish-icon">${icon(r.base==='pasta'?'pasta':r.base==='potato'?'potato':r.base==='legumes'?'beans':'pot')}</span><span class="recipe-kind">${r.generator?'КОНСТРУКТОР':r.shore?'С БЕРЕГА':r.vessel==='cold'?'БЕЗ ПЛИТЫ':r.meal==='breakfast'?(r.mealTags?.includes('main')?'ЗАВТРАК / ОБЕД':'ЗАВТРАК'):r.vessel==='pan'?'НА СКОВОРОДЕ':'ONE-POT'}</span><span class="card-arrow">↗</span></span>
    <strong>${favoriteView?prepared.title:r.title}</strong><span class="recipe-desc">${favoriteView&&prepared.modules.length?prepared.modules.map(m=>m.label).join(' · '):r.desc}</span>
    ${r.template?'<span class="recipe-template-label">Универсальная основа · выбрать вариант ↗</span>':''}<span class="recipe-meta"><span>${icon('clock')} ${prepared.time} мин</span><span>${icon(r.vessel==='cold'?'person':'pot')} ${prepared.active} мин ${r.vessel==='cold'?'подготовки':'у плиты'}</span></span>
    ${possible?'<span class="can-cook">Всё есть в рундуке</span>':''}
  </button><button class="favorite-toggle ${favorite?'active':''}" data-action="favorite-toggle" data-id="${r.id}" aria-label="${favorite?'Убрать из избранного':'Добавить в избранное'}: ${esc(r.title)}" aria-pressed="${favorite}" title="${favorite?'Убрать из избранного':'Добавить в избранное'}">${icon('star')}</button></article>`;
}
function searchBox(placeholder) {
  return `<label class="search-box">${icon('search')}<input id="search" type="search" value="${esc(state.query)}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off"/></label>`;
}
function recipeFilters() {
  return `<div class="recipe-filters">${state.view==='recipes'?`<button class="filter-pill ${state.favoritesOnly?'active':''}" data-action="favorites-only" aria-pressed="${state.favoritesOnly}">${icon('star')} Избранное ${state.favorites.length}</button>`:''}<button class="filter-pill ${state.quick?'active':''}" data-action="quick" aria-pressed="${state.quick}">${icon('clock')} До 20 минут ${state.quick?icon('check'):''}</button><button class="filter-pill ${state.pantryOnly?'active':''}" data-action="pantry-only" aria-pressed="${state.pantryOnly}">${icon('box')} Из моего рундука ${state.pantryOnly?icon('check'):''}</button><button class="text-button reset-base ${state.base==='all'?'hidden':''}" data-action="base" data-id="all">Все основы ×</button></div>`;
}
function empty(title,text) { return `<div class="empty-state">${icon('pot')}<h3>${title}</h3><p>${text}</p><button class="button secondary" data-action="reset-filters">Сбросить фильтры</button></div>`; }

function renderMap(){
  const list=visibleRecipes();
  const candidates=recipes.filter(r=>state.mode==='shore'||!r.shore);
  const allProducts=products.filter(p=>state.mode==='shore'||p.state!=='shore');
  const counts=new Map(allProducts.map(p=>{const family=productFamilies.find(f=>f.members.includes(p.id));const selected=[...new Set([...state.graphSelected.filter(id=>!family?.members.includes(id)),p.id])];const count=candidates.filter(r=>{if(!recipeMatches(r,selected))return false;const inferred=choicesForSelection(r,selected);return (!state.quick||prepareRecipe(r,inferred.choices,{},null,inferred.modules).time<=20)&&(!state.pantryOnly||availableRecipe(r,state.pantry,inferred.modules));}).length;return [p.id,count];}));
  const allowed=allProducts.filter(p=>!state.graphSelected.length||state.showUnavailable||counts.get(p.id)>0||state.graphSelected.includes(p.id));
  const q=state.graphQuery.trim().toLocaleLowerCase('ru');
  const groups=mapProductGroups.map(g=>[g.name,p=>p.graphGroup===g.id,g.note,g.id]);
  const used=new Set();
  return `<section class="page-intro network-intro"><div class="eyebrow">01 / КАРТА ИНГРЕДИЕНТОВ</div><h1>Что приготовим <em>из этого?</em></h1><p>Выбирайте продукты — остаются блюда, в которых они встречаются вместе.<br>Учитываются замены и необязательные добавки. Каждый новый продукт сужает выбор.</p></section>
    <div class="network-controls"><label class="search-box">${icon('search')}<input id="graph-search" type="search" value="${esc(state.graphQuery)}" placeholder="Найти ингредиент" aria-label="Найти ингредиент"/></label>${recipeFilters()}${state.graphSelected.length?`<button class="filter-pill" data-action="graph-unavailable" aria-pressed="${state.showUnavailable}">${state.showUnavailable?'Скрыть несовместимые':'Все продукты'}</button>`:''}<button class="network-count" data-action="graph-results"><strong>${list.length}</strong> ${plural(list.length,'рецепт','рецепта','рецептов')} ↓</button></div>
    <div class="selected-products" aria-live="polite">${state.graphSelected.length?state.graphSelected.map(id=>`<button data-action="graph-product" data-id="${id}">${productById[id].name} ×</button>`).join('')+'<button class="clear-graph" data-action="graph-clear">Сбросить выбор</button>':'<span>Можно начать с яиц, томатов, риса или любого другого продукта.</span>'}</div>
    <section class="ingredient-network" aria-label="Граф продуктов и рецептов"><svg class="network-lines" aria-hidden="true"></svg><div class="network-products">${groups.map(([name,predicate,note,groupId],groupIndex)=>{
      const entries=allowed.filter(p=>!used.has(p.id)&&predicate(p));entries.forEach(p=>used.add(p.id));
      const filtered=entries.filter(p=>!q||p.name.toLocaleLowerCase('ru').includes(q));if(!filtered.length)return '';
      return `<details data-map-group="${groupId}" class="network-group ${filtered.length>10?'dense':''}" ${q||groupIndex<3||entries.some(p=>state.graphSelected.includes(p.id))?'open':''}><summary>${name}<span>${filtered.length}</span></summary><div>${filtered.map(p=>{
        const count=counts.get(p.id)||0;
        const family=productFamilies.find(f=>f.id===p.familyId);
        return `<button class="graph-node ${state.graphSelected.includes(p.id)?'selected':''}" data-action="graph-product" data-id="${p.id}" data-product-node="${p.id}" aria-pressed="${state.graphSelected.includes(p.id)}" ${!count&&!state.graphSelected.includes(p.id)?'disabled':''} title="${esc(family?.note||p.hint)}"><span>${icon(p.icon)} ${p.name}</span><small>${count}</small></button>`;
      }).join('')}</div>${note?`<p>${note}</p>`:''}</details>`;
    }).join('')}</div>
    <div class="graph-legend"><span><i></i> обязательный ингредиент / замена</span><span><i class="optional"></i> необязательная добавка</span><span>Кнопка «Связи» показывает состав выбранного блюда.</span></div>
    <div id="graph-results" class="network-results"><div class="section-heading"><div><div class="eyebrow small">ПРОДУКТЫ → СОСТАВ → БЛЮДА</div><h2>${list.length} ${plural(list.length,'подходящий рецепт','подходящих рецепта','подходящих рецептов')}</h2></div><a class="inline-link" href="#planner">Собрать закупку ${icon('arrow')}</a></div><div class="recipe-grid network-recipes ${list.length===1?'single':''}">${list.map(r=>`<div class="graph-recipe ${state.graphFocus===r.id?'focused':''}" data-graph-recipe="${r.id}">${recipeCard(r,true)}<button class="graph-focus" data-action="graph-focus" data-id="${r.id}" aria-pressed="${state.graphFocus===r.id}">${icon('map')} Связи ${r.template?'· гибкое блюдо':''}</button></div>`).join('')||empty('Нет общего блюда','Уберите один из ингредиентов или сбросьте фильтр.')}</div></div></section>`;
}

function renderPantry() {
  const q=state.query.trim().toLocaleLowerCase('ru');
  const groups=new Map(variantGroups.flatMap(group=>group.map(id=>[id,group])));
  let visible=products.filter(p=>(state.mode==='shore'||p.state!=='shore')&&(state.category==='all'||p.category===state.category));
  if(state.category==='all'&&!state.ownedOnly){
    visible=visible.filter(p=>!groups.has(p.id)||groups.get(p.id)[0]===p.id).map(p=>{
      const group=groups.get(p.id);if(!group)return p;
      const match=q&&group.map(id=>productById[id]).find(v=>v.name.toLocaleLowerCase('ru').includes(q));
      const remembered=productById[state.variants[group[0]]];
      const selected=(remembered&&(!q||remembered.name.toLocaleLowerCase('ru').includes(q))?remembered:null)||match||p;
      return state.mode==='sea'&&selected.state==='shore'?p:selected;
    });
  }
  visible=visible.filter(p=>(!state.ownedOnly||state.pantry.includes(p.id))&&(!q||`${p.name} ${p.hint} ${p.storage}`.toLocaleLowerCase('ru').includes(q)));
  const categories=[...new Set(products.filter(p=>state.mode==='shore'||p.state!=='shore').map(p=>p.category))];
  visible=sortProducts(visible,state.sortKey,state.sortDirection,state.pantry);
  const sortHead=(key,label)=>`<span role="columnheader" class="sort-${key}" aria-sort="${state.sortKey===key?(state.sortDirection==='asc'?'ascending':'descending'):'none'}"><button data-action="sort" data-id="${key}">${label} <b>${state.sortKey===key?(state.sortDirection==='asc'?'↑':'↓'):'↕'}</b></button></span>`;
  const variantSelect=p=>{
    const group=groups.get(p.id);if(!group)return '';
    const options=group.map(id=>productById[id]).filter(v=>state.mode==='shore'||v.state!=='shore');
    if(options.length<2)return '';
    return `<label class="variant-label">Вариант<select data-variant="${group[0]}" aria-label="Вариант продукта: ${productById[group[0]].name}">${options.map(v=>`<option value="${v.id}" ${v.id===p.id?'selected':''}>${v.name}</option>`).join('')}</select></label>`;
  };
  return `<section class="page-intro"><div class="eyebrow">02 / ПРОВИЗИЯ БЕЗ ХОЛОДИЛЬНИКА</div><h1>Порядок в <em>рундуке.</em></h1><p>Планируйте запас до покупки: закрытая упаковка и вскрытая — разные сроки.<br>Свежие и сушёные овощи можно выбирать прямо в строке продукта.</p></section>
    <div class="inventory-banner"><span class="inventory-icon">${icon('box')}</span><div><strong>Мой рундук <span>${state.pantry.length}</span></strong><p>${state.pantry.length?'Наличие сохранено. Свежий и сушёный варианты учитываются отдельно; количество проверяйте перед готовкой.':'Отметьте реальные запасы или добавьте базовый набор.'}</p></div><button class="button secondary" data-action="starter">${icon('plus')} Базовый набор</button></div>
    <div class="storage-banner">${icon('info')}<p><strong>Ориентиры после открытия — для сухой упаковки, тени и прохлады 15–21 °C.</strong> На жаркой сырой яхте сроки сокращаются. Консервы и пассата после вскрытия расходуются в текущую готовку. <button data-action="sources">Условия и источники ↗</button></p></div>
    <div class="catalog-toolbar">${searchBox('Найти продукт или способ хранения')}<button class="filter-pill ${state.ownedOnly?'active':''}" data-action="owned-only" aria-pressed="${state.ownedOnly}">${icon('check')} Только мои ${state.pantry.length}</button></div>
    <div class="category-tabs" role="group" aria-label="Категории продуктов"><button class="${state.category==='all'?'active':''}" data-action="category" data-id="all">Все продукты</button>${categories.map(c=>`<button class="${state.category===c?'active':''}" data-action="category" data-id="${esc(c)}">${c}</button>`).join('')}</div>
    <div class="product-table" role="table" aria-label="Продукты и сроки хранения"><div class="product-table-head" role="row">${sortHead('name','ПРОДУКТ')}${sortHead('closed','ДО ОТКРЫТИЯ')}${sortHead('after','ПОСЛЕ ОТКРЫТИЯ')}${sortHead('satiety','СЫТОСТЬ*')}${sortHead('owned','ЕСТЬ')}</div>${visible.map(p=>`<div class="product-row" role="row"><div class="product-cell" role="cell"><button class="product-name" data-action="product" data-id="${p.id}"><span class="product-symbol ${p.state}">${icon(p.icon)}</span><span><strong>${p.name}</strong><small>${p.hint}</small><small class="mobile-satiety">${p.satiety==='Добавка'?'Добавка к блюду':'Сытость ≈ '+p.satiety+'*'}</small></span></button>${variantSelect(p)}</div><div class="life-cell" role="cell"><button class="product-storage" data-action="product" data-id="${p.id}"><small>Закрытый / целый</small><strong>${p.life}</strong></button></div><div class="after-cell" role="cell"><button class="product-storage" data-action="product" data-id="${p.id}"><small>После открытия / подготовки</small><em>${p.afterLife}</em></button></div><div class="satiety-cell" role="cell"><button class="product-satiety" data-action="product" data-id="${p.id}"><span>${p.satiety==='Добавка'?'—':p.satiety+'*'}</span><small>${p.portion}</small></button></div><div class="pantry-toggle-cell" role="cell">${p.state==='shore'?`<button class="icon-button add-shopping" data-action="manual" data-id="${p.id}" aria-label="Добавить ${esc(p.name)} в закупку">${icon('bag')}</button>`:`<button class="pantry-checkbox ${state.pantry.includes(p.id)?'checked':''}" data-action="toggle-pantry" data-id="${p.id}" role="checkbox" aria-checked="${state.pantry.includes(p.id)}" aria-label="${esc(p.name)} в рундуке">${icon('check')}</button>`}</div></div>`).join('')||empty('Продуктов не найдено','Попробуйте другое название или категорию.')}</div>
    <p class="footnote">Сроки после открытия — редакционный план ротации в указанных условиях, а не новое продление срока годности. Для яиц важен возраст от кладки, для хлеба — влажность и отсутствие плесени. * Сытость — условная подсказка для указанной порции.</p>`;
}


function renderRecipes() {
  const list=visibleRecipes();
  return `<section class="page-intro"><div class="eyebrow">03 / ОДНА ОСНОВА, НЕСКОЛЬКО ВАРИАНТОВ</div><h1>Меню простого <em>камбуза.</em></h1><p>Выбирайте приём пищи, вид блюда и основу независимо.<br>В универсальной карточке меняйте соус, наполнитель и подачу.</p></section><div class="recipe-generator-banner"><div><span class="eyebrow small">ОСНОВА → СОУС → НАПОЛНЕНИЕ</span><h2>Один вкус. Три разные основы.</h2><p>Паста, ризотто или картофель — с отдельной техникой и расчётом воды.</p></div><button class="button primary" data-action="recipe" data-id="dish-generator">Собрать блюдо ${icon("arrow")}</button></div>
    <div class="filter-caption">ПРИЁМ ПИЩИ</div><div class="meal-tabs" role="group" aria-label="Приём пищи">${[['all','Всё меню'],['main','Обед и ужин'],['breakfast','Завтраки'],['snack','Перекусы и закуски']].map(([id,label])=>`<button data-action="meal" data-id="${id}" aria-pressed="${state.meal===id}" class="${state.meal===id?'active':''}">${label}</button>`).join('')}</div>
    <div class="catalog-toolbar recipe-library-toolbar">${searchBox('Найти блюдо или ингредиент')}<label class="recipe-kind-select" for="recipe-kind"><span>Вид блюда</span><select id="recipe-kind" aria-label="Вид блюда"><option value="all">Все виды блюд</option>${recipeKinds.map(k=>`<option value="${k.id}" ${state.kind===k.id?'selected':''}>${k.name}</option>`).join('')}</select></label>${recipeFilters()}</div>
    <div class="filter-caption">ОСНОВА ИЗ ПРОДУКТОВ</div><div class="category-tabs" role="group" aria-label="Основы рецептов"><button data-action="base" data-id="all" aria-pressed="${state.base==='all'}" class="${state.base==='all'?'active':''}">Все основы</button>${bases.map(b=>`<button data-action="base" data-id="${b.id}" aria-pressed="${state.base===b.id}" class="${state.base===b.id?'active':''}">${b.name}</button>`).join('')}</div>
    <div class="result-heading"><span>${list.length} ${plural(list.length,'рецепт','рецепта','рецептов')} ${state.mode==='sea'?'для автономного запаса':'включая покупки с берега'}</span><span>${icon('swap')} Варианты внутри карточек</span></div><div class="active-recipe-filters" aria-live="polite">${state.meal!=='all'?`<span>Приём: ${state.meal==='breakfast'?'завтрак':state.meal==='main'?'обед / ужин':'перекус'}</span>`:''}${state.kind!=='all'?`<span>Вид: ${recipeKinds.find(k=>k.id===state.kind).name}</span>`:''}${state.base!=='all'?`<span>Основа: ${bases.find(b=>b.id===state.base).name}</span>`:''}${state.meal!=='all'||state.kind!=='all'||state.base!=='all'?'<button data-action="reset-filters">Сбросить фильтры ×</button>':''}</div>
    <div class="recipe-grid all-recipes">${list.map(r=>recipeCard(r)).join('')||empty(state.favoritesOnly&&!state.favorites.length?'Избранное пока пусто':'Рецептов с этим сочетанием нет',state.favoritesOnly&&!state.favorites.length?'Нажмите звёздочку у рецепта или сохраните выбранный вариант в его карточке.':'Снимите один из фильтров или выберите другую основу.')}</div><div class="storage-banner recipe-bottom">${icon('pot')}<p><strong>Планируйте одну готовку без открытых остатков.</strong> Скоропортящиеся упаковки расходуются целиком; размер определяет выход. Большую готовку съесть сейчас или разделить с попутчиком. Для блинов, оладий и котлет нужна также миска; работа у плиты указана в карточке.</p></div>`;
}
function resolvedPlan() {
  return state.plan.map(entry=>({count:entry.count,ingredients:prepareRecipe(recipeById[entry.recipeId],entry.choices,entry.packSizes,entry.anchorId,entry.modules).ingredients}));
}
function cartItems() { const items=shoppingItems(resolvedPlan(),state.pantry,state.manual);return state.builderMeta?.kind==='trip'?retailPurchases(items):items; }
function renderShopping() {
  const items=cartItems();
  const checked=items.filter(i=>state.checked.includes(i.key)).length;
  const groups=[...new Set(items.map(i=>productById[i.id].category))];
  return `<section class="page-intro"><div class="eyebrow">04 / СЛЕДУЮЩИЙ ЗАХОД В ПОРТ</div><h1>На берег за <em>продуктами.</em></h1><p>Добавьте блюда или соберите <a class="inline-planner-link" href="#planner">план на 1–7 дней</a>.<br>Продукты из рундука исключены; проверьте их количество.</p></section>
    <div class="shopping-layout"><section>${state.builderMeta?.kind==='trip'?renderWater(waterBudget(state.plan,state.builderMeta),true):state.builderMeta?.kind==='season'?`<div class="storage-banner season-cart-note">${icon('box')}<p><strong>Первичная закупка сезонной базы.</strong> Не весь запас хранится весь сезон. ${buildSeason(state.builderMeta.days,state.pantry).items.filter(i=>i.refillDays).map(i=>`${productById[i.id].name}: пополнять через ${i.refillDays} дней`).join('; ')}.</p></div>`:''}<div class="shopping-summary"><div><h2>Список закупки <span>${items.length}</span></h2><p>${checked} из ${items.length} отмечено · количества для выбранных блюд</p></div><button class="button secondary" data-action="export" ${!items.length?'disabled':''}>${icon('download')} Скачать .txt</button></div><div class="shopping-progress"><span style="width:${items.length?checked/items.length*100:0}%"></span></div>
    ${items.length?groups.map(g=>`<section class="shopping-group"><h3>${g}</h3>${items.filter(i=>productById[i.id].category===g).map(i=>`<label class="shopping-line ${state.checked.includes(i.key)?'done':''}"><input type="checkbox" data-shopping-key="${i.key}" ${state.checked.includes(i.key)?'checked':''}/><span class="custom-check">${icon('check')}</span><span>${productById[i.id].name}</span><strong>${formatShoppingAmount(i)}</strong></label>`).join('')}</section>`).join(''):`<div class="empty-shopping">${icon('bag')}<h3>${state.plan.length?'Всё уже есть в рундуке':'Сначала выберите, что приготовить'}</h3><p>${state.plan.length?'Проверьте остатки: наличие продукта не означает, что его хватит на все блюда.':'Откройте рецепт и нажмите «В закупку». Список появится здесь.'}</p><a class="button primary" href="#recipes">Открыть рецепты ${icon('arrow')}</a></div>`}
    <div class="manual-add"><label for="manual-product">Добавить продукт вручную</label><div><select id="manual-product"><option value="">Выберите продукт…</option>${products.filter(p=>state.mode==='shore'||p.state!=='shore').map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select><button class="button secondary" data-action="manual-select">${icon('plus')} Добавить</button></div></div><p class="footnote">Размер каждой целой упаковки указан в списке. Банки разного объёма учитываются отдельными строками. Список — потребность блюд, а не рассчитанный рацион на весь переход. Расчёт воды для походного плана показан отдельно; топливо планируйте самостоятельно; соль и перец для горячих блюд держите в общем запасе.</p></section>
    <aside class="meal-plan"><span class="eyebrow small">ЧТО ГОТОВИМ</span><h2>План камбуза</h2>${state.plan.length?state.plan.map(entry=>`<div class="planned-meal"><button data-action="planned-recipe" data-id="${entry.key}">${recipeTitle(recipeById[entry.recipeId],entry.choices,entry.modules)}${entry.modules?.length?`<small class="plan-package-note">${entry.modules.map(id=>recipeById[entry.recipeId].modules.find(m=>m.id===id)?.label).filter(Boolean).join(" · ")}</small>`:""}</button><div class="plan-controls"><span>${entry.count} ${plural(entry.count,'готовка','готовки','готовок')}</span><button class="icon-button" data-action="plan-minus" data-id="${entry.key}" aria-label="Уменьшить количество">${icon('minus')}</button><button class="icon-button" data-action="plan-plus" data-id="${entry.key}" aria-label="Увеличить количество">${icon('plus')}</button><button class="icon-button" data-action="plan-remove" data-id="${entry.key}" aria-label="Убрать блюдо">${icon('trash')}</button></div></div>`).join(''):'<p class="muted">Здесь будут блюда, которые вы добавили в закупку.</p>'}<a href="#recipes" class="plan-add">${icon('plus')} Добавить блюдо</a><div class="plan-note">${icon('info')}<p>Одна готовка = выбранные упаковки, израсходованные целиком. Счётчик повторяет закупку для отдельных приготовлений. Выход каждого блюда указан в карточке.</p></div>${state.manual.length?`<p class="muted manual-count">Вручную добавлено: ${state.manual.length}</p>`:''}${state.plan.length||state.manual.length?'<button class="text-button clear-plan" data-action="clear-plan">Очистить план и список</button>':''}</aside></div>`;
}


function drawGraph(){
  const root=document.querySelector('.ingredient-network');if(!root)return;
  const svg=root.querySelector('.network-lines');const rect=root.getBoundingClientRect();
  svg.setAttribute('viewBox',`0 0 ${root.clientWidth} ${root.clientHeight}`);svg.setAttribute('width',String(root.clientWidth));svg.setAttribute('height',String(root.scrollHeight));
  const cards=[...root.querySelectorAll('[data-graph-recipe]')];
  let focus=cards.find(c=>c.dataset.graphRecipe===state.graphFocus)||null;
  const edges=[];const connected=new Set();
  const targets=state.graphSelected.length?cards:focus?[focus]:[];
  for(const target of targets){
    const recipe=recipeById[target.dataset.graphRecipe];const tr=target.getBoundingClientRect();
    const required=new Set(recipe.ingredients.flatMap(i=>[i.id,...i.alternatives.map(a=>a.id)]));
    const ids=state.graphSelected.length?state.graphSelected:[...recipe.ingredients.map(i=>i.id),...(recipe.modules||[]).flatMap(m=>m.ingredients.map(i=>i.id))];
    for(const id of ids){
      if(!recipeProductIds(recipe).includes(id))continue;
      const node=root.querySelector(`[data-product-node="${id}"]`);if(!node||!node.getClientRects().length)continue;
      const nr=node.getBoundingClientRect();const x1=nr.left+nr.width/2-rect.left,y1=nr.bottom-rect.top,x2=tr.left+tr.width/2-rect.left,y2=tr.top-rect.top;
      const optional=!required.has(id);connected.add(id);
      edges.push(`<path class="${optional?'optional':''}" d="M${x1},${y1} C${x1},${y1+40} ${x2},${y2-45} ${x2},${y2}"/>`);
    }
  }
  svg.innerHTML=edges.join('');
  root.querySelectorAll('[data-product-node]').forEach(n=>n.classList.toggle('connected',connected.has(n.dataset.productNode)));
  cards.forEach(c=>{const active=c===focus;c.classList.toggle('focused',active);c.querySelector('.graph-focus').setAttribute('aria-pressed',String(active));});
}
function renderGeneratorChoices(recipe,prepared){
  const presets=recipe.generator?.presets||recipe.presets||[];
  const profiles=presets.length?`<details class="generator-presets" ${recipe.generator?'':'open'}><summary>${recipe.generator?'Готовые сочетания · '+presets.length:'Быстрый выбор'}</summary><div>${presets.map(p=>`<button data-action="recipe-preset" data-id="${p.id}" ${p.shore&&state.mode!=='shore'?'disabled':''}>${p.label}</button>`).join('')}</div>${recipe.generator?'<p>Сочетание меняет соус и добавки, сохраняя выбранную основу. Названия — ориентиры вкуса для походной адаптации.</p>':''}</details>`:'';
  if(!recipe.generator)return profiles;
  return `<div class="generator-bases"><div class="module-group-label">1. Основа</div><div role="group" aria-label="Основа блюда">${recipe.generator.bases.map(base=>`<button data-action="generator-base" data-id="${base.id}" aria-pressed="${prepared.generator.profile.id===base.id}" class="${prepared.generator.profile.id===base.id?'active':''}">${base.label}</button>`).join('')}</div><p>${prepared.generator.profile.method}</p></div>${profiles}`;
}
function renderRecipeModules(recipe,prepared){
  if(!recipe.modules?.length&&!recipe.template)return '';
  const core=recipe.generator?[prepared.generator.profile.id]:recipe.template?.core;
  const groups=[['sauce','2. Соус','одна основа'],['style','Вид супа','можно включить или убрать'],['protein',recipe.generator?'3. Наполнитель':'Наполнитель','один вариант или без него'],['vegetables',recipe.generator?'4. Овощи':'Овощи','можно сочетать'],['finish','Подача','один вариант или без неё'],[null,'Специи и добавки','можно сочетать']];
  const controls=groups.map(([group,label,note])=>{
    const modules=recipe.modules.filter(m=>(m.group||null)===group);
    if(!modules.length)return '';
    return `<div class="module-group-label">${label} <small>· ${note}</small></div><div class="module-buttons" role="group" aria-label="${label}">${modules.map(module=>`<button data-action="module" data-id="${module.id}" class="${moduleIds.includes(module.id)?'active':''}" aria-pressed="${moduleIds.includes(module.id)}" ${module.shore&&state.mode!=='shore'?'disabled':''}>${icon(moduleIds.includes(module.id)?'check':'plus')} ${module.label}${module.extraMinutes?` · +${module.extraMinutes} мин`:''}</button>`).join('')}</div>`;
  }).join('');
  return `<section class="flexible-recipe"><div class="eyebrow small">${recipe.template?'УНИВЕРСАЛЬНОЕ БЛЮДО':'ВАРИАНТЫ И ДОБАВКИ'}</div>${recipe.template?`<div class="core-products">${core.map(id=>`<button data-action="product" data-id="${id}">${icon(productById[id].icon)} ${['tomatoPaste','tomato','passata','ketchup'].includes(id)?'Томаты':id==='eggs'?'Яйца':id==='milk'?'Молоко':id==='bread'?'Хлеб':productById[id].name}</button>`).join('<b>+</b>')}</div><p>${recipe.template.text}</p>`:'<h3>Добавки к общей основе</h3>'}${renderGeneratorChoices(recipe,prepared)}${controls}<small>Выбор меняет состав, выход, воду и закупку. Нажмите повторно, чтобы убрать.${recipe.modules?.some(m=>m.shore)?' Для охлаждённых продуктов включите режим «У берега».':''}</small></section>`;
}
const litres=n=>`${Number(n.toFixed(1)).toLocaleString('ru-RU')} л`;
function tripOptions(){return {days:state.tripDays,includeEggs:state.includeEggs,drinkLitres:state.drinkLitres,washLitres:state.washLitres,reservePct:state.reservePct,overrides:state.tripOverrides,pantry:state.pantry};}
function renderWater(water,compact=false){
  return `<section class="water-budget ${compact?'compact-water':''}"><div class="water-heading">${icon('drop')}<div><span class="eyebrow small">ВОДА НА ${water.days} ${plural(water.days,'ДЕНЬ','ДНЯ','ДНЕЙ')}</span><strong>${litres(water.total)}</strong></div><span class="water-buy">Купить ${water.bottles} × 1,5 л<br><b>${litres(water.buyLitres)}</b></span></div><div class="water-breakdown"><span>Питьё <strong>${litres(water.drinking)}</strong></span><span>Рецепты <strong>${litres(water.cooking)}</strong></span><span>Подготовка продуктов <strong>${litres(water.preparation)}</strong></span><span>Бытовые нужды <strong>${litres(water.washing)}</strong></span><span>Резерв <strong>${litres(water.reserve)}</strong></span></div><p>Расход — предположение для планирования, не персональная норма питья и не расчёт воды для душа. Увеличивайте по погоде, нагрузке и реальным потребностям.</p></section>`;
}
function purchaseRows(plan,season=false){
  return `<div class="builder-purchases">${plan.items.map(item=>`<details class="purchase-detail"><summary><span>${productById[item.id].name}<small>${item.refillDays?`Первая закупка на ${item.refillDays} дней · на сезон нужно ${formatAmount(item.seasonDemand,item.demandUnit)}; пополнять по ходу`:item.leftover?`Нужно ${formatAmount(item.needed,item.package.unit)} · останется ${formatAmount(item.leftover,item.package.unit)} сухого / стабильного запаса`:item.package?'Открытая скоропортящаяся упаковка уйдёт целиком':'Количество для выбранного меню'}</small></span><strong>${formatShoppingAmount(item)}</strong></summary><div><span class="tiny-label">${season?'КАК ИСПОЛЬЗОВАТЬ':'ГДЕ РАСХОДУЕТСЯ'}</span>${(plan.uses[item.id]||[]).map(use=>`<button data-action="${season?'recipe':'trip-recipe'}" data-id="${season?use.recipeId:use.key}">${season?'':`День ${use.day} · `}${use.title||recipeById[use.recipeId].title} ${icon('arrow')}</button>`).join('')||'<p>Общая приправа: добавлять по вкусу.</p>'}</div></details>`).join('')}</div>`;
}
function renderPlanner(){
  const season=state.plannerMode==='season';
  const plan=season?buildSeason(state.seasonDays,state.pantry):buildTrip(tripOptions());
  return `<section class="page-intro"><div class="eyebrow">04 / ПРОВИЗИЯ ПО ПЛАНУ</div><h1>От выхода в море <em>до закупки.</em></h1><p>Выберите длительность — получите меню, продукты и понятный расход.<br>Для одиночного камбуза без холодильника и открытых скоропортящихся остатков.</p></section><div class="meal-tabs planner-tabs"><button data-action="planner-mode" data-id="trip" class="${!season?'active':''}">Поход на 1–7 дней</button><button data-action="planner-mode" data-id="season" class="${season?'active':''}">Базовый набор на сезон</button></div>
  ${season?`<section class="planner-settings"><div><span class="eyebrow small">СЕЗОННЫЙ РУНДУК</span><h2>Сухая основа и консервы</h2><p>Базовые крупы, белок в банках, масло, специи и сухой бульон. Это пополняемый запас основ, а не полный рацион без заходов в порт.</p></div><label>Длительность сезона<select data-builder-field="seasonDays" aria-label="Длительность сезона">${[30,60,90,120,180].map(n=>`<option value="${n}" ${state.seasonDays===n?'selected':''}>${n} дней</option>`).join('')}</select></label></section><div class="storage-banner">${icon('box')}<p>Рабочие пачки открывайте по очереди. Кокосовое молоко, охлаждённая еда и свежие овощи не входят в базовый набор. Короткие по хранению позиции покупаются на первую часть сезона, с явной отметкой пополнения. Воду рассчитывайте на конкретный выход во вкладке «Поход».</p></div>`:`<section class="planner-settings"><div><span class="eyebrow small">ПРОДОЛЖИТЕЛЬНОСТЬ ВЫХОДА</span><div class="day-buttons">${[1,2,3,4,5,6,7].map(n=>`<button data-action="trip-days" data-id="${n}" class="${state.tripDays===n?'active':''}" aria-pressed="${state.tripDays===n}">${n}<small>${plural(n,'день','дня','дней')}</small></button>`).join('')}</div></div><label class="egg-option"><input type="checkbox" data-builder-field="includeEggs" ${state.includeEggs?'checked':''}/> Яйца в первые два дня<small>Только подходящие яйца с известной датой кладки и стабильной прохладой. В жару оставьте выключенным.</small></label></section><div class="water-settings"><label>Питьё, л / день<input type="number" min="2" max="8" step="0.5" value="${state.drinkLitres}" data-builder-field="drinkLitres"/></label><label>Бытовые нужды, л / день<input type="number" min="0" max="10" step="0.5" value="${state.washLitres}" data-builder-field="washLitres"/></label><label>Резерв, %<input type="number" min="0" max="100" step="5" value="${state.reservePct}" data-builder-field="reservePct"/></label></div>${renderWater(plan.water)}
    <section class="trip-menu"><div class="section-heading"><div><div class="eyebrow small">ПРОДУКТЫ БУДУТ ИСПОЛЬЗОВАНЫ В ЭТИХ БЛЮДАХ</div><h2>Меню на ${plan.days} ${plural(plan.days,'день','дня','дней')}</h2></div><span class="muted">3 приёма пищи + перекус</span></div>${Array.from({length:plan.days},(_,index)=>{const day=index+1;return `<div class="trip-day"><h3>День ${day}</h3><div>${plan.entries.filter(e=>e.day===day).map(entry=>`<div class="trip-meal"><span>${mealSlots.find(([id])=>id===entry.slot)[1]}</span><label class="sr-only" for="menu-${entry.key}">День ${day}, ${mealSlots.find(([id])=>id===entry.slot)[1]}</label><select id="menu-${entry.key}" data-trip-override="${day}-${entry.slot}">${tripCandidates(entry.slot,day,state.includeEggs).map(id=>`<option value="${id}" ${entry.recipeId===id?'selected':''}>${entry.recipeId===id?recipeTitle(recipeById[id],entry.choices,entry.modules):recipeById[id].title}</option>`).join('')}</select><button data-action="trip-recipe" data-id="${entry.key}">Состав и рецепт ${icon('arrow')}</button></div>`).join('')}</div></div>`;}).join('')}<p class="footnote">Меню можно менять. Количества определяются упаковками и рецептами; калорийность и достаточность для физической нагрузки не рассчитываются. Повторный разогрев вчерашней еды не заложен.</p></section>`}
    <section class="builder-list"><div class="section-heading"><div><div class="eyebrow small">ПОКУПАЕМ УПАКОВКАМИ</div><h2>${season?'Базовый сезонный набор':'Закупка для этого меню'}</h2></div><strong>${plan.items.length} позиций</strong></div><p class="muted">${season?'Пропорции набора — редактируемое основание для пополнения, не полный рацион на весь сезон.':'Раскройте продукт: видно, в какие дни и блюда он пойдёт. Излишек сухой упаковки остаётся для следующего выхода.'} Уже отмеченное в рундуке исключено — проверьте фактические остатки.</p>${purchaseRows(plan,season)}<div class="builder-apply"><p>${season?'Базовый набор':'Меню и вода'} сохранятся в закупке. Предыдущий конструкторный набор заменится; ваши отдельные блюда и ручные покупки сохранятся.</p><button class="button primary" data-action="apply-builder">${icon('bag')} Сформировать список закупки</button></div></section>`;
}
function handleV3Action(action,id,button){
  if(action==='graph-product'){const family=productFamilies.find(f=>f.members.includes(id));state.graphSelected=state.graphSelected.includes(id)?state.graphSelected.filter(x=>x!==id):[...state.graphSelected.filter(x=>!family?.members.includes(x)),id];render();return true;}
  if(action==='graph-unavailable'){state.showUnavailable=!state.showUnavailable;render();return true;}
  if(action==='graph-clear'){state.graphSelected=[];state.graphQuery='';render();return true;}
  if(action==='graph-focus'){state.graphFocus=state.graphFocus===id?null:id;if(state.graphFocus){const ids=recipeProductIds(recipeById[id]);document.querySelectorAll('.network-group').forEach(group=>{if([...group.querySelectorAll('[data-product-node]')].some(n=>ids.includes(n.dataset.productNode)))group.open=true;});}requestAnimationFrame(drawGraph);return true;}
  if(action==='graph-results'){document.querySelector('#graph-results').scrollIntoView({behavior:'smooth',block:'start'});return true;}
  if(action==='generator-base'&&currentRecipe){choices.pasta=id;openRecipe(currentRecipe,true);return true;}
  if(action==='recipe-preset'&&currentRecipe){const recipe=recipeById[currentRecipe],preset=(recipe.generator?.presets||recipe.presets||[]).find(p=>p.id===id);if(preset&&(!preset.shore||state.mode==='shore')){moduleIds=[...preset.modules];anchorId=null;openRecipe(currentRecipe,true);}return true;}
  if(action==='module'&&currentRecipe){const recipe=recipeById[currentRecipe],module=recipe.modules.find(m=>m.id===id);if(!module||module.shore&&state.mode!=='shore')return true;if(moduleIds.includes(id))moduleIds=moduleIds.filter(x=>x!==id);else{if(module.group&&!module.multiple)moduleIds=moduleIds.filter(x=>recipe.modules.find(m=>m.id===x)?.group!==module.group);moduleIds.push(id);}openRecipe(currentRecipe,true);return true;}
  if(action==='trip-days'){state.tripDays=Number(id);render();return true;}
  if(action==='planner-mode'){state.plannerMode=id;render();return true;}
  if(action==='trip-recipe'){const entry=buildTrip(tripOptions()).entries.find(e=>e.key===id);if(entry){choices={...entry.choices};packSizes={...entry.packSizes};anchorId=entry.anchorId;moduleIds=[...entry.modules];openRecipe(entry.recipeId,true);document.querySelector('#detail').scrollTop=0;}return true;}
  if(action==='apply-builder'){
    state.plan=state.plan.filter(p=>p.source!=='builder');state.manual=state.manual.filter(p=>p.source!=='builder');state.checked=[];
    if(state.plannerMode==='trip'){const plan=buildTrip(tripOptions());state.plan.push(...plan.entries.map(e=>({...e,key:crypto.randomUUID()})));state.builderMeta={kind:'trip',...tripOptions()};delete state.builderMeta.pantry;}
    else{const plan=buildSeason(state.seasonDays,state.pantry);state.manual.push(...plan.items.map(i=>({...i,source:'builder'})));state.builderMeta={kind:'season',days:plan.days};}
    save();location.hash='shopping';toast('Список закупки сформирован');return true;
  }
  return false;
}
window.addEventListener('resize',()=>{if(state.view==='map')requestAnimationFrame(drawGraph);});
document.fonts?.ready.then(()=>requestAnimationFrame(drawGraph));
document.addEventListener('toggle',event=>{if(event.target.classList?.contains('network-group'))requestAnimationFrame(drawGraph);},true);

function render() {
  const focus=document.activeElement;
  const searchFocused=focus?.id==='search';
  const cursor=searchFocused?focus.selectionStart:null;
  document.querySelector('#main').innerHTML = ({map:renderMap,pantry:renderPantry,recipes:renderRecipes,planner:renderPlanner,shopping:renderShopping}[state.view])();
  document.querySelectorAll('[data-nav]').forEach(n=>{n.classList.toggle('active',n.dataset.nav===state.view); if(n.dataset.nav===state.view)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
  document.querySelectorAll('[data-action="mode"]').forEach(n=>{n.classList.toggle('active',n.dataset.mode===state.mode);n.setAttribute('aria-pressed',String(n.dataset.mode===state.mode));});
  document.querySelector('#cart-count').textContent=cartItems().length;
  document.title=`${titles[state.view]} · Дельный камбуз · deelstuff`;
  if(state.view==='map')requestAnimationFrame(drawGraph);
  if(searchFocused){const input=document.querySelector('#search');input?.focus(); if(input&&cursor!==null)input.setSelectionRange(cursor,cursor);}
}

function openDialog(content,kind='',preserveScroll=false) {
  const dialog=document.querySelector('#detail');
  const previousScroll=dialog.scrollTop;
  if(!dialog.open)lastFocus=document.activeElement;
  document.querySelector('#detail-content').innerHTML=`<div class="drawer-top"><span class="eyebrow small">КАМБУЗ / ${kind||'ЗАМЕТКИ НА ПОЛЯХ'}</span><button class="icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button></div>${content}`;
  if(!dialog.open)dialog.showModal();
  dialog.scrollTop=preserveScroll?previousScroll:0;
  document.body.classList.add('dialog-open');
}
function openProduct(id) {
  const p=productById[id];if(!p)return;
  currentProduct=id;currentRecipe=null;
  const related=recipes.filter(r=>(state.mode==='shore'||!r.shore)&&recipeProductIds(r).includes(id));
  const group=variantGroups.find(g=>g.includes(id));
  const source=sources.find(s=>s.id===p.source);
  const family=productFamilies.find(f=>f.id===p.familyId);
  openDialog(`<div class="product-detail-head"><span class="product-symbol large ${p.state}">${icon(p.icon)}</span><span class="tag">${p.category}</span><h2>${p.name}</h2><p>${p.hint}</p></div>
    ${group?`<div class="product-variants">${group.map(v=>`<button data-action="product" data-id="${v}" class="${v===id?'active':''}">${productById[v].name}</button>`).join('')}</div>`:''}
    <div class="product-role"><span>Роль в блюде: <strong>${p.role}</strong></span>${family?`<h3>${family.name}</h3><p>${family.note}</p><div>${family.members.map(id=>`<button data-action="product" data-id="${id}" class="${id===p.id?'active':''}">${productById[id].name}</button>`).join('')}</div>`:'<p>Прямой универсальной замены нет. В рецептах проверяйте разрешённые варианты по той же роли.</p>'}</div><div class="storage-pair"><div><span>ЗАКРЫТЫЙ / ЦЕЛЫЙ ПРОДУКТ</span><strong>${p.life}</strong></div><div><span>ПОСЛЕ ОТКРЫТИЯ / ПОДГОТОВКИ</span><strong>${p.afterLife}</strong></div></div>
    <section class="detail-section"><h3>${icon('box')} Как хранить на яхте</h3><p>${p.storage}</p></section><section class="detail-section"><h3>${icon('clock')} После открытия</h3><p>${p.after}</p></section>${p.note?`<div class="detail-notice">${icon('info')}<p>${p.note}</p></div>`:''}
    ${p.packages?`<section class="detail-section"><h3>Упаковки для планирования</h3><p>${p.packages.map(pack=>formatAmount(pack.size,pack.unit)+(pack.edible!==pack.size?` (примерно ${pack.edible} г без жидкости)`:'' )).join(' · ')}. В рецепте выбирайте фактическую упаковку: открытое содержимое используется целиком. Масса без жидкости здесь типовая; проверяйте конкретную банку.</p></section>`:''}
    <div class="detail-stats"><div><span>СЫТОСТЬ*</span><strong>${p.satiety==='Добавка'?'Добавка к блюду':p.satiety}</strong><small>${p.portion}</small></div><div><span>УСЛОВИЯ ДЛЯ ОРИЕНТИРА</span><strong>Сухо и прохладно</strong><small>Желательно 15–21 °C, без конденсата</small></div></div>
    <p class="footnote">Числа — ориентир для планирования запаса, ограниченный условиями продукта и остаточным сроком. Открытие не запускает срок заново. Сытость не измерена в часах и зависит от порции и нагрузки.</p>
    <div class="detail-actions">${p.state!=='shore'?`<button class="button primary" data-action="toggle-pantry" data-id="${p.id}">${icon(state.pantry.includes(p.id)?'check':'plus')} ${state.pantry.includes(p.id)?'Есть в рундуке · убрать':'Есть в рундуке'}</button>`:''}<button class="button secondary" data-action="manual" data-id="${p.id}">${icon('bag')} В закупку</button></div>
    ${related.length?`<section class="detail-section"><h3>Что из этого приготовить</h3><div class="related-recipes">${related.map(r=>`<button data-action="recipe" data-id="${r.id}"><span>${r.title}</span><small>${r.time} мин ${icon('arrow')}</small></button>`).join('')}</div></section>`:''}<a class="source-link" href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} ↗</a>`, 'ПРОДУКТЫ');
}


function openFavorite(id){
  const favorite=state.favorites.find(f=>f.recipeId===id);if(!favorite)return;
  choices={...favorite.choices};packSizes={...favorite.packSizes};anchorId=favorite.anchorId;moduleIds=[...favorite.modules];openRecipe(id,true);
}
function toggleFavorite(id){
  const recipe=recipeById[id];if(!recipe)return;
  const exists=state.favorites.some(f=>f.recipeId===id);
  if(exists)state.favorites=state.favorites.filter(f=>f.recipeId!==id);
  else{const context=recipeContext(recipe);state.favorites.push(selectionSnapshot(recipe,context.choices,context.packSizes,context.anchorId,context.modules));}
  save();render();toast(exists?'Рецепт убран из избранного':'Рецепт добавлен в избранное');
}
function saveCurrentFavorite(){
  const recipe=recipeById[currentRecipe];if(!recipe)return;
  const snapshot=selectionSnapshot(recipe,choices,packSizes,anchorId,moduleIds),saved=state.favorites.find(f=>f.recipeId===recipe.id);
  state.favorites=state.favorites.filter(f=>f.recipeId!==recipe.id);
  if(!saved||!sameSelection(saved,snapshot))state.favorites.push(snapshot);
  save();render();openRecipe(recipe.id,true);
  toast(saved&&sameSelection(saved,snapshot)?'Рецепт убран из избранного':saved?'Вариант в избранном обновлён':'Выбранный вариант сохранён в избранном');
}
function recipeTools(recipe,prepared){
  const saved=state.favorites.find(f=>f.recipeId===recipe.id),same=saved&&sameSelection(saved,selectionSnapshot(recipe,choices,packSizes,anchorId,moduleIds));
  return `<div class="recipe-tools"><button class="button secondary ${same?'is-favorite':''}" data-action="favorite-current" aria-pressed="${Boolean(same)}">${icon('star')} ${same?'Убрать из избранного':saved?'Обновить избранное':'В избранное'}</button><button class="button primary" data-action="recipe-png">${icon('download')} Скачать PNG</button><p>Звёздочка хранит один ваш вариант этого рецепта: замены, добавки и размеры упаковок. PNG сохраняет состав и шаги, которые выбраны сейчас.</p></div>`;
}
function renderCookingBasics(recipe,prepared){
  const tips=cookingBasics(recipe,prepared);
  return `<section class="cooking-basics"><h3>Перед началом</h3><p><strong>Посуда:</strong> ${recipeUtensils(recipe,prepared).join(' · ')}.</p>${tips.length?`<ul>${tips.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}</section>`;
}
async function exportCurrentRecipe(){
  const recipe=recipeById[currentRecipe];if(!recipe)return;
  const card=buildRecipeCard(recipe,selectionSnapshot(recipe,choices,packSizes,anchorId,moduleIds));
  const button=document.querySelector('[data-action="recipe-png"]');
  if(button?.disabled)return;
  if(button){button.disabled=true;button.textContent='Готовлю PNG…';}
  try{await downloadRecipePng(card);toast('PNG-карточка с выбранным вариантом сохранена');}
  catch{toast('Не удалось создать PNG. Попробуйте ещё раз в этой вкладке.');}
  finally{if(button?.isConnected){button.disabled=false;button.innerHTML=icon('download')+' Скачать PNG';}}
}
function openRecipe(id,keepChoices=false) {
  const r=recipeById[id];if(!r)return;
  if(!keepChoices){choices={};packSizes={};anchorId=null;moduleIds=[];r.ingredients.forEach(i=>{if(!state.pantry.includes(i.id)){const alt=i.alternatives.find(a=>state.pantry.includes(a.id));if(alt)choices[i.id]=alt.id;}});}
  const openingSelection=currentProduct&&document.querySelector("#detail").open&&recipeProductIds(r).includes(currentProduct)?[currentProduct]:activeRecipeSelection();
  if(!keepChoices&&openingSelection.length){const inferred=choicesForSelection(r,openingSelection,state.pantry);choices={...choices,...inferred.choices};moduleIds=inferred.modules;}
  currentRecipe=id;currentProduct=null;
  const prepared=prepareRecipe(r,choices,packSizes,anchorId,moduleIds);
  anchorId=prepared.anchorId;moduleIds=prepared.modules.map(m=>m.id);
  const misses=prepared.ingredients.filter(i=>!state.pantry.includes(i.id));
  const isLarge=prepared.yieldGrams>750&&!r.drySnack;
  const packageControls=prepared.packaged.length?`<section class="package-planner"><div class="eyebrow small">СНАЧАЛА УПАКОВКА — ПОТОМ ГРАММОВКИ</div><h3>Вскрываем и расходуем целиком</h3><p>У всех скоропортящихся упаковок ниже используется всё содержимое. Сухая основа, масло и специи считаются от выбранной опорной упаковки.</p>${prepared.packaged.length>1?`<label for="pack-anchor">Считать основу от</label><select id="pack-anchor">${prepared.packaged.map(i=>`<option value="${i.id}" ${i.id===prepared.anchorId?'selected':''}>${productById[i.id].name}</option>`).join('')}</select>`:''}<div class="package-summary">${prepared.ingredients.filter(i=>i.package).map(i=>`<span>${icon('check')} ${productById[i.id].name}: ${i.package.edible!==i.package.size?'вся банка ':'все '}${formatAmount(i.package.size,i.package.unit)}${i.package.edible!==i.package.size?' · без жидкости':''}</span>`).join('')}</div><small>Масса без жидкости у консервов типовая. Выход — расчётный ориентир, а не измеренная готовая порция.</small></section>`:'';
  openDialog(`<div class="recipe-detail-heading ${r.tone}"><span class="tag">${prepared.shore?'С БЕРЕГА · '+(prepared.meal==='main'?'ОСНОВНОЕ БЛЮДО':'ГОТОВИТЬ СРАЗУ'):r.vessel==='cold'?'БЕЗ ПЛИТЫ':r.meal==='breakfast'?'ЗАВТРАК':r.vessel==='pan'?'СКОВОРОДА':'ОДНА КАСТРЮЛЯ'}</span><h2>${prepared.title}</h2><p>${r.desc}</p></div>
    <div class="recipe-detail-stats"><span>${icon('clock')}<strong>${prepared.time} мин</strong><small>с выбранными добавками</small></span><span>${icon(r.vessel==='cold'?'person':'pot')}<strong>${prepared.active} мин</strong><small>${r.vessel==='cold'?'подготовки':'активной готовки'}</small></span><span>${icon('box')}<strong>≈ ${prepared.yieldGrams} г</strong><small>выход из упаковок</small></span></div>
    ${prepared.shore?`<div class="detail-notice warning">${icon('sun')}<p>Охлаждённые продукты готовить сразу после покупки. Без холода максимум 2 часа суммарно, выше 32 °C — 1 час.</p></div>`:''}
    ${prepared.eggConditional?`<div class="detail-notice">${icon('egg')}<p>Для яиц проверьте возраст от кладки и историю охлаждения. Немытые неохлаждённые яйца требуют стабильной прохлады; ориентир до 18 дней от кладки не действует для жаркого рундука. Охлаждённые яйца сохранять в холоде до готовки. Белок и желток готовить полностью.</p></div>`:''}
    ${recipeTools(r,prepared)}${renderRecipeModules(r,prepared)}${packageControls}${isLarge?`<div class="detail-notice warning">${icon('person')}<p><strong>Выход большой для одного приёма: примерно ${prepared.yieldGrams} г.</strong> Выберите меньшую упаковку или разделите готовую еду с попутчиком сейчас. Без холодильника выход этой готовки нельзя распределять на следующие вахты. Для увеличенного объёма нужны подходящая посуда и дополнительное время.${prepared.ingredients.some(i=>i.id==='passata')&&r.id!=='tomato-pack-soup'?'<br><button class="pack-recipe-link" data-action="recipe" data-id="tomato-pack-soup">Использовать 500 г пассаты в компактном томатном супе →</button>':''}</p></div>`:''}
    <section class="detail-section ingredients-section"><div class="detail-heading-row"><h3>Состав под вашу упаковку</h3><span>${icon('swap')} Варианты и замены</span></div><div class="ingredient-list">${prepared.ingredients.map(chosen=>{
      const original=effectiveIngredients(r,moduleIds).find(i=>i.id===chosen.originalId);
      return `<div class="ingredient-row"><span class="ingredient-dot ${state.pantry.includes(chosen.id)?'owned':''}">${icon(state.pantry.includes(chosen.id)?'check':'plus')}</span><div class="ingredient-info">${original.alternatives.length?`<label class="sr-only" for="swap-${original.id}">Заменить ${productById[original.id].name}</label><select id="swap-${original.id}" data-swap="${original.id}"><option value="${original.id}" ${chosen.id===original.id?'selected':''}>${productById[original.id].name}</option>${original.alternatives.map(a=>`<option value="${a.id}" ${chosen.id===a.id?'selected':''}>↔ ${productById[a.id].name}</option>`).join('')}</select>`:`<button class="ingredient-product" data-action="product" data-id="${chosen.id}">${productById[chosen.id].name}</button>`}
      ${chosen.package?`<label class="pack-size-label" for="pack-${chosen.id}">Размер целой упаковки</label><select class="pack-size" id="pack-${chosen.id}" data-pack="${chosen.id}">${productById[chosen.id].packages.map(pack=>`<option value="${pack.size}" ${pack.size===chosen.package.size?'selected':''}>${formatAmount(pack.size,pack.unit)}${pack.edible!==pack.size?` · ≈ ${pack.edible} г без жидкости`:''}</option>`).join('')}</select>`:''}<small>${state.pantry.includes(chosen.id)?'Есть в рундуке':'Проверить остаток / купить'}${chosen.package?' · упаковка целиком':''}</small></div><strong>${formatAmount(chosen.amount,chosen.unit)}${chosen.package?'<small class="whole-label">без остатка</small>':''}</strong></div>${chosen.note?`<p class="substitution-note">${icon('swap')} ${chosen.note}</p>`:''}`;
    }).join('')}${prepared.water?`<div class="water-line">${icon('drop')} ${r.generator?'Вода на готовку и восстановление':'Питьевая вода, начальный объём'}<strong>≈ ${prepared.water} мл</strong></div>`:''}${prepared.prepWater?`<div class="water-line preparation-water">${icon("drop")} Отдельно на подготовку / промывание<strong>≈ ${prepared.prepWater} мл</strong></div>`:''}</div>
    <p class="footnote">${r.vessel==='cold'?'Только чистые руки, посуда и питьевая вода для мытья продуктов.':'Вода — ориентир: учитывайте испарение и добавляйте по необходимости. Соль и перец по вкусу, если не указаны в составе.'} Количество людей не задаёт граммовки.</p></section>
    ${renderCookingBasics(r,prepared)}<section class="detail-section"><h3>Как приготовить</h3><ol class="cooking-steps">${recipeSteps(r,choices,moduleIds,prepared).map((step,n)=>`<li><span>${String(n+1).padStart(2,'0')}</span><p>${step}</p></li>`).join('')}</ol>${Object.keys(choices).length?`<div class="detail-notice">${icon('swap')}<p>Используйте выбранные ингредиенты и количества из состава выше. Свежий лук обжарьте 3–5 минут, сухие специи прогревайте несколько секунд. Пассата идёт с жидкостью, а не обжаривается как паста. Подготовку обычных сушёных овощей сверяйте с пачкой; для быстрого текстурата в генераторе заложены отдельные вода и время.</p></div>`:''}</section>
    ${r.tip?`<div class="skipper-tip"><span>${icon('anchor')} ЗАМЕТКА ИЗ КАМБУЗА</span><p>${r.tip}</p></div>`:''}
    ${!r.drySnack?`<div class="detail-notice">${icon('info')}<p>Вскрытое скоропортящееся содержимое используйте всё в текущую готовку. Готовое блюдо без холодильника — максимум 2 часа, выше 32 °C — 1 час; остатки на следующую вахту не планировать. Хлеб и сухие специи живут по своим срокам после открытия.</p></div>`:''}<p class="footnote">Сытость ≈ ${r.satiety}* для обычной порции блюда, не для всего увеличенного выхода. Ориентир условный.</p>
    <div class="recipe-sticky"><div><strong>${misses.length?'Проверить / купить: '+misses.length:'Всё есть в рундуке'}</strong><small>${prepared.packaged.length?'Размеры упаковок сохранятся в закупке':'Количество продуктов — в составе выше'}</small></div><button class="button primary" data-action="add-plan" data-id="${r.id}">${icon('bag')} ${state.view==='planner'?'В закупку отдельно':'В закупку'}</button></div>`, 'РЕЦЕПТЫ',keepChoices);
}


function showSources() {
  currentRecipe=null;currentProduct=null;
  openDialog(`<h2 class="text-dialog-title">Не календарь годности.<br>Навигатор по запасам.</h2><div class="prose"><p>Для яхты нет универсальной таблицы сроков: температура рундука, конденсат, упаковка и исходное качество меняют результат. Мы не выдаём домашние справочники за испытания во влажном море.</p><h3>Как читать карточки</h3><p><strong>«3–6 месяцев»</strong> — редакционный план ротации сухого запаса в герметичной пищевой упаковке, в тени, желательно при 15–21 °C. Он ограничен сроком и условиями производителя. Это не обещание безопасности на весь период.</p><p><strong>«План: 2–3 дня»</strong> — когда съесть свежие покупки, а не установленный срок годности. Проверяйте овощи каждый день. В жару берите только на ближайшее приготовление.</p><p><strong>После открытия</strong> — отдельный ориентир в каждой строке: для сухой крупы это месяцы, для хлеба дни, для вскрытых консервов часы. Открытие не продлевает заводской срок. Условия конкретного продукта могут требовать более короткого хранения.</p><h3>Защита от яхтенной влаги</h3><p>Сухую крупу и муку фасуйте в плотный пищевой zip-lock и убирайте в жёсткий герметичный контейнер. Пакет должен быть сухим внутри. Zip-lock защищает от влаги только при исправном замке; он не защищает от проколов и грызунов. Свежим целым луку и картофелю нужна вентиляция.</p><h3>После приготовления</h3><p>Готовая еда и вскрытые скоропортящиеся продукты без холода — максимум 2 часа; выше 32 °C — 1 час. Это суммарное время, не новый отсчёт после каждого разогрева. Без холодильника удобнее готовить на один раз.</p><h3>Сытость</h3><p>Часы в карточках — условная редакционная оценка, не данные исследования. Для специй и соусов время не указано. Размер порции, белок, клетчатка, жиры, сон и нагрузка меняют ощущение голода. Ориентиры не определяют норму питания.</p><h3>Проверенные источники</h3><p class="muted">Проверено 25 октября 2026. Рецепты и короткие планы ротации — редакционная адаптация для одиночного камбуза.</p><div class="sources-list">${sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.title} ↗</strong><span>${s.text}</span></a>`).join('')}</div></div>`, 'УСЛОВИЯ И ИСТОЧНИКИ');
}
function showSubstitutions() {
  currentRecipe=null;currentProduct=null;
  openDialog(`<h2 class="text-dialog-title">Меняйте продукты.<br>Сохраняйте идею.</h2><div class="prose"><p>Замена работает по роли: основа, белок, аромат, соус. Вкус и время при этом могут измениться.</p><div class="swap-card"><h3>Томатная паста ↔ другие томаты</h3><p><strong>40 г кетчупа</strong> — меньше соли, вкус слаще.<br><strong>Пассата</strong> — весь выбранный пакет; сухая основа пересчитывается под него, вода уменьшается по концентрации.<br><strong>200 г свежих томатов</strong> — примерно на 150 мл меньше воды, добавить время на размягчение.</p><p class="muted">Это стартовые пропорции, не точные эквиваленты: густота и кислотность различаются.</p></div><div class="swap-card"><h3>Свежие ароматы ↔ сухие</h3><p>Ориентир: 1 небольшая луковица ↔ 1 ст. л. сушёных луковых хлопьев или 1 ч. л. лукового порошка; 1 зубчик чеснока ↔ примерно ⅛ ч. л. порошка; 1 ч. л. тёртого имбиря ↔ ¼ ч. л. сухого.</p><p class="muted">Начинайте с меньшего количества. Смесь в рецептах — удобная ароматическая добавка, а не эквивалент объёма свежих овощей. Сухие специи не обжаривают так долго, как лук.</p></div><div class="swap-card"><h3>Белок ↔ белок</h3><p>Тунец ↔ сардины: целая небольшая банка. Мясные консервы ↔ соевый текстурат: гидратировать по инструкции. Фасоль ↔ нут: близкая масса без жидкости, но другой вкус.</p></div><div class="swap-card"><h3>Основа ↔ другая основа</h3><p>Рис, картофель и бобовые роднит принцип блюда, но не соотношение воды и время. Кускус запаривают, пасту помешивают, чечевицу разваривают. Сухую красную фасоль нельзя просто добавить вместо готовой.</p></div><p>В карточках выберите замену и размер её упаковки. Для пассаты используем весь пакет, а основу и начальный объём воды считаем от него. Закупка запомнит размер; банка 200 г и банка 500 г — разные позиции.</p></div>`, 'ЗАМЕНЫ');
}
function showMethod() {
  currentRecipe=null;currentProduct=null;
  openDialog(`<h2 class="text-dialog-title">Один принцип.<br>Разные способы.</h2><div class="prose"><p>Граф показывает родство блюд, а точные количества и порядок находятся в рецептах.</p><h3>1. Ароматическая основа</h3><p>Масло + свежий лук или сухие ароматы. Свежий лук обжаривают несколько минут, сухие специи прогревают только 20–30 секунд, чтобы не сжечь.</p><h3>2. Основа и жидкость</h3><p>Рис впитывает воду под крышкой; паста варится в небольшом количестве воды с помешиванием; красная чечевица разваривается. Картофель нарезают мелкими кубиками. Консервированные бобовые уже готовы.</p><h3>3. Характер блюда</h3><p>Зира и морковь ведут к плову. Томаты и паприка — к рису с рыбой или чили. Карри и кокосовое молоко — к далу или карри. Рыбные и мясные консервы обычно добавляют ближе к концу, затем хорошо прогревают.</p><div class="detail-notice">${icon('info')}<p>Кускус — отдельная ветка: его добавляют после выключения огня. Свежий фарш обжаривают в начале и проверяют термометром. Общая схема не заменяет эти различия.</p></div></div>`, 'ОБЩАЯ СХЕМА');
}
function showSatiety() {
  currentRecipe=null;currentProduct=null;
  openDialog(`<h2 class="text-dialog-title">Сытость — ориентир,<br>а не таймер.</h2><div class="prose"><p>Нельзя надёжно обещать, что 100 г риса обеспечат конкретному человеку ровно три часа сытости. Часы в каталоге — условные редакционные диапазоны для бытового планирования.</p><h3>Что мы показываем</h3><p>У основы — порцию сухого продукта перед приготовлением. У бобовых — массу без жидкости. У консервированного белка — порцию в составе еды. У соусов и специй — «добавка» вместо часов.</p><h3>Как собрать более сытную еду</h3><p>Добавьте к рису, пасте или картофелю белок: чечевицу, нут, фасоль, рыбу, мясные консервы или текстурат. Небольшое количество масла повышает энергетическую ценность, овощи и бобовые добавляют клетчатку.</p><p>Подстраивайте порцию под свой аппетит, физическую работу, погоду и длину вахты. Мужской пол сам по себе не задаёт порцию. Приложение не рассчитывает дневные калории, белок или достаточность питания на переход.</p><a class="source-link" href="https://pubmed.ncbi.nlm.nih.gov/7498104/" target="_blank" rel="noopener noreferrer">Исследование Holt et al.: сравнение сытости, а не часы для нашего каталога ↗</a></div>`, 'СЫТОСТЬ');
}

function addManual(id) {
  if(!productById[id])return;
  if(state.pantry.includes(id)){toast('Продукт уже отмечен в рундуке и исключён из закупки.');return;}
  if(!state.manual.some(i=>i.id===id))state.manual.push({id,amount:1,unit:'уп.'});
  state.checked=state.checked.filter(k=>!k.startsWith(id+':'));save();render();toast('Добавлено в список закупки');
}
function exportList() {
  const items=cartItems();
  const lines=['КАМБУЗ · DEELSTUFF',state.builderMeta?.kind==='season'?'Базовый набор на '+state.builderMeta.days+' дней':'Закупка · готовим от целых упаковок','',...items.map(i=>(state.checked.includes(i.key)?'[x]':'[ ]')+' '+productById[i.id].name+' — '+formatShoppingAmount(i))];
  if(state.builderMeta?.kind==='trip'){
    const water=waterBudget(state.plan,state.builderMeta);
    lines.push('','ВОДА НА '+water.days+' ДНЕЙ','Питьё: '+litres(water.drinking),'Готовка: '+litres(water.cooking),'Подготовка продуктов: '+litres(water.preparation),'Бытовые нужды: '+litres(water.washing),'Резерв: '+litres(water.reserve),'Всего: '+litres(water.total),'Купить '+water.bottles+' '+plural(water.bottles,'бутылку','бутылки','бутылок')+' по 1,5 л = '+litres(water.buyLitres),'','МЕНЮ');
    for(let day=1;day<=water.days;day++){
      lines.push('','День '+day);
      for(const entry of state.plan.filter(p=>p.day===day&&p.source==='builder')){
        const recipe=recipeById[entry.recipeId];
        const additions=(entry.modules||[]).map(id=>recipe.modules.find(m=>m.id===id)?.label).filter(Boolean);
        lines.push((mealSlots.find(([id])=>id===entry.slot)?.[1]||'Блюдо')+': '+recipeTitle(recipe,entry.choices,entry.modules)+(additions.length?' · '+additions.join(', '):''));
      }
    }
  }
  if(state.builderMeta?.kind==='season'){lines.push('','ПОПОЛНЕНИЕ СЕЗОННОГО НАБОРА',...buildSeason(state.builderMeta.days,state.pantry).items.filter(i=>i.refillDays).map(i=>productById[i.id].name+': первая закупка на '+i.refillDays+' дней, общая потребность на сезон '+formatAmount(i.seasonDemand,i.demandUnit)));}
  lines.push('','ДОПОЛНИТЕЛЬНЫЕ БЛЮДА',...state.plan.filter(p=>p.source!=='builder').map(p=>recipeTitle(recipeById[p.recipeId],p.choices,p.modules)+((p.modules||[]).length?' · '+p.modules.map(id=>recipeById[p.recipeId].modules.find(m=>m.id===id)?.label).filter(Boolean).join(', '):'')+' × '+p.count),'','Сухой остаток упаковок хранить герметично. Вскрытые скоропортящиеся упаковки расходовать в текущую готовку.','Проверьте количество продуктов в рундуке. Вода — плановое предположение, регулируйте по погоде и нагрузке. Топливо рассчитывайте отдельно.');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\n')],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='deelkombuese-zakupka.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Список и меню сохранены в текстовый файл');
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const {action,id}=button.dataset;
  if(action==='favorite-recipe')return openFavorite(id);
  if(action==='favorite-toggle')return toggleFavorite(id);
  if(action==='favorite-current')return saveCurrentFavorite();
  if(action==='recipe-png')return exportCurrentRecipe();
  if(action==='recipe')return openRecipe(id);
  if(action==='planned-recipe'){const entry=state.plan.find(p=>p.key===id);if(entry){choices={...entry.choices};packSizes={...entry.packSizes};anchorId=entry.anchorId;moduleIds=[...(entry.modules||[])];openRecipe(entry.recipeId,true);}return;}
  if(action==='product')return openProduct(id);
  if(action==='sources')return showSources();
  if(action==='substitutions')return showSubstitutions();
  if(action==='satiety')return showSatiety();
  if(action==='method')return showMethod();
  if(action==='close')return document.querySelector('#detail').close();
  if(action==='mode'){state.mode=button.dataset.mode;if(state.category==='С берега'&&state.mode==='sea')state.category='all';save();render();toast(state.mode==='shore'?'Доступны охлаждённые продукты для ближайшей готовки':'Показан запас без холодильника');return;}
  if(action==='base')state.base=state.base===id?'all':id;
  if(action==='favorites-only')state.favoritesOnly=!state.favoritesOnly;
  if(action==='quick')state.quick=!state.quick;
  if(action==='pantry-only')state.pantryOnly=!state.pantryOnly;
  if(action==='owned-only')state.ownedOnly=!state.ownedOnly;
  if(action==='category')state.category=id;
  if(action==='sort'){if(state.sortKey===id)state.sortDirection=state.sortDirection==='asc'?'desc':'asc';else{state.sortKey=id;state.sortDirection='asc';}}
  if(action==='meal'){state.meal=id;state.base='all';state.kind='all';}
  if(action==='reset-filters'){state.graphSelected=[];state.graphQuery='';state.query='';state.base='all';state.category='all';state.quick=false;state.pantryOnly=false;state.ownedOnly=false;state.meal='all';state.kind='all';state.favoritesOnly=false;}
  if(action==='starter'){state.pantry=[...new Set([...state.pantry,...starterPantry])];save();toast('Добавлен базовый набор из 10 продуктов. Проверьте фактическое наличие.');}
  if(action==='toggle-pantry'){
    if(!productById[id]||productById[id].state==='shore')return;
    state.pantry=state.pantry.includes(id)?state.pantry.filter(x=>x!==id):[...state.pantry,id];save();
    if(currentProduct&&document.querySelector('#detail').open)openProduct(currentProduct);
  }
  if(action==='manual')return addManual(id);
  if(action==='manual-select'){const select=document.querySelector('#manual-product');if(select.value)addManual(select.value);return;}
  if(action==='add-plan'){
    const existing=state.plan.find(p=>p.recipeId===id&&JSON.stringify(p.choices)===JSON.stringify(choices)&&JSON.stringify(p.packSizes||{})===JSON.stringify(packSizes)&&p.anchorId===anchorId&&JSON.stringify(p.modules||[])===JSON.stringify(moduleIds));
    if(existing)existing.count=Math.min(30,existing.count+1);else state.plan.push({key:crypto.randomUUID(),recipeId:id,count:1,choices:{...choices},packSizes:{...packSizes},anchorId,modules:[...moduleIds],source:'user'});
    state.checked=[];save();render();toast('В закупке сохранены целые упаковки и выбранные замены.');return;
  }
  if(action==='plan-minus'||action==='plan-plus'){
    const entry=state.plan.find(p=>p.key===id);if(entry){entry.count=Math.min(30,Math.max(1,entry.count+(action==='plan-plus'?1:-1)));state.checked=[];save();}
  }
  if(action==='plan-remove'){state.plan=state.plan.filter(p=>p.key!==id);state.checked=[];save();}
  if(action==='clear-plan'){
    const previous={plan:state.plan,manual:state.manual,checked:state.checked,builderMeta:state.builderMeta};state.plan=[];state.manual=[];state.checked=[];state.builderMeta=null;save();render();
    const el=document.querySelector('#toast');toast('План очищен.');const undo=document.createElement('button');undo.textContent='Отменить';undo.onclick=()=>{Object.assign(state,previous);save();render();toast('План восстановлен');};el.append(' ',undo);return;
  }
  if(action==='export')return exportList();
  if(handleV3Action(action,id,button))return;
  render();
});
document.addEventListener('input',event=>{if(event.target.id==='search'){state.query=event.target.value;render();}if(event.target.id==='graph-search'){state.graphQuery=event.target.value;const cursor=event.target.selectionStart;render();const input=document.querySelector('#graph-search');input.focus();input.setSelectionRange(cursor,cursor);}});
document.addEventListener('change',event=>{
  if(event.target.id==='recipe-kind'){state.kind=event.target.value;render();}
  if(event.target.dataset.swap&&currentRecipe){const ingredient=effectiveIngredients(recipeById[currentRecipe],moduleIds).find(i=>i.id===event.target.dataset.swap);if(!ingredient)return;choices[ingredient.id]=event.target.value;if(productById[event.target.value].packages)anchorId=event.target.value;else if(anchorId===ingredient.id)anchorId=null;const focusId=event.target.id;openRecipe(currentRecipe,true);document.getElementById(focusId)?.focus();}
  if(event.target.dataset.variant){state.variants[event.target.dataset.variant]=event.target.value;state.category='all';render();}
  if(event.target.dataset.pack&&currentRecipe){packSizes[event.target.dataset.pack]=Number(event.target.value);anchorId=event.target.dataset.pack;const focusId=event.target.id;openRecipe(currentRecipe,true);document.getElementById(focusId)?.focus();}
  if(event.target.id==='pack-anchor'&&currentRecipe){anchorId=event.target.value;openRecipe(currentRecipe,true);document.getElementById('pack-anchor')?.focus();}
  if(event.target.dataset.tripOverride){state.tripOverrides[event.target.dataset.tripOverride]=event.target.value;render();}
  if(event.target.dataset.builderField){const field=event.target.dataset.builderField;state[field]=event.target.type==='checkbox'?event.target.checked:Math.min(Number(event.target.max)||Infinity,Math.max(Number(event.target.min)||0,Number(event.target.value)||0));render();}
  if(event.target.dataset.shoppingKey){const key=event.target.dataset.shoppingKey;state.checked=event.target.checked?[...new Set([...state.checked,key])]:state.checked.filter(k=>k!==key);save();render();}
});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(views.includes(next)){state.view=next;state.query='';render();window.scrollTo({top:0,behavior:'instant'});document.querySelector('#main').focus({preventScroll:true});}});
document.querySelector('#detail').addEventListener('close',()=>{document.body.classList.remove('dialog-open');currentRecipe=null;currentProduct=null;lastFocus?.isConnected&&lastFocus.focus();});
document.querySelector('#detail').addEventListener('click',event=>{const rect=event.currentTarget.getBoundingClientRect();if(event.target===event.currentTarget&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))event.currentTarget.close();});
shell();
if(storageFailed)toast('Сохранение в браузере недоступно. Данные останутся в текущей вкладке.');
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{const el=document.querySelector('#offline-status');el.classList.add('ready');el.innerHTML='<i></i> Без связи тоже работает';}).catch(()=>{document.querySelector('#offline-status').textContent='Для офлайна откройте через localhost или HTTPS';});
}
