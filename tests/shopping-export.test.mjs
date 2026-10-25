import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildShoppingText } from '../src/export/shopping-list.js';
import { buildTrip, buildSeason, waterBudget } from '../src/planner.js';
import { createTranslator } from '../src/i18n/messages.js';
import { shoppingItems, prepareRecipe } from '../src/model.js';
import { recipeById } from '../src/data.js';

test('Shopping exports translate trip menus, measured water, checked products and whole packs without changing inputs', () => {
  const trip = buildTrip({ days: 3 });
  const input = {
    plan: trip.entries,
    items: trip.items,
    builderMeta: { kind: 'trip', days: 3 },
    checked: [trip.items[0].key],
  };
  const before = JSON.stringify(input);
  for (const language of ['en', 'de']) {
    const translate = createTranslator(
      JSON.parse(readFileSync(`locales/${language}.json`)),
      language,
    );
    const text = buildShoppingText(input, { translate, language });
    assert.ok(!/[А-Яа-яЁё]/u.test(text), text);
    assert.match(text, /\[x\]/);
    assert.match(text, /×/);
    assert.ok(text.includes(language === 'en' ? 'WATER FOR 3 DAYS' : 'WASSER FÜR 3 TAGE'));
    const budget = waterBudget(input.plan, input.builderMeta);
    assert.ok(text.includes(`${budget.bottles} ×`));
    assert.ok(text.includes(language === 'en' ? 'Breakfast:' : 'Frühstück:'));
  }
  assert.equal(JSON.stringify(input), before);
});
test('Seasonal replenishment and manually added configured dishes remain translated in shopping exports', () => {
  const season = buildSeason(90, []);
  const extra = { recipeId: 'cabbage-stew', modules: ['rice', 'meat'], count: 1 };
  for (const language of ['en', 'de']) {
    const translate = createTranslator(
      JSON.parse(readFileSync(`locales/${language}.json`)),
      language,
    );
    const text = buildShoppingText(
      { items: season.items, plan: [extra], builderMeta: { kind: 'season', days: 90 } },
      { translate, language },
    );
    assert.ok(!/[А-Яа-яЁё]/u.test(text), text);
    assert.ok(
      text.includes(language === 'en' ? 'Unstuffed cabbage rolls' : 'Kohlrouladen ohne Wickeln'),
    );
    const manual = buildShoppingText(
      {
        items: shoppingItems(
          [{ ...prepareRecipe(recipeById[extra.recipeId], {}, {}, null, extra.modules), count: 1 }],
          [],
          [{ id: 'freshCabbage', amount: 1, unit: 'уп.' }],
        ),
        plan: [extra],
      },
      { translate, language },
    );
    assert.ok(!/[А-Яа-яЁё]/u.test(manual), manual);
  }
});
