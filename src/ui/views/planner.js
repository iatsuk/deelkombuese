import { renderWater } from '../water.js';

import { buildTrip, buildSeason, tripCandidates, mealSlots } from '../../planner.js';
import { productById, recipeById } from '../../data.js';
import { formatAmount, formatShoppingAmount, recipeTitle } from '../../model.js';
import { icon } from '../icons.js';
import { plural } from '../../i18n/runtime.js';
export function createPlannerView(state) {
  function tripOptions() {
    return {
      days: state.tripDays,
      includeEggs: state.includeEggs,
      drinkLitres: state.drinkLitres,
      washLitres: state.washLitres,
      reservePct: state.reservePct,
      overrides: state.tripOverrides,
      pantry: state.pantry,
    };
  }

  function purchaseRows(plan, season = false) {
    return `<div class="builder-purchases">${plan.items.map((item) => `<details class="purchase-detail"><summary><span>${productById[item.id].name}<small>${item.refillDays ? `Первая закупка на ${item.refillDays} дней · на сезон нужно ${formatAmount(item.seasonDemand, item.demandUnit)}; пополнять по ходу` : item.leftover ? `Нужно ${formatAmount(item.needed, item.package.unit)} · останется ${formatAmount(item.leftover, item.package.unit)} сухого / стабильного запаса` : item.package ? 'Открытая скоропортящаяся упаковка уйдёт целиком' : 'Количество для выбранного меню'}</small></span><strong>${formatShoppingAmount(item)}</strong></summary><div><span class="tiny-label">${season ? 'КАК ИСПОЛЬЗОВАТЬ' : 'ГДЕ РАСХОДУЕТСЯ'}</span>${(plan.uses[item.id] || []).map((use) => `<button data-action="${season ? 'recipe' : 'trip-recipe'}" data-id="${season ? use.recipeId : use.key}">${season ? '' : `День ${use.day} · `}${use.title || recipeById[use.recipeId].title} ${icon('arrow')}</button>`).join('') || '<p>Общая приправа: добавлять по вкусу.</p>'}</div></details>`).join('')}</div>`;
  }

  function renderPlanner() {
    const season = state.plannerMode === 'season';
    const plan = season ? buildSeason(state.seasonDays, state.pantry) : buildTrip(tripOptions());
    return `<section class="page-intro"><div class="eyebrow">04 / ПРОВИЗИЯ ПО ПЛАНУ</div><h1>От выхода в море <em>до закупки.</em></h1><p>Выберите длительность — получите меню, продукты и понятный расход.<br>Для одиночного камбуза без холодильника и открытых скоропортящихся остатков.</p></section><div class="meal-tabs planner-tabs"><button data-action="planner-mode" data-id="trip" class="${!season ? 'active' : ''}">Поход на 1–7 дней</button><button data-action="planner-mode" data-id="season" class="${season ? 'active' : ''}">Базовый набор на сезон</button></div>
  ${
    season
      ? `<section class="planner-settings"><div><span class="eyebrow small">СЕЗОННЫЙ РУНДУК</span><h2>Сухая основа и консервы</h2><p>Базовые крупы, белок в банках, масло, специи и сухой бульон. Это пополняемый запас основ, а не полный рацион без заходов в порт.</p></div><label>Длительность сезона<select data-builder-field="seasonDays" aria-label="Длительность сезона">${[30, 60, 90, 120, 180].map((n) => `<option value="${n}" ${state.seasonDays === n ? 'selected' : ''}>${n} дней</option>`).join('')}</select></label></section><div class="storage-banner">${icon('box')}<p>Рабочие пачки открывайте по очереди. Кокосовое молоко, охлаждённая еда и свежие овощи не входят в базовый набор. Короткие по хранению позиции покупаются на первую часть сезона, с явной отметкой пополнения. Воду рассчитывайте на конкретный выход во вкладке «Поход».</p></div>`
      : `<section class="planner-settings"><div><span class="eyebrow small">ПРОДОЛЖИТЕЛЬНОСТЬ ВЫХОДА</span><div class="day-buttons">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<button data-action="trip-days" data-id="${n}" class="${state.tripDays === n ? 'active' : ''}" aria-pressed="${state.tripDays === n}">${n}<small>${plural(n, 'день', 'дня', 'дней')}</small></button>`).join('')}</div></div><label class="egg-option"><input type="checkbox" data-builder-field="includeEggs" ${state.includeEggs ? 'checked' : ''}/> Яйца в первые два дня<small>Только подходящие яйца с известной датой кладки и стабильной прохладой. В жару оставьте выключенным.</small></label></section><div class="water-settings"><label>Питьё, л / день<input type="number" min="2" max="8" step="0.5" value="${state.drinkLitres}" data-builder-field="drinkLitres"/></label><label>Бытовые нужды, л / день<input type="number" min="0" max="10" step="0.5" value="${state.washLitres}" data-builder-field="washLitres"/></label><label>Резерв, %<input type="number" min="0" max="100" step="5" value="${state.reservePct}" data-builder-field="reservePct"/></label></div>${renderWater(plan.water)}
    <section class="trip-menu"><div class="section-heading"><div><div class="eyebrow small">ПРОДУКТЫ БУДУТ ИСПОЛЬЗОВАНЫ В ЭТИХ БЛЮДАХ</div><h2>Меню на ${plan.days} ${plural(plan.days, 'день', 'дня', 'дней')}</h2></div><span class="muted">3 приёма пищи + перекус</span></div>${Array.from(
      { length: plan.days },
      (_, index) => {
        const day = index + 1;
        return `<div class="trip-day"><h3>День ${day}</h3><div>${plan.entries
          .filter((e) => e.day === day)
          .map(
            (entry) =>
              `<div class="trip-meal"><span>${mealSlots.find(([id]) => id === entry.slot)[1]}</span><label class="sr-only" for="menu-${entry.key}">День ${day}, ${mealSlots.find(([id]) => id === entry.slot)[1]}</label><select id="menu-${entry.key}" data-trip-override="${day}-${entry.slot}">${tripCandidates(
                entry.slot,
                day,
                state.includeEggs,
              )
                .map(
                  (id) =>
                    `<option value="${id}" ${entry.recipeId === id ? 'selected' : ''}>${entry.recipeId === id ? recipeTitle(recipeById[id], entry.choices, entry.modules) : recipeById[id].title}</option>`,
                )
                .join(
                  '',
                )}</select><button data-action="trip-recipe" data-id="${entry.key}">Состав и рецепт ${icon('arrow')}</button></div>`,
          )
          .join('')}</div></div>`;
      },
    ).join(
      '',
    )}<p class="footnote">Меню можно менять. Количества определяются упаковками и рецептами; калорийность и достаточность для физической нагрузки не рассчитываются. Повторный разогрев вчерашней еды не заложен.</p></section>`
  }
    <section class="builder-list"><div class="section-heading"><div><div class="eyebrow small">ПОКУПАЕМ УПАКОВКАМИ</div><h2>${season ? 'Базовый сезонный набор' : 'Закупка для этого меню'}</h2></div><strong>${plan.items.length} позиций</strong></div><p class="muted">${season ? 'Пропорции набора — редактируемое основание для пополнения, не полный рацион на весь сезон.' : 'Раскройте продукт: видно, в какие дни и блюда он пойдёт. Излишек сухой упаковки остаётся для следующего выхода.'} Уже отмеченное в рундуке исключено — проверьте фактические остатки.</p>${purchaseRows(plan, season)}<div class="builder-apply"><p>${season ? 'Базовый набор' : 'Меню и вода'} сохранятся в закупке. Предыдущий конструкторный набор заменится; ваши отдельные блюда и ручные покупки сохранятся.</p><button class="button primary" data-action="apply-builder">${icon('bag')} Сформировать список закупки</button></div></section>`;
  }
  return { renderPlanner, tripOptions };
}
