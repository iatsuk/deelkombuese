import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, recipeById } from '../src/data.js';
import { prepareRecipe, recipeSteps, normalizeSelection } from '../src/model.js';
import { stepDuration } from '../src/cooking-guide.js';
import { renderCookingMode, clock } from '../src/ui/cooking-mode.js';

test('A step names its cooking time; a variant total is not one', () => {
  assert.deepEqual(stepDuration('Тушите 12–15 минут до мягкости капусты.'), {
    from: 12,
    to: 15,
    unit: 'min',
    seconds: 720,
  });
  assert.deepEqual(stepDuration('Прогрейте около 20 секунд.'), {
    from: 20,
    to: 20,
    unit: 'sec',
    seconds: 20,
  });
  assert.equal(stepDuration('Для варианта на 18 минут выбирайте быстрый текстурат.'), null);
  assert.equal(stepDuration('Съешьте сразу.'), null);
  assert.equal(clock(754), '12:34');
  assert.equal(clock(-3), '0:00');
});

test('Every timed step of every dish starts a sensible timer', () => {
  let timed = 0;
  for (const recipe of recipes) {
    const variants = recipe.generator
      ? (recipe.generator.dishes || []).map((dish) => {
          const choices = { [recipe.generator.choiceKey]: dish.base };
          return [choices, normalizeSelection(recipe, choices, dish.modules)];
        })
      : [[{}, []]];
    for (const [choices, modules] of variants)
      for (const step of recipeSteps(recipe, choices, modules)) {
        const duration = stepDuration(step);
        if (!duration) continue;
        timed++;
        assert.ok(duration.seconds >= 10 && duration.seconds <= 30 * 60, step);
        assert.ok(duration.to >= duration.from, step);
      }
  }
  assert.ok(timed > 100);
});

test('Cooking mode lays out the ingredients, then one step per screen with its timer', () => {
  const braise = recipeById['braise-generator'];
  const choices = { technique: 'cabbage' };
  const prepared = prepareRecipe(braise, choices, {}, null, ['rice']);
  const steps = recipeSteps(braise, choices, ['rice'], prepared);
  const screen = (index, timers = {}) =>
    renderCookingMode({ title: prepared.title, prepared, steps, index, timers, now: 0 });
  assert.match(screen(0), /Подготовьте/);
  assert.match(screen(0), /Вода на готовку/);
  assert.match(screen(0), /disabled/);
  const timed = steps.findIndex((step) => stepDuration(step)) + 1;
  assert.match(screen(timed), new RegExp(`Шаг ${timed} из ${steps.length}`));
  assert.match(screen(timed), /data-stove="timer"/);
  assert.match(screen(timed, { [timed]: { running: false, remaining: 0 } }), /Время вышло/);
  // A running timer of another step stays reachable from every screen.
  assert.match(screen(1, { [timed]: { running: true, endsAt: 90000 } }), /data-stove="go"/);
  assert.match(screen(steps.length), /data-stove="close">Готово/);
});
