import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { generators, recipeById, recipeMigrations } from '../src/data.js';
import { dishSlug } from '../src/generator-engine.js';
import {
  prepareRecipe,
  recipeSteps,
  selectionIssues,
  normalizeSelection,
  migrateRecipeEntry,
} from '../src/model.js';

// Every base with each combination of single-choice groups, as a chapter page offers them.
function combinations(recipe) {
  const groups = [
    ...new Set(recipe.modules.filter((m) => m.group && !m.multiple).map((m) => m.group)),
  ].map((group) => [null, ...recipe.modules.filter((m) => m.group === group).map((m) => m.id)]);
  const sets = groups.reduce(
    (all, options) => all.flatMap((set) => options.map((id) => (id ? [...set, id] : set))),
    [[]],
  );
  return recipe.generator.bases.flatMap((base) =>
    sets.map((modules) => ({ choices: { [recipe.generator.choiceKey]: base.id }, modules })),
  );
}

test('Every valid combination of every chapter is cookable with whole packs', () => {
  for (const recipe of generators) {
    let valid = 0;
    for (const { choices, modules } of combinations(recipe)) {
      if (selectionIssues(recipe, choices, modules).length) continue;
      valid++;
      const prepared = prepareRecipe(recipe, choices, {}, null, modules);
      const label = `${recipe.id} ${prepared.title}`;
      assert.ok(Number.isFinite(prepared.water) && prepared.water >= 0, label);
      assert.ok(prepared.time >= prepared.active, label);
      const ids = prepared.ingredients.map((i) => i.id);
      assert.equal(new Set(ids).size, ids.length, label);
      for (const item of prepared.ingredients)
        if (item.package) assert.equal(item.amount, item.package.edible, label);
      assert.ok(recipeSteps(recipe, choices, modules, prepared).length >= 2, label);
      assert.ok(prepared.satiety, label);
    }
    assert.ok(valid >= 5, recipe.id);
  }
});

test('Each named dish of a chapter is a valid combination that carries its name', () => {
  for (const recipe of generators)
    for (const dish of recipe.generator.dishes || []) {
      const choices = dish.base ? { [recipe.generator.choiceKey]: dish.base } : {};
      assert.deepEqual(selectionIssues(recipe, choices, dish.modules), [], dish.name);
      assert.equal(prepareRecipe(recipe, choices, {}, null, dish.modules).title, dish.name);
    }
});

test('Every dish of a chapter has its own page address', () => {
  for (const recipe of generators) {
    const slugs = (recipe.generator.dishes || []).map((dish) => dishSlug(recipe, dish));
    assert.equal(new Set(slugs).size, slugs.length, recipe.id);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9-]+$/, slug);
  }
});

test('A former recipe opens as its dish in the chapter', () => {
  for (const recipe of generators)
    for (const dish of (recipe.generator.dishes || []).filter((d) => d.legacyId)) {
      assert.equal(recipeMigrations[dish.legacyId]?.recipeId, recipe.id, dish.legacyId);
      assert.equal(recipeById[dish.legacyId], undefined, dish.legacyId);
      const { choices, modules } = migrateRecipeEntry({ recipeId: dish.legacyId });
      assert.equal(prepareRecipe(recipe, choices, {}, null, modules).title, dish.name);
    }
});

