import { renderWater } from '../water.js';
import { buildSeason, waterBudget } from '../../planner.js';
import { products, productById, recipeById } from '../../data.js';
import { formatShoppingAmount, recipeTitle } from '../../model.js';
import { icon } from '../icons.js';
import { plural } from '../../i18n/runtime.js';
export function renderShopping({ state, catalog }) {
  const { empty, cartItems } = catalog;

  const items = cartItems();
  const checked = items.filter((i) => state.checked.includes(i.key)).length;
  const groups = [...new Set(items.map((i) => productById[i.id].category))];
  return `<section class="page-intro"><div class="eyebrow">04 / СЛЕДУЮЩИЙ ЗАХОД В ПОРТ</div><h1>На берег за <em>продуктами.</em></h1><p>Добавьте блюда или соберите <a class="inline-planner-link" href="#planner">план на 1–7 дней</a>.<br>Продукты из рундука исключены; проверьте их количество.</p></section>
    <div class="shopping-layout"><section>${
      state.builderMeta?.kind === 'trip'
        ? renderWater(waterBudget(state.plan, state.builderMeta), true)
        : state.builderMeta?.kind === 'season'
          ? `<div class="storage-banner season-cart-note">${icon('box')}<p><strong>Первичная закупка сезонной базы.</strong> Не весь запас хранится весь сезон. ${buildSeason(
              state.builderMeta.days,
              state.pantry,
            )
              .items.filter((i) => i.refillDays)
              .map((i) => `${productById[i.id].name}: пополнять через ${i.refillDays} дней`)
              .join('; ')}.</p></div>`
          : ''
    }<div class="shopping-summary"><div><h2>Список закупки <span>${items.length}</span></h2><p>${checked} из ${items.length} отмечено · количества для выбранных блюд</p></div><button class="button secondary" data-action="export" ${!items.length ? 'disabled' : ''}>${icon('download')} Скачать .txt</button></div><div class="shopping-progress"><span style="width:${items.length ? (checked / items.length) * 100 : 0}%"></span></div>
    ${
      items.length
        ? groups
            .map(
              (g) =>
                `<section class="shopping-group"><h3>${g}</h3>${items
                  .filter((i) => productById[i.id].category === g)
                  .map(
                    (i) =>
                      `<label class="shopping-line ${state.checked.includes(i.key) ? 'done' : ''}"><input type="checkbox" data-shopping-key="${i.key}" ${state.checked.includes(i.key) ? 'checked' : ''}/><span class="custom-check">${icon('check')}</span><span>${productById[i.id].name}</span><strong>${formatShoppingAmount(i)}</strong></label>`,
                  )
                  .join('')}</section>`,
            )
            .join('')
        : `<div class="empty-shopping">${icon('bag')}<h3>${state.plan.length ? 'Всё уже есть в рундуке' : 'Сначала выберите, что приготовить'}</h3><p>${state.plan.length ? 'Проверьте остатки: наличие продукта не означает, что его хватит на все блюда.' : 'Откройте рецепт и нажмите «В закупку». Список появится здесь.'}</p><a class="button primary" href="#recipes">Открыть рецепты ${icon('arrow')}</a></div>`
    }
    <div class="manual-add"><label for="manual-product">Добавить продукт вручную</label><div><select id="manual-product"><option value="">Выберите продукт…</option>${products
      .filter((p) => state.mode === 'shore' || p.state !== 'shore')
      .map((p) => `<option value="${p.id}">${p.name}</option>`)
      .join(
        '',
      )}</select><button class="button secondary" data-action="manual-select">${icon('plus')} Добавить</button></div></div><p class="footnote">Размер каждой целой упаковки указан в списке. Банки разного объёма учитываются отдельными строками. Список — потребность блюд, а не рассчитанный рацион на весь переход. Расчёт воды для походного плана показан отдельно; топливо планируйте самостоятельно; соль и перец для горячих блюд держите в общем запасе.</p></section>
    <aside class="meal-plan"><span class="eyebrow small">ЧТО ГОТОВИМ</span><h2>План камбуза</h2>${
      state.plan.length
        ? state.plan
            .map(
              (entry) =>
                `<div class="planned-meal"><button data-action="planned-recipe" data-id="${entry.key}">${recipeTitle(recipeById[entry.recipeId], entry.choices, entry.modules)}${
                  entry.modules?.length
                    ? `<small class="plan-package-note">${entry.modules
                        .map(
                          (id) =>
                            recipeById[entry.recipeId].modules.find((m) => m.id === id)?.label,
                        )
                        .filter(Boolean)
                        .join(' · ')}</small>`
                    : ''
                }</button><div class="plan-controls"><span>${entry.count} ${plural(entry.count, 'готовка', 'готовки', 'готовок')}</span><button class="icon-button" data-action="plan-minus" data-id="${entry.key}" aria-label="Уменьшить количество">${icon('minus')}</button><button class="icon-button" data-action="plan-plus" data-id="${entry.key}" aria-label="Увеличить количество">${icon('plus')}</button><button class="icon-button" data-action="plan-remove" data-id="${entry.key}" aria-label="Убрать блюдо">${icon('trash')}</button></div></div>`,
            )
            .join('')
        : '<p class="muted">Здесь будут блюда, которые вы добавили в закупку.</p>'
    }<a href="#recipes" class="plan-add">${icon('plus')} Добавить блюдо</a><div class="plan-note">${icon('info')}<p>Одна готовка = выбранные упаковки, израсходованные целиком. Счётчик повторяет закупку для отдельных приготовлений. Выход каждого блюда указан в карточке.</p></div>${state.manual.length ? `<p class="muted manual-count">Вручную добавлено: ${state.manual.length}</p>` : ''}${state.plan.length || state.manual.length ? '<button class="text-button clear-plan" data-action="clear-plan">Очистить план и список</button>' : ''}</aside></div>`;
}
