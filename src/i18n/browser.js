import { selectLanguage, languageStorageKey, languageUrl, languages } from './locale.js';
import { parsePagePath, pagePath } from '../state/session.js';
import { configureLanguage, t } from './runtime.js';
export { t, plural } from './runtime.js';
import { translateFragment } from './html.js';
let storedLanguage;
try {
  storedLanguage = localStorage.getItem(languageStorageKey);
} catch {
  /* Reading remains available without storage. */
}
// A prerendered page names its language in its address ('en/generators/eggs/').
const rootPath = new URL('../../', import.meta.url).pathname;
const sitePath = (url) =>
  url.pathname.startsWith(rootPath) ? url.pathname.slice(rootPath.length) : '';
const page = parsePagePath(sitePath(location));
const requested = new URL(location.href).searchParams.get('lang') || page?.language;
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
// On a page address the other language is its sibling page (the hash stays); in the app
// root it is the ?lang= parameter.
function languageHref(code) {
  const url = new URL(location.href);
  const path = sitePath(url);
  const current = parsePagePath(path);
  if (!current) return languageUrl(location.href, code);
  const segments = path.split('/').filter(Boolean);
  if (current.language !== 'ru') segments.shift();
  url.pathname = rootPath + pagePath(code, ...segments);
  url.searchParams.delete('lang');
  return url.href;
}
export function languageSelector() {
  return `<nav class="language-switch" aria-label="Language">${languages.map((code) => `<a href="${languageHref(code)}" lang="${code}" hreflang="${code}"${language === code ? ' aria-current="true"' : ''}>${code.toUpperCase()}</a>`).join('')}</nav>`;
}
export function refreshLanguageLinks() {
  document.querySelectorAll('.language-switch a').forEach((link) => {
    link.href = languageHref(link.lang);
  });
}
export const legalUrl = (page) => `./${page}/${language === 'ru' ? '' : language + '/'}`;
document.documentElement.lang = language;

document.querySelector('.skip-link').textContent = t('К содержимому');
document.querySelector('#detail').setAttribute('aria-label', t('Подробности'));
