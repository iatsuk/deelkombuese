import { productById, recipeMigrations } from './data.js';
import {
  generatorProfile,
  generatorDefaults,
  generatorWater,
  generatorTitle,
  generatorDish,
  generatorIssues,
  generatedSteps,
} from './generator-engine.js';
import { absorptionWater, guidedGrainSteps } from './cooking-guide.js';

export function migrateRecipeEntry(entry) {
  const migration = recipeMigrations[entry.recipeId];
  if (!migration) return entry;
  // A substitution keyed by a former ingredient moves to the ingredient that took its place.
  const renamed = Object.entries(entry.choices || {}).map(([key, value]) => [
    migration.choiceMap?.[key] || key,
    value,
  ]);
  const choices = { ...(migration.choices || {}), ...Object.fromEntries(renamed) };
  if (entry.recipeId === 'pasta-milk' && entry.choices?.milkPowder)
    choices.cream = entry.choices.milkPowder;
  // A module that was split in the generator maps to several modules there.
  const modules = (Array.isArray(entry.modules) ? entry.modules : []).flatMap(
    (id) => migration.moduleMap?.[id] || [id],
  );
  return {
    ...entry,
    recipeId: migration.recipeId,
    choices,
    modules: [...new Set([...migration.modules, ...modules])],
  };
}
export function recipeHasMeal(recipe, meal) {
  return meal === 'all' || recipe.mealTags.includes(meal);
}
export function recipeHasBase(recipe, base) {
  if (base === 'all' || recipe.base === base) return true;
  const ids = recipeProductIds(recipe);
  return base === 'legumes'
    ? ['lentils', 'beans', 'chickpeas'].some((id) => ids.includes(id))
    : ids.includes(base);
}
export function filterRecipes(
  items,
  { meal = 'all', base = 'all', kind = 'all', mode = 'sea' } = {},
) {
  return items.filter(
    (recipe) =>
      (mode === 'shore' || !recipe.shore) &&
      recipeHasMeal(recipe, meal) &&
      recipeHasBase(recipe, base) &&
      (kind === 'all' || recipe.kind === kind),
  );
}

export function selectedRecipeModules(recipe, ids = []) {
  const selected = [];
  for (const id of ids) {
    const module = recipe.modules?.find((m) => m.id === id);
    if (!module) continue;
    if (module.group && !module.multiple) {
      const index = selected.findIndex((m) => m.group === module.group);
      if (index >= 0) selected.splice(index, 1);
    }
    if (!selected.some((m) => m.id === id)) selected.push(module);
  }
  if (recipe.generator) selected.unshift(...generatorDefaults(recipe, selected));
  return selected;
}
export function recipeTitle(recipe, choices = {}, moduleIds = []) {
  const modules = selectedRecipeModules(recipe, moduleIds);
  if (recipe.generator) return generatorTitle(recipe, choices, modules);
  return modules.find((m) => m.title)?.title || recipe.resultTitle || recipe.title;
}
// Problems with the current generator selection, each with the option and a reason.
export function selectionIssues(recipe, choices = {}, moduleIds = []) {
  if (!recipe.generator) return [];
  return generatorIssues(
    generatorProfile(recipe, choices),
    selectedRecipeModules(recipe, moduleIds),
  );
}
// Keeps a generator selection valid: drops modules that break a rule and adds the first
// option a base requires. Used for saved favourites, links and the map.
export function normalizeSelection(recipe, choices = {}, moduleIds = []) {
  if (!recipe.generator) return moduleIds;
  let ids = moduleIds.filter((id) => recipe.modules.some((m) => m.id === id));
  for (let guard = 0; guard < 10; guard++) {
    const profile = generatorProfile(recipe, choices);
    const issue = generatorIssues(profile, selectedRecipeModules(recipe, ids))[0];
    if (!issue) break;
    if (issue.id === profile.id) ids = [...ids, profile.requires[0]];
    else ids = ids.filter((id) => id !== issue.id);
  }
  return ids;
}
// The reason an option cannot join the current generator selection, if any.
export function optionBlocked(recipe, choices = {}, moduleIds = [], optionId) {
  if (!recipe.generator || moduleIds.includes(optionId)) return null;
  const option = recipe.modules.find((m) => m.id === optionId);
  const kept = moduleIds.filter(
    (id) =>
      !option?.group ||
      option.multiple ||
      recipe.modules.find((m) => m.id === id)?.group !== option.group,
  );
  const issue = selectionIssues(recipe, choices, [...kept, optionId]).find(
    (i) => !selectionIssues(recipe, choices, kept).some((before) => before.id === i.id),
  );
  return issue?.reason || null;
}
export function effectiveIngredients(recipe, moduleIds = [], choices = null) {
  const items = [
    ...recipe.ingredients,
    ...selectedRecipeModules(recipe, moduleIds).flatMap((m) =>
      m.ingredients.map((i) => ({ ...i, moduleId: m.id })),
    ),
  ];
  // A generator technique can rule out a substitute: crispbread does not soak up egg.
  const excluded = choices && recipe.generator && generatorProfile(recipe, choices).noSubstitutes;
  return excluded
    ? items.map((i) => ({
        ...i,
        alternatives: i.alternatives.filter((a) => !excluded.includes(a.id)),
      }))
    : items;
}

