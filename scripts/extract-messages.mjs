import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse } from 'acorn';
import { parseFragment, parse as parseHtml } from 'parse5';
const messages = new Set();
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
const add = (value) => {
  const text = normalize(value);
  if (/[А-Яа-яЁё]/u.test(text) && !/^https?:/.test(text)) messages.add(text);
};
function collectHtml(source) {
  const tree = parseFragment(source);
  const walk = (node) => {
    if (node.nodeName === '#text') add(node.value);
    for (const attribute of node.attrs || [])
      if (
        ['alt', 'title', 'placeholder', 'aria-label', 'aria-description', 'content'].includes(
          attribute.name,
        )
      )
        add(attribute.value);
    for (const child of node.childNodes || []) walk(child);
  };
  walk(tree);
}
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'Literal' && typeof node.value === 'string') {
    if (/<[a-z][\w:-]*(?:\s|>)/i.test(node.value)) collectHtml(node.value);
    else add(node.value);
  }
  if (node.type === 'TemplateLiteral') {
    for (const part of node.quasis) {
      if (/<[a-z][\w:-]*(?:\s|>)/i.test(part.value.cooked)) collectHtml(part.value.cooked);
      else add(part.value.cooked);
    }
    const message = node.quasis
      .map(
        (part, index) => part.value.cooked + (index < node.expressions.length ? `{${index}}` : ''),
      )
      .join('');
    if (/<[a-z][\w:-]*(?:\s|>)/i.test(message)) collectHtml(message);
    else add(message);
  }
  for (const [key, value] of Object.entries(node)) {
    if (['start', 'end', 'loc', 'raw'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
const walkFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walkFiles(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`],
  );
for (const path of walkFiles('src').filter((path) => path.endsWith('.js')))
  visit(parse(readFileSync(path, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' }));
for (const path of [
  'index.html',
  'impressum/index.html',
  'datenschutz/index.html',
  'content/legal/impressum.html',
  'content/legal/datenschutz.html',
]) {
  const html = readFileSync(path, 'utf8');
  const tree = parseHtml(html);
  const walk = (node) => {
    if (node.nodeName === '#text') add(node.value);
    for (const attr of node.attrs || [])
      if (['alt', 'title', 'placeholder', 'aria-label', 'content'].includes(attr.name))
        add(attr.value);
    for (const child of node.childNodes || []) walk(child);
  };
  walk(tree);
}
mkdirSync('work', { recursive: true });
const list = [...messages].sort();
writeFileSync('work/messages.json', JSON.stringify(list, null, 2) + '\n');
console.log(`${list.length} public source messages extracted`);
