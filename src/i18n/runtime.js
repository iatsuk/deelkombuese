import { createTranslator } from './messages.js';
export let language = 'ru';
let translate = (value) => String(value ?? '');
export const missingMessages = new Set();
export const t = (value) => translate(value);
export function configureLanguage(catalog = {}, selected = 'ru') {
  language = selected;
  missingMessages.clear();
  translate = createTranslator(catalog, selected, (message) => missingMessages.add(message));
}
export const plural = (count, one, few, many) =>
  language === 'ru'
    ? count % 100 >= 11 && count % 100 <= 14
      ? many
      : count % 10 === 1
        ? one
        : count % 10 >= 2 && count % 10 <= 4
          ? few
          : many
    : t(new Intl.PluralRules(language).select(count) === 'one' ? one : many);
