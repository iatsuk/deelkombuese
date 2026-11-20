import { productById } from '../data.js';
import { formatAmount } from '../model.js';
import { stepDuration } from '../cooking-guide.js';
import { icon } from './icons.js';

// Cooking mode («У плиты»): one screen per step with large controls. Screen 0 lays out the
// ingredients; each later screen is one step and offers a timer when the step names a time.
export const clock = (seconds) => {
  const left = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
};
const span = ({ from, to, unit }) =>
  `<span>${from === to ? from : `${from}–${to}`} ${unit === 'min' ? 'мин' : 'сек'}</span>`;

function renderTimer(step, timer, now) {
  const duration = stepDuration(step);
  if (!duration) return '';
  const remaining = timer ? (timer.running ? (timer.endsAt - now) / 1000 : timer.remaining) : null;
  const done = timer && remaining <= 0;
  const start = timer?.running
    ? 'Пауза'
    : timer
      ? 'Продолжить'
      : `<span>Таймер:</span> ${span(duration)}`;
  return `<div class="stove-timer ${done ? 'done' : ''}"><output data-stove-clock>${clock(timer ? remaining : duration.seconds)}</output>${
    done
      ? `<p class="stove-alarm" role="alert">${icon('clock')} <span>Время вышло: проверьте, по рецепту</span> ${span(duration)}</p>`
      : ''
  }<div class="stove-timer-actions"><button class="button primary" data-stove="timer">${icon(timer?.running ? 'pause' : 'clock')} ${start}</button>${
    timer
      ? `<button class="button secondary" data-stove="plus">+1 мин</button><button class="button secondary" data-stove="reset">Сбросить</button>`
      : ''
  }</div></div>`;
}

// Running timers stay visible on every screen; a chip leads back to its step.
function renderChips(timers, index, now) {
  const chips = Object.entries(timers)
    .filter(([step]) => Number(step) !== index)
    .map(([step, timer]) => {
      const remaining = timer.running ? (timer.endsAt - now) / 1000 : timer.remaining;
      return `<button class="stove-chip ${remaining <= 0 ? 'done' : ''}" data-stove="go" data-step="${step}">${icon('clock')} <span>Шаг ${step}</span> · <span data-stove-chip="${step}">${clock(remaining)}</span></button>`;
    });
  return chips.length ? `<div class="stove-chips">${chips.join('')}</div>` : '';
}

// The water row's key; 'water' alone is a product id.
export const cookingWaterKey = 'cooking-water';

// A row of screen 0 is a toggle: the cook ticks what is already on the counter or in the pot.
const prepRow = (key, label, amount, ticked) =>
  `<li><button class="stove-prep" data-stove="tick" data-item="${key}" aria-pressed="${ticked.includes(key)}"><span class="stove-check" aria-hidden="true">${icon('check')}</span><span class="stove-prep-name">${label}</span><i class="leader" aria-hidden="true"></i><strong>${amount}</strong></button></li>`;

export function renderCookingMode({
  title,
  prepared,
  steps,
  index,
  timers,
  now,
  wakeLock,
  ticked = [],
  night = false,
}) {
  const total = steps.length;
  const body =
    index === 0
      ? `<span class="stove-kicker">Подготовьте</span><p class="stove-hint">Коснитесь продукта, когда он под рукой.</p><ul class="stove-ingredients">${prepared.ingredients
          .map((i) => prepRow(i.id, productById[i.id].name, formatAmount(i.amount, i.unit), ticked))
          .join('')}${
          prepared.water
            ? prepRow(
                cookingWaterKey,
                `${icon('drop')} Вода на готовку`,
                `≈ ${prepared.water} мл`,
                ticked,
              )
            : ''
        }</ul>`
      : `<span class="stove-kicker">Шаг ${index} из ${total}</span><p class="stove-text">${steps[index - 1]}</p>${renderTimer(steps[index - 1], timers[index], now)}`;
  return `<div class="stove-shell">
    <header class="stove-bar"><span class="stove-title">${icon('pot')} ${title}</span><div class="stove-bar-actions"><button class="icon-button" data-stove="night" aria-pressed="${night}" aria-label="Красный свет для ночной вахты" title="Красный свет для ночной вахты">${icon('moon')}</button><button class="icon-button" data-stove="close" aria-label="Закрыть режим у плиты">${icon('close')}</button></div></header>
    ${renderChips(timers, index, now)}
    <div class="stove-progress" aria-hidden="true"><i style="width:${Math.round((index / total) * 100)}%"></i></div>
    <section class="stove-step" aria-live="polite">${body}</section>
    <nav class="stove-nav" aria-label="Шаги"><button class="button secondary" data-stove="prev" ${index === 0 ? 'disabled' : ''}>${icon('arrow', 'flip')} Назад</button><button class="button primary" data-stove="${index === total ? 'close' : 'next'}">${index === total ? 'Готово' : index === 0 ? 'Начать' : 'Дальше'} ${icon(index === total ? 'check' : 'arrow')}</button></nav>
    <p class="stove-note">${wakeLock === 'on' ? '<span>Экран не погаснет, пока открыт режим у плиты.</span>' : wakeLock === 'off' ? '<span>Браузер не держит экран включённым: проверьте настройки сна.</span>' : ''} <span class="stove-keys">← → — шаги, Esc — выход.</span></p>
  </div>`;
}