export function resolveIngredient(ingredient, chosenId) {
  return ingredient.alternatives.find((a) => a.id === chosenId) || ingredient;
}
export function availableRecipe(recipe, pantry, moduleIds = []) {
  const inventory = new Set(pantry);
  return effectiveIngredients(recipe, moduleIds).every(
    (i) => inventory.has(i.id) || i.alternatives.some((a) => inventory.has(a.id)),
  );
}
export function missingIngredients(recipe, pantry) {
  const inventory = new Set(pantry);
  return recipe.ingredients.filter(
    (i) => !inventory.has(i.id) && !i.alternatives.some((a) => inventory.has(a.id)),
  );
}

export function prepareRecipe(
  recipe,
  choices = {},
  packSizes = {},
  anchorId = null,
  moduleIds = [],
) {
  const modules = selectedRecipeModules(recipe, moduleIds);
  const resolved = effectiveIngredients(recipe, moduleIds, choices).map((i) => ({
    ...resolveIngredient(i, choices[i.id]),
    originalId: i.id,
    moduleId: i.moduleId,
  }));
  const packaged = resolved.filter((i) => productById[i.id].packages);
  const selectedPack = (i) => {
    const packs = productById[i.id].packages;
    return (
      packs.find((p) => p.size === Number(packSizes[i.id] ?? recipe.defaultPacks?.[i.id])) ||
      packs[0]
    );
  };
  const anchor =
    packaged.find((i) => i.id === anchorId) ||
    packaged.find((i) => i.id === 'passata') ||
    packaged[0];
  let scale = 1;
  if (anchor) {
    const pack = selectedPack(anchor);
    const reference =
      anchor.unit === 'уп.' ? productById[anchor.id].packages[0].edible : anchor.amount;
    scale = pack.edible / reference;
  }
  const ingredients = resolved.map((i) => {
    const product = productById[i.id];
    if (product.packages) {
      const pack = selectedPack(i);
      return { ...i, amount: pack.edible, unit: pack.unit, package: { ...pack, count: 1 } };
    }
    const scaled = i.amount * scale;
    let amount = Number(scaled.toFixed(2));
    if (i.unit === 'шт.' || i.unit === 'зубчик') amount = Math.max(1, Math.round(scaled));
    else if ((i.unit === 'г' || i.unit === 'мл') && scaled >= 20)
      amount = Math.round(scaled / 5) * 5;
    else if (i.unit === 'ч. л.') amount = Math.max(0.125, Math.round(scaled * 8) / 8);
    return { ...i, amount };
  });
  const legacyAdjustment =
    choices.tomatoPaste === 'passata' ? -100 : choices.tomatoPaste === 'tomato' ? -150 : 0;
  const hasTomatoAdjustment = resolved.some(
    (i) => i.originalId === 'tomatoPaste' && Number.isFinite(i.waterDelta),
  );
  const adjustment =
    resolved.reduce((sum, i) => sum + (i.waterDelta || 0), 0) +
    (hasTomatoAdjustment ? 0 : legacyAdjustment) +
    modules.reduce((sum, m) => sum + (m.waterDelta || 0), 0);
  const extraWater = resolved.reduce((sum, i) => sum + (i.waterExtra || 0) * scale, 0);
  const generated = recipe.generator
    ? generatorWater(recipe, choices, ingredients, modules, scale)
    : null;
  const water =
    generated?.water ??
    absorptionWater(recipe, ingredients, extraWater) ??
    Math.max(
      (recipe.minWater || 0) * scale,
      Math.round((recipe.water + adjustment) * scale + extraWater),
    );
  const unitMass = { carrot: 100, onion: 80, garlic: 4, eggs: 55, eggsCold: 55 };
  let weight = ingredients.reduce(
    (sum, i) =>
      sum +
      (i.package
        ? i.package.edible
        : i.unit === 'г' || i.unit === 'мл'
          ? i.amount
          : i.unit === 'шт.' || i.unit === 'зубчик'
            ? i.amount * (unitMass[i.id] || 70)
            : i.amount * 4),
    0,
  );
  weight += water * (recipe.vessel === 'cold' ? 0 : 0.7);
  return {
    ingredients,
    title: recipeTitle(recipe, choices, moduleIds),
    generator: generated,
    anchorId: anchor?.id || null,
    scale,
    water,
    yieldGrams: Math.max(10, Math.round(weight / 10) * 10),
    packaged,
    modules,
    meal: modules.find((m) => m.meal)?.meal || recipe.meal,
    // A generator dish or base may be more or less filling than the chapter as a whole.
    satiety:
      (generated &&
        (generatorDish(recipe, generated.profile, modules)?.satiety ||
          generated.profile.satiety)) ||
      recipe.satiety,
    time:
      (generated?.profile.time ?? recipe.time) +
      resolved.reduce((n, i) => n + (i.timeDelta || 0), 0) +
      modules.reduce((n, m) => n + (m.extraMinutes || 0), 0),
    active:
      (generated?.profile.active ?? recipe.active) +
      modules.reduce((n, m) => n + (m.extraActive || 0), 0),
    shore:
      recipe.shore ||
      modules.some((m) => m.shore) ||
      ingredients.some((i) => productById[i.id].state === 'shore'),
    eggConditional: ingredients.some((i) => ['eggs', 'eggsCold'].includes(i.id)),
    prepWater:
      Math.round((recipe.prepWater || 0) * scale) +
      (ingredients.some((i) => ['rice', 'lentils'].includes(i.id)) ? 100 : 0) +
      Math.round(
        modules.reduce(
          (n, m) =>
            n +
            (m.prepWater || 0) *
              (m.prepWaterProduct
                ? (ingredients.find((i) => i.id === m.prepWaterProduct)?.amount || 0) /
                  m.prepWaterReference
                : scale),
          0,
        ),
      ),
  };
}

