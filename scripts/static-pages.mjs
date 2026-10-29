// Prerenders a real page for every chapter, chapter dish, standalone recipe and product in
// every language, plus sitemap.xml and robots.txt. The pages carry the full text for
// search engines and readers without JavaScript; the app boots on them as an enhancement.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { configureLanguage, t } from '../src/i18n/runtime.js';
import { translateHtml } from './translation-html.mjs';
import { createAppState, pagePath, pageLanguages, parseRoute } from '../src/state/session.js';
import { loadState } from '../src/state/storage.js';
import { generators, recipes, products, productById } from '../src/data.js';
import { prepareRecipe, recipeSteps, normalizeSelection, formatAmount } from '../src/model.js';
import { dishSlug } from '../src/generator-engine.js';
import { renderGenerators } from '../src/ui/views/generators.js';
import { renderRecipeDialog } from '../src/ui/recipe-dialog.js';
import { renderProductDetail } from '../src/ui/product-detail.js';
import { renderShell } from '../src/ui/shell.js';
import { esc } from '../src/ui/icons.js';

export const siteOrigin = 'https://kombuese.deelstuff.com';
// Generated at the site root; listed in .gitignore and copied by the Pages build.
export const generatedPaths = [
  'generators',
  'recipes',
  'products',
  'en',
  'de',
  'sitemap.xml',
  'robots.txt',
];
const languageNames = { ru: 'Русский', en: 'English', de: 'Deutsch' };

// Every page as language-independent segments; the language prefixes them.
export function sitePages() {
  const pages = [{ kind: 'contents', segments: ['generators'] }];
  for (const recipe of generators) {
    const { slug } = recipe.generator;
    pages.push({ kind: 'chapter', segments: ['generators', slug], recipe });
    for (const dish of recipe.generator.dishes || [])
      pages.push({
        kind: 'dish',
        segments: ['generators', slug, dishSlug(recipe, dish)],
        recipe,
        dish,
      });
  }
  for (const recipe of recipes.filter((r) => !r.generator))
    pages.push({ kind: 'recipe', segments: ['recipes', recipe.id], recipe });
  for (const product of products)
    pages.push({ kind: 'product', segments: ['products', product.id], product });
  return pages;
}

// The selection a chapter page or dish page shows, as the app's chapter view builds it.
function chapterView(recipe, dish) {
  const choices = dish?.base ? { [recipe.generator.choiceKey]: dish.base } : {};
  const moduleIds = normalizeSelection(recipe, choices, dish?.modules || []);
  const prepared = prepareRecipe(recipe, choices, {}, null, moduleIds);
  return {
    recipe,
    prepared,
    selection: {
      choices,
      packSizes: {},
      anchorId: prepared.anchorId,
      moduleIds: prepared.modules.map((m) => m.id),
      modules: prepared.modules,
    },
  };
}

