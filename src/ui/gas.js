import { grams, kilograms } from './format.js';
import { icon } from './icons.js';
import { plural } from '../i18n/runtime.js';

// The passage gas estimate beside the water budget: burner minutes of the menu, a kettle for
// hot drinks and the reserve, at the stove's rate on a full flame.
export function renderGas(gas, compact = false) {
  return `<section class="water-budget gas-budget ${compact ? 'compact-water' : ''}"><div class="water-heading">${icon('flame')}<div><span class="eyebrow small">Газ на ${gas.days} ${plural(gas.days, 'день', 'дня', 'дней')}</span><strong>${kilograms(gas.total)}</strong></div><span class="water-buy"><span>Горелка ${gas.rate} г/ч</span><br><b>${Math.round(gas.dishMinutes + gas.kettleMinutes)} мин</b></span></div><div class="water-breakdown"><span>Блюда <strong>${grams(gas.dishes)}</strong></span><span>Чайник <strong>${grams(gas.kettle)}</strong></span><span>Резерв <strong>${grams(gas.reserve)}</strong></span></div><p>Оценка по минутам горелки на полном огне; на малом огне расход меньше. 1 кВт мощности конфорки сжигает около 80 г газа в час — мощность указана в паспорте плиты. Перед выходом взвесьте баллон: масса пустого выбита на нём.</p></section>`;
}
