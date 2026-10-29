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

export function renderCookingMode({ title, prepared, steps, index, timers, now, wakeLock }) {
  const total = steps.length;
  const body =
    index === 0
      ? `<span class="stove-kicker">Подготовьте</span><ul class="stove-ingredients">${prepared.ingredients
          .map(
            (i) =>
              `<li><span>${productById[i.id].name}</span><i class="leader" aria-hidden="true"></i><strong>${formatAmount(i.amount, i.unit)}</strong></li>`,
          )
          .join(
            '',
          )}${prepared.water ? `<li><span>${icon('drop')} Вода на готовку</span><i class="leader" aria-hidden="true"></i><strong>≈ ${prepared.water} мл</strong></li>` : ''}</ul>`
      : `<span class="stove-kicker">Шаг ${index} из ${total}</span><p class="stove-text">${steps[index - 1]}</p>${renderTimer(steps[index - 1], timers[index], now)}`;
  return `<div class="stove-shell">
    <header class="stove-bar"><span class="stove-title">${icon('pot')} ${title}</span><button class="icon-button" data-stove="close" aria-label="Закрыть режим у плиты">${icon('close')}</button></header>
    ${renderChips(timers, index, now)}
    <div class="stove-progress" aria-hidden="true"><i style="width:${Math.round((index / total) * 100)}%"></i></div>
    <section class="stove-step" aria-live="polite">${body}</section>
    <nav class="stove-nav" aria-label="Шаги"><button class="button secondary" data-stove="prev" ${index === 0 ? 'disabled' : ''}>${icon('arrow', 'flip')} Назад</button><button class="button primary" data-stove="${index === total ? 'close' : 'next'}">${index === total ? 'Готово' : index === 0 ? 'Начать' : 'Дальше'} ${icon(index === total ? 'check' : 'arrow')}</button></nav>
    <p class="stove-note">${wakeLock === 'on' ? '<span>Экран не погаснет, пока открыт режим у плиты.</span>' : wakeLock === 'off' ? '<span>Браузер не держит экран включённым: проверьте настройки сна.</span>' : ''} <span class="stove-keys">← → — шаги, Esc — выход.</span></p>
  </div>`;
}
