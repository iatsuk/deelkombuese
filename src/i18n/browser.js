import { selectLanguage, languageStorageKey, languageUrl, languages } from './locale.js';
import { configureLanguage, t } from './runtime.js';
export { t, plural } from './runtime.js';
import { translateFragment } from './html.js';
let storedLanguage;
try {
  storedLanguage = localStorage.getItem(languageStorageKey);
} catch {
  /* Reading remains available without storage. */
}
const requested = new URL(location.href).searchParams.get('lang');
export const language = selectLanguage({
  explicit: requested,
  saved: storedLanguage,
  system: navigator.languages || [navigator.language],
});
if (languages.includes(requested)) {
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    /* The explicit URL still works. */
  }
}
const catalog =
  language === 'ru'
    ? {}
    : await fetch(new URL(`../../locales/${language}.json`, import.meta.url)).then((response) => {
        if (!response.ok) throw new Error('Language catalogue is unavailable');
        return response.json();
      });
configureLanguage(catalog, language);
export const localizeMarkup = (markup) => translateFragment(markup, t, document);
export function languageSelector() {
  return `<nav class="language-switch" aria-label="Language">${languages.map((code) => `<a href="${languageUrl(location.href, code)}" lang="${code}" hreflang="${code}"${language === code ? ' aria-current="true"' : ''}>${code.toUpperCase()}</a>`).join('')}</nav>`;
}
export function refreshLanguageLinks() {
  document.querySelectorAll('.language-switch a').forEach((link) => {
    link.href = languageUrl(location.href, link.lang);
  });
}
export const legalUrl = (page) => `./${page}/${language === 'ru' ? '' : language + '/'}`;
document.documentElement.lang = language;

document.querySelector('.skip-link').textContent = t('К содержимому');
document.querySelector('#detail').setAttribute('aria-label', t('Подробности'));