// Chapter links become page links, so crawlers and readers without JavaScript follow them.
function chapterLinks(markup, language) {
  return markup.replace(/href="#generators(?:\/([^"?]+))?(?:\?([^"]*))?"/g, (all, slug, query) => {
    if (!slug) return `href="${pagePath(language, 'generators')}"`;
    const recipe = generators.find((r) => r.generator.slug === slug);
    // A chapter link without a selection is the chapter itself, not its first dish.
    if (!recipe || !query) return recipe ? `href="${pagePath(language, 'generators', slug)}"` : all;
    const route = parseRoute(
      `#generators/${slug}${query ? '?' + query.replace(/&amp;/g, '&') : ''}`,
    );
    const base = route.base || recipe.generator.bases[0].id;
    const dish = (recipe.generator.dishes || []).find(
      (d) =>
        (d.base || recipe.generator.bases[0].id) === base &&
        d.modules.length === route.modules.length &&
        d.modules.every((id) => route.modules.includes(id)),
    );
    return `href="${pagePath(language, 'generators', slug, ...(dish ? [dishSlug(recipe, dish)] : []))}"`;
  });
}

function pageContent(page, state) {
  if (page.kind === 'contents') return renderGenerators({ state, chapter: null });
  if (page.kind === 'chapter' || page.kind === 'dish')
    return renderGenerators({ state, chapter: chapterView(page.recipe, page.dish) });
  if (page.kind === 'recipe') {
    const prepared = prepareRecipe(page.recipe);
    return `<nav class="chapter-crumb" aria-label="Рецепты"><a href="#recipes">Рецепты</a><span aria-hidden="true">/</span><span>${page.recipe.title}</span></nav><div class="standalone-page">${renderRecipeDialog(
      page.recipe,
      prepared,
      {
        state,
        choices: {},
        packSizes: {},
        anchorId: prepared.anchorId,
        moduleIds: prepared.modules.map((m) => m.id),
      },
    )}</div>`;
  }
  return `<nav class="chapter-crumb" aria-label="Продукты"><a href="#pantry">Продукты</a><span aria-hidden="true">/</span><span>${page.product.name}</span></nav><article class="standalone-page product-page">${renderProductDetail(page.product, state)}</article>`;
}

// Title, description and structured data in the page language.
function pageFacts(page, language) {
  // Each name is translated whole: names such as «Менемен · болтунья с томатами» contain ' · '.
  const site = (...names) =>
    [...names.map((name) => t(name)), t('Дельный камбуз'), 'deelstuff'].join(' · ');
  const sentence = (text) => {
    const translated = t(text);
    const end = translated.indexOf('. ', 120);
    return end > 0 && end < 220 ? translated.slice(0, end + 1) : translated;
  };
  if (page.kind === 'contents')
    return {
      title: site('Главы'),
      description: t(
        'Каждая глава — способ готовки, в котором основу и наполнение можно менять. Выберите, что есть на борту, — получится блюдо с расчётом воды, времени и закупки.',
      ),
    };
  if (page.kind === 'chapter') {
    const { chapter, slug } = page.recipe.generator;
    return {
      title: site(chapter.title),
      description: sentence(chapter.principle),
      image: `${siteOrigin}/assets/chapters/${slug}.jpg`,
    };
  }
  if (page.kind === 'dish') {
    const { chapter, slug } = page.recipe.generator;
    const view = chapterView(page.recipe, page.dish);
    return {
      title: site(page.dish.name, chapter.title),
      description: `${t(page.dish.name)}. ${sentence(chapter.principle)}`,
      image: `${siteOrigin}/assets/chapters/${slug}.jpg`,
      recipe: recipeData(page.recipe, view.prepared, view.selection, page.dish.name, language),
    };
  }
  if (page.kind === 'recipe') {
    const prepared = prepareRecipe(page.recipe);
    return {
      title: site(page.recipe.title),
      description: t(page.recipe.desc),
      recipe: recipeData(
        page.recipe,
        prepared,
        { choices: {}, moduleIds: [] },
        page.recipe.title,
        language,
      ),
    };
  }
  const p = page.product;
  return {
    title: site(p.name, 'Продукты'),
    description: `${t(p.name)}: ${t(p.hint)}. ${t('Закрытый / целый продукт')}: ${t(p.life)}. ${t('После открытия / подготовки')}: ${t(p.afterLife)}.`,
  };
}

function recipeData(recipe, prepared, selection, name, language) {
  const steps = recipeSteps(recipe, selection.choices, selection.moduleIds, prepared);
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: t(name),
    inLanguage: language,
    totalTime: `PT${prepared.time}M`,
    recipeIngredient: prepared.ingredients.map(
      (i) => `${t(productById[i.id].name)} — ${t(formatAmount(i.amount, i.unit))}`,
    ),
    recipeInstructions: steps.map((text) => ({ '@type': 'HowToStep', text: t(text) })),
    ...(recipe.generator
      ? {
          recipeCategory: t(recipe.generator.chapter.title),
          image: [`${siteOrigin}/assets/chapters/${recipe.generator.slug}.jpg`],
        }
      : {}),
  };
}