export function shoppingItems(plan, pantry, manual = []) {
  const inventory = new Set(pantry);
  const lines = new Map();
  const add = (item, multiplier = 1) => {
    if (!productById[item.id] || inventory.has(item.id)) return;
    const pack = item.package;
    const unit = pack ? 'уп.' : item.unit;
    const key = pack ? `${item.id}:уп.:${pack.size}${pack.unit}` : `${item.id}:${unit}`;
    const line = lines.get(key) || {
      id: item.id,
      amount: 0,
      unit,
      key,
      ...(pack ? { package: { ...pack } } : {}),
    };
    line.amount +=
      (pack ? (item.unit === 'уп.' ? item.amount : pack.count || 1) : item.amount) * multiplier;
    lines.set(key, line);
  };
  for (const entry of plan)
    for (const ingredient of entry.ingredients) add(ingredient, entry.count);
  for (const item of manual) add(item);
  return [...lines.values()];
}
export function formatAmount(amount, unit) {
  if (unit === 'ч. л.') {
    const fractions = {
      0.125: '⅛',
      0.25: '¼',
      0.375: '⅜',
      0.5: '½',
      0.625: '⅝',
      0.75: '¾',
      0.875: '⅞',
    };
    const fraction = fractions[Number((amount % 1).toFixed(3))];
    if (fraction) return `${Math.floor(amount) || ''}${fraction} ${unit}`;
  }
  return `${Number(amount.toFixed(2)).toLocaleString('ru-RU')} ${unit}`;
}
export function formatShoppingAmount(item) {
  return item.package
    ? `${item.amount} уп. × ${formatAmount(item.package.size, item.package.unit)}`
    : formatAmount(item.amount, item.unit);
}

