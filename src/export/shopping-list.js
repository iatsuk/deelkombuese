import { productById, recipeById } from '../data.js';
import { formatAmount, recipeTitle } from '../model.js';
import { buildSeason, waterBudget, mealSlots } from '../planner.js';

// Translate display fields separately; assembled lines are not translation lookup keys.
export function buildShoppingText(
  { items, checked = [], plan = [], builderMeta = null, pantry = [] },
  { translate = String, language = 'ru' } = {},
) {
  const t = translate;
  const message = (source, ...values) =>
    t(source).replace(/\{(\d+)\}/g, (_, index) => values[index]);
  const litres = (value) =>
    `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value)} ${language === 'ru' ? 'л' : 'l'}`;
  const title = (entry) => {
    const recipe = recipeById[entry.recipeId];
    const additions = (entry.modules || [])
      .map((id) => recipe.modules.find((m) => m.id === id)?.label)
      .filter(Boolean)
      .map((value) => t(value));
    return (
      t(recipeTitle(recipe, entry.choices, entry.modules)) +
      (additions.length ? ' · ' + additions.join(', ') : '')
    );
  };
  const amount = (item) =>
    item.package
      ? `${item.amount} ${t('уп.')} × ${t(formatAmount(item.package.size, item.package.unit))}`
      : t(formatAmount(item.amount, item.unit));
  const lines = [
    t('КАМБУЗ · DEELSTUFF'),
    builderMeta?.kind === 'season'
      ? message('Базовый набор на {0} дней', builderMeta.days)
      : t('Закупка · готовим от целых упаковок'),
    '',
    ...items.map(
      (item) =>
        `${checked.includes(item.key) ? '[x]' : '[ ]'} ${t(productById[item.id].name)} — ${amount(item)}`,
    ),
  ];
  if (builderMeta?.kind === 'trip') {
    const water = waterBudget(plan, builderMeta);
    lines.push('', message('ВОДА НА {0} ДНЕЙ', water.days));
    for (const [label, key] of [
      ['Питьё', 'drinking'],
      ['Готовка', 'cooking'],
      ['Подготовка продуктов', 'preparation'],
      ['Бытовые нужды', 'washing'],
      ['Резерв', 'reserve'],
      ['Всего', 'total'],
    ])
      lines.push(`${t(label)}: ${litres(water[key])}`);
    lines.push(
      message('Купить: {0} × 1,5 л = {1}', water.bottles, litres(water.buyLitres)),
      '',
      t('МЕНЮ'),
    );
    for (let day = 1; day <= water.days; day++) {
      lines.push('', message('День {0}', day));
      for (const entry of plan.filter((entry) => entry.day === day && entry.source === 'builder'))
        lines.push(
          `${t(mealSlots.find(([id]) => id === entry.slot)?.[1] || 'Блюдо')}: ${title(entry)}`,
        );
    }
  }
  if (builderMeta?.kind === 'season')
    lines.push(
      '',
      t('ПОПОЛНЕНИЕ СЕЗОННОГО НАБОРА'),
      ...buildSeason(builderMeta.days, pantry)
        .items.filter((item) => item.refillDays)
        .map(
          (item) =>
            `${t(productById[item.id].name)}: ${message('первая закупка на {0} дней, общая потребность на сезон {1}', item.refillDays, t(formatAmount(item.seasonDemand, item.demandUnit)))}`,
        ),
    );
  lines.push(
    '',
    t('ДОПОЛНИТЕЛЬНЫЕ БЛЮДА'),
    ...plan
      .filter((entry) => entry.source !== 'builder')
      .map((entry) => `${title(entry)} × ${entry.count || 1}`),
    '',
    t(
      'Сухой остаток упаковок хранить герметично. Вскрытые скоропортящиеся упаковки расходовать в текущую готовку.',
    ),
    t(
      'Проверьте количество продуктов в рундуке. Вода — плановое предположение, регулируйте по погоде и нагрузке. Топливо рассчитывайте отдельно.',
    ),
  );
  return lines.join('\n');
}