function renderPage(template, page, language, catalogs) {
  configureLanguage(language === 'ru' ? {} : catalogs[language], language);
  const path = pagePath(language, ...page.segments);
  const state = createAppState(loadState({ getItem: () => null }).saved);
  // A dish that needs shore products is shown as it is cooked at the shore.
  if (
    page.kind === 'dish' &&
    (page.dish.shore || chapterView(page.recipe, page.dish).prepared.shore)
  )
    state.mode = 'shore';
  const facts = pageFacts(page, language);
  const languageLinks = `<nav class="language-switch" aria-label="Language">${pageLanguages
    .map(
      (code) =>
        `<a href="${pagePath(code, ...page.segments)}" lang="${code}" hreflang="${code}"${code === language ? ' aria-current="true"' : ''}>${code.toUpperCase()}</a>`,
    )
    .join('')}</nav>`;
  const active = { product: 'pantry', recipe: 'recipes' }[page.kind] || 'generators';
  const body = chapterLinks(
    translateHtml(
      renderShell({
        main: pageContent(page, state),
        languageLinks,
        legalUrl: (legal) => `${legal}/${language === 'ru' ? '' : language + '/'}`,
        active,
      }),
      t,
    ),
    language,
  );
  const depth = path.split('/').filter(Boolean).length;
  const url = (code) => `${siteOrigin}/${pagePath(code, ...page.segments)}`;
  const head = [
    `<base href="${'../'.repeat(depth)}" />`,
    `<link rel="canonical" href="${url(language)}" />`,
    ...pageLanguages.map(
      (code) => `<link rel="alternate" hreflang="${code}" href="${url(code)}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${url('en')}" />`,
    `<meta property="og:type" content="${facts.recipe ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${esc(facts.title)}" />`,
    `<meta property="og:description" content="${esc(facts.description)}" />`,
    `<meta property="og:url" content="${url(language)}" />`,
    `<meta property="og:locale" content="${{ ru: 'ru_RU', en: 'en_GB', de: 'de_DE' }[language]}" />`,
    ...(facts.image ? [`<meta property="og:image" content="${facts.image}" />`] : []),
    ...(facts.recipe
      ? [
          `<script type="application/ld+json">${JSON.stringify(facts.recipe).replace(/</g, '\\u003c')}</script>`,
        ]
      : []),
  ].join('\n    ');
  return (
    template
      .replace('<html lang="en">', `<html lang="${language}">`)
      .replace(/<base href="\.\/" \/>\s*<link rel="canonical"[^>]*\/>/, head)
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(facts.title)}</title>`)
      .replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
        `<meta name="description" content="${esc(facts.description)}" />`,
      )
      // The skip link stays on this page although the base points at the site root.
      .replace(
        '<a class="skip-link" href="#main">К содержимому</a>',
        `<a class="skip-link" href="${path}#main">${t('К содержимому')}</a>`,
      )
      .replace('aria-label="Подробности"', `aria-label="${esc(t('Подробности'))}"`)
      .replace('<div id="app"></div>', `<div id="app">${body}</div>`)
      .replace(/\s*<noscript[\s\S]*?<\/noscript>/, '')
  );
}

export function generateStaticPages(root = '.') {
  const template = readFileSync(join(root, 'index.html'), 'utf8');
  const catalogs = Object.fromEntries(
    ['en', 'de'].map((code) => [
      code,
      JSON.parse(readFileSync(join(root, `locales/${code}.json`))),
    ]),
  );
  for (const path of generatedPaths) rmSync(join(root, path), { recursive: true, force: true });
  const pages = sitePages();
  const addresses = [`${siteOrigin}/`];
  for (const language of pageLanguages)
    for (const page of pages) {
      const path = pagePath(language, ...page.segments);
      mkdirSync(join(root, path), { recursive: true });
      writeFileSync(join(root, path, 'index.html'), renderPage(template, page, language, catalogs));
      addresses.push(`${siteOrigin}/${path}`);
    }
  configureLanguage({}, 'ru');
  writeFileSync(
    join(root, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${addresses.map((address) => `  <url><loc>${address}</loc></url>`).join('\n')}\n</urlset>\n`,
  );
  writeFileSync(
    join(root, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`,
  );
  return addresses.length;
}
if (process.argv[1]?.endsWith('static-pages.mjs')) generateStaticPages();
