import { language, t } from '../i18n/runtime.js';
export const litres = (value) =>
  `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value)} ${language === 'ru' ? 'л' : 'l'}`;

export const searchText = (values) =>
  values
    .filter(Boolean)
    .map((value) => t(value))
    .join(' ')
    .toLocaleLowerCase(language);
