import { renderCookingMode, clock } from './ui/cooking-mode.js';
import { stepDuration } from './cooking-guide.js';
import { localizeMarkup, t } from './i18n/browser.js';

// Controller of the cooking mode («У плиты»): its own full-screen dialog, step navigation by
// buttons and keys, timers that keep running between steps, and a screen wake lock that
// fails silently where the browser has none.
let session = null;
let ticker = null;
let wakeLock = null;
let audio = null;

function dialog() {
  let element = document.querySelector('#stove');
  if (!element) {
    element = document.createElement('dialog');
    element.id = 'stove';
    element.className = 'stove';
    element.setAttribute('aria-label', t('У плиты'));
    document.body.append(element);
    element.addEventListener('click', onClick);
    element.addEventListener('keydown', onKey);
    element.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeStove();
    });
  }
  return element;
}

// Keeps focus on the control just used (a timer button), otherwise on the step button.
function render(focus = null) {
  const element = dialog();
  element.innerHTML = localizeMarkup(renderCookingMode({ ...session, now: Date.now() }));
  (
    (focus && element.querySelector(`[data-stove="${focus}"]`)) ||
    element.querySelector('.stove-nav .primary')
  )?.focus();
}

// Only the clocks change every second; the rest of the screen stays as it is.
function tick() {
  if (!session) return;
  const now = Date.now();
  let finished = false;
  for (const [step, timer] of Object.entries(session.timers)) {
    if (!timer.running) continue;
    const remaining = (timer.endsAt - now) / 1000;
    if (remaining <= 0) {
      timer.running = false;
      timer.remaining = 0;
      finished = true;
    }
    const target =
      Number(step) === session.index
        ? dialog().querySelector('[data-stove-clock]')
        : dialog().querySelector(`[data-stove-chip="${step}"]`);
    if (target) target.textContent = clock(Math.max(0, remaining));
  }
  if (finished) {
    alarm();
    if (dialog().open) render();
  }
  if (!Object.values(session.timers).some((timer) => timer.running)) {
    window.clearInterval(ticker);
    ticker = null;
  }
}

// Three short beeps and a vibration; the browser may refuse both, which is fine.
function alarm() {
  try {
    navigator.vibrate?.([300, 150, 300]);
    if (!audio) return;
    for (let beep = 0; beep < 3; beep++) {
      const tone = audio.createOscillator();
      const gain = audio.createGain();
      tone.frequency.value = 880;
      gain.gain.value = 0.2;
      tone.connect(gain).connect(audio.destination);
      tone.start(audio.currentTime + beep * 0.4);
      tone.stop(audio.currentTime + beep * 0.4 + 0.25);
    }
  } catch {
    /* A silent device still shows the alert on screen. */
  }
}

function toggleTimer() {
  const step = session.index;
  const timer = session.timers[step];
  const now = Date.now();
  // The first tap is a user gesture, so sound can be prepared now for the alarm later.
  try {
    audio ||= new window.AudioContext();
  } catch {
    audio = null;
  }
  if (!timer) {
    const { seconds } = stepDuration(session.steps[step - 1]);
    session.timers[step] = { running: true, endsAt: now + seconds * 1000, remaining: seconds };
  } else if (timer.running) {
    timer.running = false;
    timer.remaining = Math.max(0, (timer.endsAt - now) / 1000);
  } else if (timer.remaining > 0) {
    timer.running = true;
    timer.endsAt = now + timer.remaining * 1000;
  }
  ticker ||= window.setInterval(tick, 500);
  render('timer');
}

function onClick(event) {
  const button = event.target.closest('[data-stove]');
  if (!button || !session) return;
  const action = button.dataset.stove;
  const timer = session.timers[session.index];
  if (action === 'close') return closeStove();
  if (action === 'next') go(session.index + 1);
  if (action === 'prev') go(session.index - 1);
  if (action === 'go') go(Number(button.dataset.step));
  if (action === 'timer') toggleTimer();
  if (action === 'plus' && timer) {
    if (timer.running) timer.endsAt += 60000;
    else timer.remaining += 60;
    ticker ||= window.setInterval(tick, 500);
    render('plus');
  }
  if (action === 'reset') {
    delete session.timers[session.index];
    render('timer');
  }
}

function onKey(event) {
  if (!session || event.target.closest('input, select, textarea')) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key)) go(session.index + 1);
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) go(session.index - 1);
  else if (event.key === 'Escape') closeStove();
  else return;
  event.preventDefault();
}

function go(index) {
  if (index < 0 || index > session.steps.length) return;
  session.index = index;
  render();
}

async function holdScreen() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    session.wakeLock = 'on';
  } catch {
    session.wakeLock = 'off';
  }
  if (dialog().open) render();
}
document.addEventListener('visibilitychange', () => {
  if (session && dialog().open && document.visibilityState === 'visible') holdScreen();
});

// Opens the cooking mode on a prepared dish. Timers of the same dish survive closing and
// reopening the mode within the visit.
export function openStove({ title, prepared, steps }) {
  const key = JSON.stringify([title, steps]);
  if (session?.key !== key) session = { key, title, prepared, steps, timers: {}, index: 0 };
  session.prepared = prepared;
  session.wakeLock = 'wait';
  const element = dialog();
  render();
  if (!element.open) element.showModal();
  document.body.classList.add('stove-open');
  holdScreen();
  if (Object.values(session.timers).some((timer) => timer.running))
    ticker ||= window.setInterval(tick, 500);
}

export function closeStove() {
  const element = dialog();
  if (element.open) element.close();
  document.body.classList.remove('stove-open');
  wakeLock?.release?.().catch(() => {});
  wakeLock = null;
}
