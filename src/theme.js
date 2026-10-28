// Header switch: pins the opposite of the theme currently shown and remembers it.
// theme-preference.js applies the saved choice before the first paint.
const storageKey = 'deelkombuese.theme';
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
const currentTheme = () =>
  document.documentElement.dataset.theme || (systemDark() ? 'dark' : 'light');

export function initThemeToggle(button, translate) {
  if (!button) return;
  const render = () => {
    const dark = currentTheme() === 'dark';
    const label = translate(dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', label);
    button.title = label;
  };
  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The choice then lasts for this page only.
    }
    render();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
  render();
}