export function recipeSteps(recipe, choices = {}, moduleIds = [], prepared = null) {
  if (recipe.generator)
    return generatedSteps(recipe, prepared || prepareRecipe(recipe, choices, {}, null, moduleIds));
  const calculated = prepared || prepareRecipe(recipe, choices, {}, null, moduleIds);
  if (recipe.grainCooking) return guidedGrainSteps(recipe, calculated);
  const hydration = calculated.ingredients
    .filter((i) => i.id === 'soy' && i.waterExtra)
    .reduce((sum, i) => sum + i.waterExtra * calculated.scale, 0);
  const steps = recipe.steps.map((original, index) => {
    let step = original;
    if (choices.tomatoPaste === 'passata') {
      step = step.replace(/томатную пасту/g, 'всю пассату из выбранной упаковки');
      if (/^[^.]*пассату[^.]*\./.test(step) && /^[^.]*[Пп]рогрейте/.test(step)) {
        step = step.replace(
          /^[^.]*\./,
          'Прогрейте масло и ароматическую основу. Влейте всю пассату из выбранной упаковки; жидкие томаты не обжаривают как концентрат.',
        );
      }
    }
    if (choices.tomatoPaste === 'ketchup')
      step = step.replace(/томатную пасту/g, 'выбранный кетчуп');
    if (choices.tomatoPaste === 'tomato')
      step = step.replace(/томатную пасту/g, 'нарезанные свежие томаты');
    if (index === 0 && choices.carrot === 'driedCarrot')
      step =
        'Восстановите сушёную морковь: быстро восстанавливаемые хлопья пойдут с водой, обычным кусочкам нужно предварительное замачивание. Прогрейте масло и ароматическую основу; морковь добавьте с крупой и водой.';
    if (choices.aromatics === 'onion') {
      step = step.replace(/сухую смесь/g, 'обжаренный нарезанный лук');
      if (index === 0) step = 'Сначала нарежьте лук и обжарьте 3–5 минут. ' + step;
    }
    const tomatoBase = recipe.ingredients.find((i) =>
      ['passata', 'tomato', 'ketchup'].includes(i.id),
    );
    if (tomatoBase?.id === 'passata' && choices.passata === 'tomatoPaste')
      step = step.replace(/пассату/g, 'томатную пасту, разведённую рассчитанной водой');
    if (tomatoBase?.id === 'passata' && choices.passata === 'ketchup')
      step = step.replace(/пассату/g, 'кетчуп с рассчитанной водой');
    if (tomatoBase?.id === 'passata' && choices.passata === 'tomato')
      step = step.replace(/пассату/g, 'нарезанные свежие томаты');
    return step;
  });
  const result = hydration
    ? [
        `До начала готовки восстановите быстрый соевый текстурат по пачке. На это отберите около ${Math.round(hydration)} мл из рассчитанного общего объёма воды. Для самой основы используйте оставшуюся воду; при другом соотношении на пачке скорректируйте расчёт.`,
      ]
    : [];
  const modules = selectedRecipeModules(recipe, moduleIds);
  if (hydration)
    for (let n = 0; n < steps.length; n++)
      steps[n] = steps[n].replace(/рассчитанную воду/g, 'оставшуюся воду из расчётного объёма');
  for (let n = 0; n < steps.length; n++) {
    result.push(...modules.filter((m) => m.beforeStep === n).map((m) => m.instruction));
    result.push(steps[n]);
  }
  result.push(...modules.filter((m) => m.beforeStep === undefined).map((m) => m.instruction));
  return result;
}

