export const languages = ['ru', 'en', 'de'];
export const languageStorageKey = 'deelkombuese.language';
const supported = (value) =>
  languages.includes(String(value).toLowerCase().split('-')[0])
    ? String(value).toLowerCase().split('-')[0]
    : null;
export function selectLanguage({ explicit, saved, system = [] } = {}) {
  if (supported(explicit)) return supported(explicit);
  if (supported(saved)) return supported(saved);
  return system.map(supported).find(Boolean) || 'en';
}
export function languageUrl(href, language) {
  const url = new URL(href);
  url.searchParams.set('lang', languages.includes(language) ? language : 'en');
  return url.href;
}
