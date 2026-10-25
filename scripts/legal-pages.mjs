import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse, serialize } from 'parse5';
import { createTranslator } from '../src/i18n/messages.js';
export function generateLegalPages() {
  for (const language of ['ru', 'en', 'de']) {
    const translate = createTranslator(
      language === 'ru' ? {} : JSON.parse(readFileSync(`locales/${language}.json`)),
      language,
    );
    for (const page of ['impressum', 'datenschutz']) {
      const root = language === 'ru' ? '../' : '../../';
      const tree = parse(readFileSync(`content/legal/${page}.html`, 'utf8'));
      const visit = (node) => {
        if (node.nodeName === '#text' && node.value.trim())
          node.value = translate(node.value.trim());
        for (const attr of node.attrs || []) {
          if (['alt', 'title', 'placeholder', 'aria-label', 'content'].includes(attr.name))
            attr.value = translate(attr.value);
          if (attr.name === 'lang') attr.value = language;
          if (attr.name === 'href' && !/^(https?:|mailto:|#)/.test(attr.value)) {
            if (attr.value === '../') attr.value = root + '?lang=' + language;
            else if (attr.value === '../impressum/' || attr.value === '../datenschutz/')
              attr.value = root + attr.value.slice(3) + (language === 'ru' ? '' : language + '/');
            else attr.value = root + attr.value.replace(/^\.\.\//, '');
          }
        }
        for (const child of node.childNodes || []) visit(child);
      };
      visit(tree);
      const directory = page + (language === 'ru' ? '' : '/' + language);
      mkdirSync(directory, { recursive: true });
      let html = serialize(tree);
      const labels = { ru: 'Русский', en: 'English', de: 'Deutsch' };
      const links = ['ru', 'en', 'de']
        .map(
          (code) =>
            `<a href="${root}${page}/${code === 'ru' ? '' : code + '/'}" lang="${code}"${code === language ? ' aria-current="true"' : ''}>${labels[code]}</a>`,
        )
        .join(' · ');
      html = html.replace('</footer>', `<nav aria-label="Language">${links}</nav></footer>`);
      writeFileSync(directory + '/index.html', html + '\n');
    }
  }
}
if (process.argv[1]?.endsWith('legal-pages.mjs')) generateLegalPages();