// Numbers of standalone recipes, recorded in tests/fixtures/legacy-*.json before they moved
// into a chapter: the default, each module, substitute and pack size.
const deliberate = {
  'french-toast': 'moved to the chapter portion; checked in eggs-generator.test.mjs',
  pilaf: 'one portion of 90 g rice; checked in grain-generator.test.mjs',
  paella: 'one portion of 90 g rice; checked in grain-generator.test.mjs',
  'buckwheat-stew': 'carrot takes the same time as in pilaf; checked in grain-generator.test.mjs',
};
test('Recipes folded into chapters keep their recorded numbers', () => {
  const folder = new URL('./fixtures/', import.meta.url);
  for (const file of readdirSync(folder).filter((name) => /^legacy-.+\.json$/.test(name)))
    for (const before of JSON.parse(readFileSync(new URL(file, folder), 'utf8'))) {
      if (deliberate[before.id]) continue;
      const entry = migrateRecipeEntry({
        recipeId: before.id,
        modules: before.modules,
        choices: before.choices,
        packSizes: before.packs,
      });
      const recipe = recipeById[entry.recipeId];
      const modules = normalizeSelection(recipe, entry.choices, entry.modules);
      const after = prepareRecipe(recipe, entry.choices, entry.packSizes, null, modules);
      const label = `${before.id} ${before.modules.join('+')} ${JSON.stringify(before.choices)} ${JSON.stringify(before.packs)}`;
      for (const key of ['time', 'active', 'burner', 'yieldGrams', 'shore', 'satiety'])
        if (key in before) assert.equal(after[key], before[key], `${label} ${key}`);
      // A former minimum water times the pack scale could be fractional; chapters round it.
      assert.equal(after.water, Math.round(before.water), `${label} water`);
      assert.deepEqual(
        Object.fromEntries(after.ingredients.map((i) => [i.id, `${i.amount} ${i.unit}`])),
        before.ingredients,
        label,
      );
    }
});

test('The cookbook opens the app: chapters, then standalone recipes as page links; a search narrows to cards', async () => {
  const { createAppState } = await import('../src/state/session.js');
  const { loadState } = await import('../src/state/storage.js');
  const { createCatalog } = await import('../src/ui/catalog.js');
  const { renderGenerators } = await import('../src/ui/views/generators.js');
  const { navigation } = await import('../src/ui/shell.js');
  assert.deepEqual(navigation[0], ['generators', 'Рецепты']);
  assert.equal(navigation[1][0], 'map');
  assert.ok(!navigation.some(([view]) => view === 'recipes'));
  const state = createAppState(loadState({ getItem: () => null }).saved);
  assert.equal(state.view, 'generators');
  const catalog = createCatalog(state);
  const contents = renderGenerators({ state, chapter: null, catalog });
  assert.match(contents, /<h1>Книга кока<\/h1>/);
  // Breakfast opens the book, eggs follow.
  assert.ok(contents.indexOf('#generators/breakfast"') < contents.indexOf('#generators/eggs"'));
  for (const id of ['potato-skillet', 'potato-mash'])
    assert.match(
      contents,
      new RegExp(`<a class="recipe-card[^"]*" href="recipes/${id}/" data-action="recipe"`),
    );
  state.query = 'шакшука';
  const found = renderGenerators({ state, chapter: null, catalog });
  assert.doesNotMatch(found, /chapter-list/);
  assert.match(found, /data-action="recipe" data-id="eggs-generator"/);
  assert.match(found, /data-action="reset-filters"/);
});

test('Saved favourites, plans and passage choices of the breakfast recipes load as the chapter', async () => {
  const { loadState } = await import('../src/state/storage.js');
  const stored = {
    favorites: [
      { recipeId: 'oatmeal', choices: {}, packSizes: {}, modules: ['honey', 'milkPowder'] },
      { recipeId: 'pan-muesli', choices: {}, packSizes: {}, modules: [] },
    ],
    plan: [
      { recipeId: 'pan-muesli', count: 2, choices: {}, packSizes: {}, modules: [] },
      { recipeId: 'warm-rolls', count: 1, choices: {}, packSizes: { rolls: 200 }, modules: [] },
    ],
    builderMeta: { kind: 'trip', days: 3, overrides: { '2-snack': 'nuts-raisins' } },
  };
  const { saved } = loadState({ getItem: () => JSON.stringify(stored) });
  // Porridge is the default base, so a saved selection does not record it.
  assert.deepEqual(
    saved.favorites.map((f) => [f.recipeId, f.choices.technique, f.modules.join('+')]),
    [
      ['breakfast-generator', undefined, 'honey+milkPowder'],
      ['breakfast-generator', 'muesli', ''],
    ],
  );
  assert.deepEqual(
    saved.plan.map((p) => [p.recipeId, p.choices.technique, p.count, p.packSizes.rolls]),
    [
      ['breakfast-generator', 'muesli', 2, undefined],
      ['breakfast-generator', 'rolls', 1, 200],
    ],
  );
  assert.equal(saved.builderMeta.overrides['2-snack'], 'breakfast-generator');
  const rolls = saved.plan[1];
  const prepared = prepareRecipe(
    recipeById[rolls.recipeId],
    rolls.choices,
    rolls.packSizes,
    null,
    rolls.modules,
  );
  assert.equal(prepared.title, 'Тёплые булочки на сковороде');
  assert.equal(prepared.ingredients.find((i) => i.id === 'rolls').amount, 200);
});

