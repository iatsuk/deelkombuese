import { language, t } from '../i18n/runtime.js';
export const litres = (value) =>
  `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value)} ${language === 'ru' ? 'л' : 'l'}`;

// Gas: kilograms for a passage, grams for its parts and for one dish.
export const kilograms = (value) =>
  `${new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(value / 1000)} ${language === 'ru' ? 'кг' : 'kg'}`;
export const grams = (value) => `${Math.round(value / 5) * 5} г`;

export const searchText = (values) =>
  values
    .filter(Boolean)
    .map((value) => t(value))
    .join(' ')
    .toLocaleLowerCase(language);
