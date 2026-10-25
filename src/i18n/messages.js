const cyrillic = /[А-Яа-яЁё]/u;
export const normalizeMessage = (value) => String(value).replace(/\s+/g, ' ').trim();
const escapePattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const unitNames = {
  en: {
    г: 'g',
    мл: 'ml',
    'шт.': 'pcs',
    'ч. л.': 'tsp',
    кубик: 'cube',
    зубчик: 'clove',
    'уп.': 'packs',
  },
  de: {
    г: 'g',
    мл: 'ml',
    'шт.': 'Stk.',
    'ч. л.': 'TL',
    кубик: 'Würfel',
    зубчик: 'Zehe',
    'уп.': 'Packungen',
  },
};
function compilePattern(source, target) {
  // Adjacent fields have no recoverable boundary. Translate their combined value once.
  // Otherwise “600 г” could split into “6” and “00 г”, losing a zero during formatting.
  for (const group of source.match(/(?:\{\d+\}){2,}/g) || []) {
    if (!target.includes(group)) return null;
    const first = group.match(/\{\d+\}/)[0];
    source = source.replace(group, first);
    target = target.replace(group, first);
  }
  const parts = source.split(/(\{\d+\})/g);
  const keys = [];
  const expression = parts
    .map((part) => {
      if (/^\{\d+\}$/.test(part)) {
        keys.push(part);
        return '([\\s\\S]+?)';
      }
      return escapePattern(part);
    })
    .join('');
  return {
    expression: new RegExp('^' + expression + '$'),
    keys,
    target,
    weight: source.replace(/\{\d+\}/g, '').length,
  };
}
export function createTranslator(catalog = {}, language = 'ru', onMissing = () => {}) {
  const exact = new Map(
    Object.entries(catalog).map(([source, target]) => [normalizeMessage(source), target]),
  );
  const patterns = [...exact]
    .filter(([source]) => /\{\d+\}/.test(source))
    .map(([source, target]) => compilePattern(source, target))
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight);
  function translate(value, depth = 0) {
    const original = String(value ?? '');
    if (language === 'ru' || !cyrillic.test(original) || original === 'Русский') return original;
    const text = normalizeMessage(original);
    if (exact.has(text)) return exact.get(text);
    if (depth > 8) {
      onMissing(text);
      return original;
    }
    for (const pattern of patterns) {
      const match = pattern.expression.exec(text);
      if (!match) continue;
      const parameters = Object.fromEntries(
        pattern.keys.map((key, index) => [key, translate(match[index + 1], depth + 1)]),
      );
      return pattern.target.replace(/\{\d+\}/g, (key) => parameters[key]);
    }
    // Quantities have a deliberately small, stable vocabulary; identity units stay unchanged.
    const quantity = text.match(/^([\d\s.,⅛¼⅜½⅝¾⅞]+)\s+(г|мл|шт\.|ч\. л\.|кубик|зубчик|уп\.)$/u);
    if (quantity) {
      const number = quantity[1].trim();
      const formatted = /^[\d\s.,]+$/.test(number)
        ? new Intl.NumberFormat(language).format(
            Number(number.replace(/\s/g, '').replace(',', '.')),
          )
        : number;
      return formatted + ' ' + unitNames[language][quantity[2]];
    }
    if (unitNames[language]?.[text]) return unitNames[language][text];
    // These separators compose independent labels, lists or exported lines, never words in prose.
    for (const separator of ['\n', ' · ', ' / ', ', ']) {
      if (!original.includes(separator)) continue;
      const parts = original.split(separator);
      const translated = parts.map((part) => translate(part, depth + 1));
      if (translated.some((part, index) => part !== parts[index]))
        return translated.join(separator);
    }
    const decorated = text.match(/^([✓☐↔≈+×\s]*)(.+?)(\s*[↗→↓×:]*)$/u);
    if (decorated && decorated[2] !== text && exact.has(decorated[2]))
      return decorated[1] + exact.get(decorated[2]) + decorated[3];
    onMissing(text);
    return original;
  }
  return translate;
}