test('«Подкинь идею» draws from every chapter dish and standalone recipe that fits the filters', async () => {
  const { createAppState } = await import('../src/state/session.js');
  const { loadState } = await import('../src/state/storage.js');
  const { createCatalog } = await import('../src/ui/catalog.js');
  const { renderGenerators } = await import('../src/ui/views/generators.js');
  const state = createAppState(loadState({ getItem: () => null }).saved);
  const catalog = createCatalog(state);
  assert.match(renderGenerators({ state, chapter: null, catalog }), /data-action="idea"/);
  const all = catalog.ideaCandidates();
  for (const recipe of generators)
    assert.ok(
      all.some((idea) => idea.recipeId === recipe.id),
      recipe.id,
    );
  assert.ok(all.some((idea) => idea.recipeId === 'potato-skillet'));
  // At sea, a dish that needs shore products is not suggested.
  assert.ok(!all.some((idea) => idea.shore));
  state.mode = 'shore';
  assert.ok(catalog.ideaCandidates().some((idea) => idea.shore));
  state.mode = 'sea';
  state.meal = 'breakfast';
  assert.ok(
    catalog
      .ideaCandidates()
      .every(
        (idea) =>
          recipeById[idea.recipeId].mealTags.includes('breakfast') ||
          recipeById[idea.recipeId].meal === 'breakfast',
      ),
  );
  state.meal = 'all';
  state.quick = true;
  for (const idea of catalog.ideaCandidates())
    assert.ok(
      prepareRecipe(recipeById[idea.recipeId], idea.choices, {}, null, idea.modules).time <= 20,
    );
  state.quick = false;
  state.pantryOnly = true;
  assert.deepEqual(catalog.ideaCandidates(), []);
});

test('The flavour map dims chips that no longer lead to a dish; ideas follow search and favourites', async () => {
  const { createAppState } = await import('../src/state/session.js');
  const { loadState } = await import('../src/state/storage.js');
  const { createCatalog } = await import('../src/ui/catalog.js');
  const { renderMap } = await import('../src/ui/views/map.js');
  const state = createAppState(loadState({ getItem: () => null }).saved, '#map');
  const catalog = createCatalog(state);
  const chips = (markup) => markup.match(/class="map-chip"/g).length;
  const before = chips(renderMap({ state, catalog }));
  state.graphSelected = ['rice'];
  const narrowed = renderMap({ state, catalog });
  assert.equal(chips(narrowed), before);
  assert.match(narrowed, /data-id="pasta" aria-pressed="false" disabled/);
  assert.match(narrowed, /Найдено:/);
  assert.doesNotMatch(narrowed, /graph-unavailable|network-lines|visual-start/);
  state.view = 'generators';
  state.route = { view: 'generators', slug: null };
  state.graphSelected = [];
  state.query = 'шакшука';
  assert.ok(catalog.ideaCandidates().every((idea) => idea.name.startsWith('Шакшука')));
  state.query = '';
  state.favoritesOnly = true;
  state.favorites = [
    {
      recipeId: 'breakfast-generator',
      choices: { technique: 'muesli' },
      packSizes: {},
      modules: [],
    },
  ];
  assert.deepEqual(
    catalog.ideaCandidates().map((idea) => [idea.recipeId, idea.choices.technique]),
    [['breakfast-generator', 'muesli']],
  );
});
