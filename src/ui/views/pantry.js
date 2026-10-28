import { searchText } from '../format.js';
import { t, language } from '../../i18n/runtime.js';
import { productGlyph } from '../../cooking-visuals.js';
import { products, productById, variantGroups } from '../../data.js';
import { sortProducts } from '../../model.js';
import { icon, esc } from '../icons.js';
export function renderPantry({ state, catalog }) {
  const { searchBox, empty } = catalog;

  const q = state.query.trim().toLocaleLowerCase(language);
  const groups = new Map(variantGroups.flatMap((group) => group.map((id) => [id, group])));
  let visible = products.filter(
    (p) =>
      (state.mode === 'shore' || p.state !== 'shore') &&
      (state.category === 'all' || p.category === state.category),
  );
  if (state.category === 'all' && !state.ownedOnly) {
    visible = visible
      .filter((p) => !groups.has(p.id) || groups.get(p.id)[0] === p.id)
      .map((p) => {
        const group = groups.get(p.id);
        if (!group) return p;
        const match =
          q &&
          group
            .map((id) => productById[id])
            .find((v) => t(v.name).toLocaleLowerCase(language).includes(q));
        const remembered = productById[state.variants[group[0]]];
        const selected =
          (remembered && (!q || t(remembered.name).toLocaleLowerCase(language).includes(q))
            ? remembered
            : null) ||
          match ||
          p;
        return state.mode === 'sea' && selected.state === 'shore' ? p : selected;
      });
  }
  visible = visible.filter(
    (p) =>
      (!state.ownedOnly || state.pantry.includes(p.id)) &&
      (!q || searchText([p.name, p.hint, p.storage]).includes(q)),
  );
  const categories = [
    ...new Set(
      products.filter((p) => state.mode === 'shore' || p.state !== 'shore').map((p) => p.category),
    ),
  ];
  visible =
    state.sortKey === 'name'
      ? visible.sort(
          (a, b) =>
            t(a.name).localeCompare(t(b.name), language) * (state.sortDirection === 'asc' ? 1 : -1),
        )
      : sortProducts(visible, state.sortKey, state.sortDirection, state.pantry);
  const sortHead = (key, label) =>
    `<span role="columnheader" class="sort-${key}" aria-sort="${state.sortKey === key ? (state.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}"><button data-action="sort" data-id="${key}">${label} <b>${state.sortKey === key ? (state.sortDirection === 'asc' ? '↑' : '↓') : '↕'}</b></button></span>`;
  const variantSelect = (p) => {
    const group = groups.get(p.id);
    if (!group) return '';
    const options = group
      .map((id) => productById[id])
      .filter((v) => state.mode === 'shore' || v.state !== 'shore');
    if (options.length < 2) return '';
    return `<label class="variant-label">Вариант<select data-variant="${group[0]}" aria-label="Вариант продукта: ${productById[group[0]].name}">${options.map((v) => `<option value="${v.id}" ${v.id === p.id ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>`;
  };
  return `<section class="page-intro"><div class="eyebrow">Провизия без холодильника</div><h1>Порядок в <em>рундуке.</em></h1><p>Планируйте запас до покупки: закрытая упаковка и вскрытая — разные сроки.<br>Свежие и сушёные овощи можно выбирать прямо в строке продукта.</p></section>
    <div class="inventory-banner"><span class="inventory-icon">${icon('box')}</span><div><strong>Мой рундук <span>${state.pantry.length}</span></strong><p>${state.pantry.length ? 'Наличие сохранено. Свежий и сушёный варианты учитываются отдельно; количество проверяйте перед готовкой.' : 'Отметьте реальные запасы или добавьте базовый набор.'}</p></div><button class="button secondary" data-action="starter">${icon('plus')} Базовый набор</button></div>
    <div class="storage-visual-key" aria-label="Три правила хранения">${[
      ['zip', 'Сухое — герметично', 'Zip-lock + жёсткий контейнер'],
      ['air', 'Целые овощи — с воздухом', 'Для лука и картофеля — вентиляция'],
      ['can', 'Банку — на одну готовку', 'Вскрытое используем целиком'],
    ]
      .map(
        ([ic, title, note]) =>
          `<div>${icon(ic)}<span><strong>${title}</strong><small>${note}</small></span></div>`,
      )
      .join(
        '',
      )}</div><div class="storage-banner">${icon('info')}<p><strong>Ориентиры после открытия — для сухой упаковки, тени и прохлады 15–21 °C.</strong> На жаркой сырой яхте сроки сокращаются. Консервы и пассата после вскрытия расходуются в текущую готовку. <button data-action="sources">Условия и источники</button></p></div>
    <div class="catalog-toolbar">${searchBox('Найти продукт или способ хранения')}<button class="filter-pill ${state.ownedOnly ? 'active' : ''}" data-action="owned-only" aria-pressed="${state.ownedOnly}">${icon('check')} Только мои ${state.pantry.length}</button></div>
    <div class="category-tabs" role="group" aria-label="Категории продуктов"><button class="${state.category === 'all' ? 'active' : ''}" data-action="category" data-id="all">Все продукты</button>${categories.map((c) => `<button class="${state.category === c ? 'active' : ''}" data-action="category" data-id="${esc(c)}">${c}</button>`).join('')}</div>
    <div class="product-table" role="table" aria-label="Продукты и сроки хранения"><div class="product-table-head" role="row">${sortHead('name', 'Продукт')}${sortHead('closed', 'До открытия')}${sortHead('after', 'После открытия')}${sortHead('satiety', 'Сытость*')}${sortHead('owned', 'Есть')}</div>${visible.map((p) => `<div class="product-row" role="row"><div class="product-cell" role="cell"><button class="product-name" data-action="product" data-id="${p.id}"><span class="product-symbol ${p.state}">${icon(productGlyph(p))}</span><span><strong>${p.name}</strong><small>${p.hint}</small><small class="mobile-satiety">${p.satiety === 'Добавка' ? 'Добавка к блюду' : 'Сытость ≈ ' + p.satiety + '*'}</small></span></button>${variantSelect(p)}</div><div class="life-cell" role="cell"><button class="product-storage" data-action="product" data-id="${p.id}"><small>Закрытый / целый</small><strong>${p.life}</strong></button></div><div class="after-cell" role="cell"><button class="product-storage" data-action="product" data-id="${p.id}"><small>После открытия / подготовки</small><em>${p.afterLife}</em></button></div><div class="satiety-cell" role="cell"><button class="product-satiety" data-action="product" data-id="${p.id}"><span>${p.satiety === 'Добавка' ? '—' : p.satiety + '*'}</span><small>${p.portion}</small></button></div><div class="pantry-toggle-cell" role="cell">${p.state === 'shore' ? `<button class="icon-button add-shopping" data-action="manual" data-id="${p.id}" aria-label="Добавить ${esc(p.name)} в закупку">${icon('bag')}</button>` : `<button class="pantry-checkbox ${state.pantry.includes(p.id) ? 'checked' : ''}" data-action="toggle-pantry" data-id="${p.id}" role="checkbox" aria-checked="${state.pantry.includes(p.id)}" aria-label="${esc(p.name)} в рундуке">${icon('check')}</button>`}</div></div>`).join('') || empty('Продуктов не найдено', 'Попробуйте другое название или категорию.')}</div>
    <p class="footnote">Сроки после открытия — редакционный план ротации в указанных условиях, а не новое продление срока годности. Для яиц важен возраст от кладки, для хлеба — влажность и отсутствие плесени. * Сытость — условная подсказка для указанной порции.</p>`;
}
