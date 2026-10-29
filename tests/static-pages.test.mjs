import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'parse5';
import { generateStaticPages, sitePages, siteOrigin } from '../scripts/static-pages.mjs';
import { visibleMessages } from '../scripts/translation-html.mjs';
import { pagePath, pageLanguages, parsePagePath } from '../src/state/session.js';

// Generate once into a scratch copy of the site root.
const root = mkdtempSync(join(tmpdir(), 'kombuese-pages-'));
cpSync('index.html', join(root, 'index.html'));
cpSync('locales', join(root, 'locales'), { recursive: true });
generateStaticPages(root);
const pages = sitePages();
const read = (path) => readFileSync(join(root, path, 'index.html'), 'utf8');
const find = (node, test, found = []) => {
  if (test(node)) found.push(node);
  for (const child of node.childNodes || []) find(child, test, found);
  return found;
};
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
test.after(() => rmSync(root, { recursive: true, force: true }));

test('Every chapter, dish, recipe and product has a page in every language', () => {
  const kinds = new Set(pages.map((p) => p.kind));
  for (const kind of ['contents', 'chapter', 'dish', 'recipe', 'product'])
    assert.ok(kinds.has(kind));
  for (const language of pageLanguages)
    for (const page of pages) {
      const path = pagePath(language, ...page.segments);
      assert.ok(existsSync(join(root, path, 'index.html')), path);
      const parsed = parsePagePath(path);
      assert.equal(parsed.language, language, path);
      assert.equal(parsed.kind, { dish: 'chapter' }[page.kind] || page.kind, path);
    }
});

test('Pages name themselves canonical with every language and a base at the site root', () => {
  for (const language of pageLanguages)
    for (const page of pages) {
      const path = pagePath(language, ...page.segments);
      const tree = parse(read(path));
      const html = find(tree, (n) => n.tagName === 'html')[0];
      assert.equal(attr(html, 'lang'), language, path);
      const links = find(tree, (n) => n.tagName === 'link');
      const canonical = links.find((l) => attr(l, 'rel') === 'canonical');
      assert.equal(attr(canonical, 'href'), `${siteOrigin}/${path}`, path);
      const alternates = links.filter((l) => attr(l, 'rel') === 'alternate');
      for (const code of [...pageLanguages, 'x-default'])
        assert.ok(
          alternates.some((l) => attr(l, 'hreflang') === code),
          `${path} ${code}`,
        );
      const base = find(tree, (n) => n.tagName === 'base')[0];
      assert.equal(new URL(attr(base, 'href'), `${siteOrigin}/${path}`).href, `${siteOrigin}/`);
    }
});

test('English and German pages are translated in text, titles and structured data', () => {
  for (const language of ['en', 'de'])
    for (const page of pages) {
      const path = pagePath(language, ...page.segments);
      const markup = read(path);
      const body = markup.slice(markup.indexOf('<body>'));
      const untranslated = visibleMessages(body).filter((text) => /[А-Яа-яЁё]/u.test(text));
      assert.deepEqual(untranslated, [], path);
      const head = markup.slice(0, markup.indexOf('<body>'));
      assert.ok(!/[А-Яа-яЁё]/u.test(head), `${path} head`);
    }
});

test('Recipe pages carry structured recipe data; chapter links lead to real pages', () => {
  for (const language of pageLanguages)
    for (const page of pages) {
      const path = pagePath(language, ...page.segments);
      const tree = parse(read(path));
      const data = find(tree, (n) => attr(n, 'type') === 'application/ld+json');
      if (['dish', 'recipe'].includes(page.kind)) {
        const recipe = JSON.parse(data[0].childNodes[0].value);
        assert.equal(recipe['@type'], 'Recipe');
        assert.equal(recipe.inLanguage, language);
        assert.ok(recipe.recipeIngredient.length && recipe.recipeInstructions.length, path);
        assert.match(recipe.totalTime, /^PT\d+M$/);
      } else assert.equal(data.length, 0, path);
      for (const link of find(tree, (n) => n.tagName === 'a')) {
        const href = attr(link, 'href');
        if (/^(?:(?:en|de)\/)?generators\//.test(href))
          assert.ok(existsSync(join(root, href.split('#')[0], 'index.html')), `${path} → ${href}`);
      }
    }
  const contents = read('generators');
  for (const recipe of pages.filter((p) => p.kind === 'chapter'))
    assert.ok(contents.includes(`href="${pagePath('ru', ...recipe.segments)}"`));
});

test('The sitemap lists every page once and robots.txt points at it', () => {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value);
  assert.equal(new Set(locations).size, locations.length);
  assert.equal(locations.length, pages.length * pageLanguages.length + 1);
  for (const location of locations.slice(1)) {
    const path = location.slice(siteOrigin.length + 1);
    assert.ok(existsSync(join(root, path, 'index.html')), location);
  }
  assert.match(
    readFileSync(join(root, 'robots.txt'), 'utf8'),
    new RegExp(`^Sitemap: ${siteOrigin}/sitemap\\.xml$`, 'm'),
  );
});
