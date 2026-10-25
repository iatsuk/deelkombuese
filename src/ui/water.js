import { litres } from './format.js';
import { icon } from './icons.js';
import { plural } from '../i18n/runtime.js';
export function renderWater(water, compact = false) {
  return `<section class="water-budget ${compact ? 'compact-water' : ''}"><div class="water-heading">${icon('drop')}<div><span class="eyebrow small">ВОДА НА ${water.days} ${plural(water.days, 'ДЕНЬ', 'ДНЯ', 'ДНЕЙ')}</span><strong>${litres(water.total)}</strong></div><span class="water-buy">Купить ${water.bottles} × 1,5 л<br><b>${litres(water.buyLitres)}</b></span></div><div class="water-breakdown"><span>Питьё <strong>${litres(water.drinking)}</strong></span><span>Рецепты <strong>${litres(water.cooking)}</strong></span><span>Подготовка продуктов <strong>${litres(water.preparation)}</strong></span><span>Бытовые нужды <strong>${litres(water.washing)}</strong></span><span>Резерв <strong>${litres(water.reserve)}</strong></span></div><p>Расход — предположение для планирования, не персональная норма питья и не расчёт воды для душа. Увеличивайте по погоде, нагрузке и реальным потребностям.</p></section>`;
}
