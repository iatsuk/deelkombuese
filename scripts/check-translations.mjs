import { readFileSync } from 'node:fs';
const parameters = (text) =>
  [...text.matchAll(/\{(\d+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join('|');
const numbers = (text) =>
  [...text.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((m) => m[0].replace(',', '.'))
    .sort()
    .join('|');
const problems = [];
for (const language of ['en', 'de']) {
  const catalog = JSON.parse(readFileSync(`locales/${language}.json`, 'utf8'));
  for (const [source, target] of Object.entries(catalog)) {
    if (!target || parameters(source) !== parameters(target))
      problems.push(`${language}: changed placeholders in ${source.slice(0, 90)}`);
    if (numbers(source) !== numbers(target))
      problems.push(`${language}: changed numerical facts in ${source.slice(0, 90)}`);
    if (/[А-Яа-яЁё]/u.test(target) && source !== 'Русский')
      problems.push(`${language}: untranslated source text in ${source.slice(0, 90)}`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else console.log('Translations: placeholders, numerical facts and language coverage passed.');
