import { productById, recipes, sources, variantGroups, productFamilies } from '../data.js';
import { formatAmount, recipeProductIds } from '../model.js';
import { productGlyph } from '../cooking-visuals.js';
import { icon } from './icons.js';

// A product's storage card: the app shows it in the drawer, the build as a product page.
export function renderProductDetail(p, state) {
  const id = p.id;
  const related = recipes.filter(
    (r) => (state.mode === 'shore' || !r.shore) && recipeProductIds(r).includes(id),
  );
  const group = variantGroups.find((g) => g.includes(id));
  const source = sources.find((s) => s.id === p.source);
  const family = productFamilies.find((f) => f.id === p.familyId);
  return `<div class="product-detail-head"><span class="product-symbol large ${p.state}">${icon(productGlyph(p))}</span><span class="tag">${p.category}</span><h2>${p.name}</h2><p>${p.hint}</p></div>
    ${group ? `<div class="product-variants">${group.map((v) => `<button data-action="product" data-id="${v}" class="${v === id ? 'active' : ''}">${productById[v].name}</button>`).join('')}</div>` : ''}
    <div class="product-role"><span>Роль в блюде: <strong>${p.role}</strong></span>${family ? `<h3>${family.name}</h3><p>${family.note}</p><div>${family.members.map((id) => `<button data-action="product" data-id="${id}" class="${id === p.id ? 'active' : ''}">${productById[id].name}</button>`).join('')}</div>` : '<p>Прямой универсальной замены нет. В рецептах проверяйте разрешённые варианты по той же роли.</p>'}</div><div class="storage-pair"><div><span>Закрытый / целый продукт</span><strong>${p.life}</strong></div><div><span>После открытия / подготовки</span><strong>${p.afterLife}</strong></div></div>
    <section class="detail-section"><h3>${icon('box')} Как хранить на яхте</h3><p>${p.storage}</p></section><section class="detail-section"><h3>${icon('clock')} После открытия</h3><p>${p.after}</p></section>${p.note ? `<div class="detail-notice">${icon('info')}<p>${p.note}</p></div>` : ''}
    ${p.packages ? `<section class="detail-section"><h3>Упаковки для планирования</h3><p>${p.packages.map((pack) => `<span>${formatAmount(pack.size, pack.unit) + (pack.edible !== pack.size ? ` (примерно ${pack.edible} г без жидкости)` : '')}</span>`).join(' · ')}. В рецепте выбирайте фактическую упаковку: открытое содержимое используется целиком. Масса без жидкости здесь типовая; проверяйте конкретную банку.</p></section>` : ''}
    <div class="detail-stats"><div><span>Сытость*</span><strong>${p.satiety === 'Добавка' ? 'Добавка к блюду' : p.satiety}</strong><small>${p.portion}</small></div><div><span>Условия для ориентира</span><strong>Сухо и прохладно</strong><small>Желательно 15–21 °C, без конденсата</small></div></div>
    <p class="footnote">Числа — ориентир для планирования запаса, ограниченный условиями продукта и остаточным сроком. Открытие не запускает срок заново. Сытость не измерена в часах и зависит от порции и нагрузки.</p>
    <div class="detail-actions">${p.state !== 'shore' ? `<button class="button primary" data-action="toggle-pantry" data-id="${p.id}">${icon(state.pantry.includes(p.id) ? 'check' : 'plus')} ${state.pantry.includes(p.id) ? 'Есть в рундуке · убрать' : 'Есть в рундуке'}</button>` : ''}<button class="button secondary" data-action="manual" data-id="${p.id}">${icon('bag')} В закупку</button></div>
    ${related.length ? `<section class="detail-section"><h3>Что из этого приготовить</h3><div class="related-recipes">${related.map((r) => `<button data-action="recipe" data-id="${r.id}"><span>${r.generator?.chapter.title || r.title}</span><small>${r.time} мин ${icon('arrow')}</small></button>`).join('')}</div></section>` : ''}<a class="source-link" href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title} ↗</a>`;
}
