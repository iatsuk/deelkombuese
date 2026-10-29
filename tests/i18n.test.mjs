import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectLanguage, languageUrl } from '../src/i18n/locale.js';
import { createTranslator } from '../src/i18n/messages.js';
import { localizeRecipeCard } from '../src/i18n/recipe-card.js';
import { buildRecipeCard } from '../src/export/recipe-card.js';
import { recipeById } from '../src/data.js';
import { auditRenderedTranslations } from '../scripts/audit-rendered-translations.mjs';
import { translateHtml } from '../scripts/translation-html.mjs';
import { loadState, saveState } from '../src/state/storage.js';
const catalog = (language) =>
  JSON.parse(readFileSync(new URL(`../locales/${language}.json`, import.meta.url)));
test('Language precedence honours explicit, saved and ordered system choices, with English fallback', () => {
  assert.equal(selectLanguage({ explicit: 'de', saved: 'ru', system: ['en'] }), 'de');
  assert.equal(selectLanguage({ saved: 'ru', system: ['en'] }), 'ru');
  assert.equal(selectLanguage({ system: ['fr-FR', 'de-AT', 'en-US'] }), 'de');
  assert.equal(selectLanguage({ system: ['es-ES'] }), 'en');
  assert.equal(selectLanguage({ explicit: 'invalid', saved: 'en' }), 'en');
  const link = new URL(languageUrl('https://example.com/?filter=rice#recipes', 'de'));
  assert.equal(link.searchParams.get('filter'), 'rice');
  assert.equal(link.searchParams.get('lang'), 'de');
  assert.equal(link.hash, '#recipes');
});
test('Translation changes visible labels while IDs, values and event metadata stay canonical', () => {
  const t = createTranslator(catalog('en'), 'en');
  const html = translateHtml(
    '<button id="Капуста" data-id="Капуста" value="Капуста" aria-label="Капуста">Капуста</button>',
    t,
  );
  assert.match(html, /id="Капуста"/);
  assert.match(html, /data-id="Капуста"/);
  assert.match(html, /value="Капуста"/);
  assert.match(html, /aria-label="Cabbage"/);
  assert.match(html, />Cabbage</);
});
test('A translated export keeps recipe identity, numerical facts and action icons', () => {
  const recipe = recipeById['dish-generator'],
    raw = buildRecipeCard(recipe, {
      choices: { pasta: 'potato' },
      modules: ['sauce-cream', 'mushrooms'],
      packSizes: { cream: 65 },
    });
  const original = JSON.stringify(raw);
  for (const language of ['en', 'de']) {
    const translated = localizeRecipeCard(
      raw,
      createTranslator(catalog(language), language),
      language,
    );
    assert.equal(translated.recipeId, raw.recipeId);
    assert.equal(translated.water, raw.water);
    assert.equal(translated.yieldGrams, raw.yieldGrams);
    assert.deepEqual(
      translated.ingredients.map((i) => i.id),
      raw.ingredients.map((i) => i.id),
    );
    assert.equal(translated.actions.length, raw.steps.length);
    assert.ok(translated.actions.every((action) => action.icon));
    assert.ok(!/[А-Яа-яЁё]/u.test(translated.steps.join(' ')));
  }
  assert.equal(JSON.stringify(raw), original);
});
test('Main views and every individual recipe module/substitution have English and German coverage', () => {
  for (const language of ['en', 'de'])
    assert.deepEqual(auditRenderedTranslations(language), [], language);
});
test('Blocked or malformed storage does not break reading; saving reports failure without UI coupling', () => {
  const broken = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  const restored = loadState(broken);
  assert.equal(restored.failed, true);
  assert.deepEqual(restored.saved.favorites, []);
  assert.equal(saveState(broken, restored.saved), false);
  assert.equal(loadState({ getItem: () => '{broken' }).failed, true);
});

test('Recipe and product searches use translated fields rather than concatenated source copy', async () => {
  const { configureLanguage } = await import('../src/i18n/runtime.js');
  const { createAppState } = await import('../src/state/session.js');
  const { createCatalog } = await import('../src/ui/catalog.js');
  const { renderPantry } = await import('../src/ui/views/pantry.js');
  const state = createAppState(loadState({ getItem: () => null }).saved, '#recipes');
  for (const [language, query] of [
    ['en', 'French toast'],
    ['de', 'Arme Ritter'],
  ]) {
    configureLanguage(catalog(language), language);
    state.query = query;
    const found = createCatalog(state);
    const eggs = found.visibleRecipes().find((recipe) => recipe.id === 'eggs-generator');
    assert.ok(eggs);
    // The card opens the chapter on the dish that was searched for.
    assert.equal(found.searchedDish(eggs).name, 'Французские тосты');
  }
  state.query = 'Eier';
  assert.equal(createCatalog(state).searchedDish(recipeById['eggs-generator']), null);
  configureLanguage(catalog('de'), 'de');
  state.view = 'pantry';
  state.query = 'Weißkohl';
  assert.match(renderPantry({ state, catalog: createCatalog(state) }), /data-id="freshCabbage"/);
});

test('Adjacent template fields preserve the complete quantity rather than splitting its digits', () => {
  for (const language of ['en', 'de']) {
    const t = createTranslator(catalog(language), language);
    for (const amount of [600, 900, 1200]) {
      const card = localizeRecipeCard(
        buildRecipeCard(recipeById['cabbage-stew'], { packSizes: { freshCabbage: amount } }),
        t,
        language,
      );
      const ingredient = card.ingredients.find((item) => item.id === 'freshCabbage');
      assert.ok(
        ingredient.package.includes(new Intl.NumberFormat(language).format(amount)),
        ingredient.package,
      );
    }
  }
});