export function recipeProductIds(recipe, includeModules = true) {
  const ingredients = [
    ...recipe.ingredients,
    ...(includeModules ? (recipe.modules || []).flatMap((m) => m.ingredients) : []),
  ];
  return [...new Set(ingredients.flatMap((i) => [i.id, ...i.alternatives.map((a) => a.id)]))];
}
export function recipeMatches(recipe, selectedIds = []) {
  if (!selectedIds.every((id) => recipeProductIds(recipe).includes(id))) return false;
  const inferred = choicesForSelection(recipe, selectedIds);
  const ids = effectiveIngredients(recipe, inferred.modules).map(
    (i) => resolveIngredient(i, inferred.choices[i.id]).id,
  );
  return selectedIds.every((id) => ids.includes(id));
}
export function choicesForSelection(recipe, selectedIds = [], pantry = []) {
  const modules = [];
  const choices = {};
  for (const id of selectedIds) {
    if (!recipe.ingredients.some((i) => i.id === id || i.alternatives.some((a) => a.id === id))) {
      const module = recipe.modules?.find((m) =>
        m.ingredients.some((i) => i.id === id || i.alternatives.some((a) => a.id === id)),
      );
      if (module) modules.push(module.id);
    }
  }
  for (const i of effectiveIngredients(recipe, modules)) {
    const chosen =
      selectedIds.find((id) => id === i.id || i.alternatives.some((a) => a.id === id)) ||
      (!pantry.includes(i.id) && i.alternatives.find((a) => pantry.includes(a.id))?.id);
    if (chosen && chosen !== i.id) choices[i.id] = chosen;
  }
  const unique = [...new Set(modules)];
  // A generator takes the first base that keeps every inferred option within its rules.
  if (recipe.generator) {
    const { bases, choiceKey } = recipe.generator;
    const inferred = bases.find((base) => base.id === choices[choiceKey]);
    for (const base of inferred ? [inferred] : bases) {
      const candidate = { ...choices, [choiceKey]: base.id };
      const valid = normalizeSelection(recipe, candidate, unique);
      if (
        unique.every((id) => valid.includes(id)) &&
        !selectionIssues(recipe, candidate, valid).length
      )
        return { choices: candidate, modules: valid };
    }
    return { choices, modules: normalizeSelection(recipe, choices, unique) };
  }
  return { choices, modules: unique };
}
export function storageDays(value) {
  const text = String(value).toLowerCase();
  const match = text.match(/\d+(?:[.,]\d+)?/);
  if (!match) return 0;
  const n = Number(match[0].replace(',', '.'));
  if (/мес/.test(text)) return n * 30;
  if (/нед/.test(text)) return n * 7;
  if (/дн|день/.test(text)) return n;
  if (/ч(?:\s|\s*\/|$)/.test(text)) return n / 24;
  return n;
}
export function sortProducts(items, key = 'name', direction = 'asc', pantry = []) {
  const value = (p) =>
    key === 'closed'
      ? storageDays(p.life)
      : key === 'after'
        ? storageDays(p.afterLife)
        : key === 'satiety'
          ? p.satiety === 'Добавка'
            ? Infinity
            : parseFloat(p.satiety)
          : key === 'owned'
            ? pantry.includes(p.id)
              ? 1
              : 0
            : p.name;
  return [...items].sort((a, b) => {
    const av = value(a),
      bv = value(b);
    const result =
      typeof av === 'string' ? av.localeCompare(bv, 'ru') : av === bv ? 0 : av > bv ? 1 : -1;
    return (direction === 'desc' ? -1 : 1) * result || a.name.localeCompare(b.name, 'ru');
  });
}
