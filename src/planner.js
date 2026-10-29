import { productById, recipes, recipeById } from './data.js';
import {
  prepareRecipe,
  shoppingItems,
  recipeProductIds,
  storageDays,
  recipeHasMeal,
  recipeTitle,
  normalizeSelection,
} from './model.js';
import { tripProfile } from './generator-engine.js';

const breakfast = [
  'oatmeal',
  'fritters',
  'bread-peanut',
  'oat-fritters',
  'savory-oats',
  'pan-muesli',
  'oatmeal',
];
const lunch = [
  'buckwheat-peas',
  'tomato-pack-soup',
  'broth-soup',
  'rice-corn',
  'soup',
  'cabbage-soup',
  'couscous',
];
const dinner = [
  'dish-generator',
  'potato-skillet',
  'dish-generator',
  'chili-sin',
  'dish-generator',
  'dal',
  'dish-generator',
];
export const mealSlots = [
  ['breakfast', 'Завтрак'],
  ['lunch', 'Обед'],
  ['dinner', 'Ужин'],
  ['snack', 'Перекус'],
];
const clamp = (n, min, max, fallback) =>
  Number.isFinite(Number(n)) ? Math.min(max, Math.max(min, Number(n))) : fallback;

export function tripCandidates(slot, day, includeEggs = false) {
  return recipes
    .filter(
      (r) =>
        !r.shore &&
        (!r.eggConditional || (includeEggs && day <= 2)) &&
        recipeHasMeal(r, slot === 'snack' ? 'snack' : slot === 'breakfast' ? 'breakfast' : 'main'),
    )
    .map((r) => r.id);
}
function tripEntry(recipe, day, slot, includeEggs) {
  const choices = {};
  const modules = [];
  for (const i of recipe.ingredients) {
    const preferred =
      i.id === 'carrot'
        ? 'driedCarrot'
        : i.id === 'aromatics'
          ? 'driedOnion'
          : i.id === 'onion'
            ? 'driedOnion'
            : i.id === 'garlic'
              ? 'driedGarlic'
              : i.id === 'ginger'
                ? 'driedGinger'
                : i.id === 'milk'
                  ? 'milkPowder'
                  : i.id === 'bread' && !(includeEggs && day === 1)
                    ? 'crispbread'
                    : null;
    if (preferred && i.alternatives.some((a) => a.id === preferred)) choices[i.id] = preferred;
  }
  if (recipe.id === 'fritters' && slot === 'breakfast') modules.push('honey');
  if (recipe.id === 'oat-fritters' && slot === 'breakfast') modules.push('sweet');
  const profile = tripProfile(recipe, day, slot);
  if (profile) {
    modules.push(...profile.modules);
    Object.assign(choices, profile.choices);
  }
  if (recipe.id === 'potato-skillet') modules.push('beans');
  if (recipe.id === 'cabbage-soup') modules.push('rinse');
  if (recipe.id === 'broth-soup') modules.push('fish');
  if (slot === 'lunch' && day % 2 === 1 && recipe.modules.some((m) => m.id === 'bouillon'))
    modules.push('bouillon');
  if (recipe.modules.some((m) => m.id === 'seasoning') && !modules.includes('bouillon'))
    modules.push('seasoning');
  return {
    key: `trip-${day}-${slot}`,
    recipeId: recipe.id,
    day,
    slot,
    count: 1,
    choices,
    packSizes: {},
    anchorId: null,
    // Generator rules drop what does not fit, e.g. salt on French toast with honey.
    modules: normalizeSelection(recipe, choices, modules),
    source: 'builder',
  };
}
export function waterBudget(entries, options = {}) {
  const days = clamp(options.days, 1, 7, 1);
  const drinking = days * clamp(options.drinkLitres, 2, 8, 3);
  const washing = days * clamp(options.washLitres, 0, 10, 1.5);
  let cooking = 0,
    preparation = 0;
  for (const entry of entries) {
    const recipe = recipeById[entry.recipeId];
    if (!recipe) continue;
    const p = prepareRecipe(recipe, entry.choices, entry.packSizes, entry.anchorId, entry.modules);
    cooking += (p.water * (entry.count || 1)) / 1000;
    preparation += (p.prepWater * (entry.count || 1)) / 1000;
  }
  const subtotal = drinking + washing + cooking + preparation;
  const reserve = (subtotal * clamp(options.reservePct, 0, 100, 25)) / 100;
  const total = subtotal + reserve;
  const bottles = Math.ceil(total / 1.5);
  return {
    days,
    drinking,
    washing,
    cooking,
    preparation,
    reserve,
    total,
    bottles,
    buyLitres: bottles * 1.5,
  };
}
function requiredInRetailUnit(item) {
  const product = productById[item.id];
  if (item.unit === 'ч. л.' && product.retail?.unit === 'г') {
    const grams = {
      herbs: 1,
      chili: 2,
      salt: 6,
      pepper: 2,
      driedGarlic: 3,
      driedGinger: 2,
      curry: 2,
      cumin: 2,
      paprika: 2,
      aromatics: 3,
    };
    return { amount: item.amount * (grams[item.id] || 3), unit: 'г' };
  }
  return { amount: item.amount, unit: item.unit };
}
export function retailPurchases(items) {
  const lines = new Map();
  for (const item of items) {
    if (item.package) {
      const existing = lines.get(item.key);
      if (existing) existing.amount += item.amount;
      else lines.set(item.key, { ...item, needed: item.amount * item.package.edible, leftover: 0 });
      continue;
    }
    const product = productById[item.id];
    const need = requiredInRetailUnit(item);
    const retail = product.retail?.unit === need.unit ? product.retail : null;
    const key = retail ? `${item.id}:уп.:${retail.size}${retail.unit}` : `${item.id}:${need.unit}`;
    const existing = lines.get(key);
    if (existing) {
      existing.needed += need.amount;
      if (!retail) existing.amount += need.amount;
    } else
      lines.set(key, {
        ...item,
        key,
        unit: retail ? 'уп.' : need.unit,
        amount: retail ? 0 : need.amount,
        needed: need.amount,
        ...(retail
          ? {
              package: { size: retail.size, unit: retail.unit, edible: retail.size, count: 1 },
              retail: true,
            }
          : {}),
        leftover: 0,
      });
  }
  for (const line of lines.values())
    if (line.retail) {
      line.amount = Math.ceil((line.needed - 1e-8) / line.package.size);
      line.leftover = Math.max(0, line.amount * line.package.size - line.needed);
    }
  return [...lines.values()];
}
export function buildTrip(options = {}) {
  const days = Math.round(clamp(options.days, 1, 7, 3));
  const includeEggs = !!options.includeEggs;
  const entries = [];
  for (let day = 1; day <= days; day++) {
    const defaults = {
      breakfast: includeEggs && day === 1 ? 'eggs-generator' : breakfast[day - 1],
      lunch: includeEggs && day === 2 ? 'eggs-generator' : lunch[day - 1],
      dinner: dinner[day - 1],
      snack: includeEggs && day === 1 ? 'bread-oil' : 'nuts-raisins',
    };
    for (const [slot] of mealSlots) {
      const override = options.overrides?.[`${day}-${slot}`];
      const id = tripCandidates(slot, day, includeEggs).includes(override)
        ? override
        : defaults[slot];
      entries.push(tripEntry(recipeById[id], day, slot, includeEggs));
    }
  }
  const plan = entries.map((e) => ({
    count: e.count,
    ingredients: prepareRecipe(
      recipeById[e.recipeId],
      e.choices,
      e.packSizes,
      e.anchorId,
      e.modules,
    ).ingredients,
  }));
  const exact = shoppingItems(plan, options.pantry || []);
  const items = retailPurchases(exact);
  const uses = Object.fromEntries(
    items.map((item) => [
      item.id,
      entries
        .filter((e) =>
          prepareRecipe(
            recipeById[e.recipeId],
            e.choices,
            e.packSizes,
            e.anchorId,
            e.modules,
          ).ingredients.some((i) => i.id === item.id),
        )
        .map((e) => ({
          day: e.day,
          slot: e.slot,
          recipeId: e.recipeId,
          key: e.key,
          title: recipeTitle(recipeById[e.recipeId], e.choices, e.modules),
        })),
    ]),
  );
  return { days, entries, items, uses, water: waterBudget(entries, { ...options, days }) };
}

const seasonalRates = [
  ['flour', 30, 'г'],
  ['bakingPowder', 1, 'г'],
  ['rice', 60, 'г'],
  ['pasta', 50, 'г'],
  ['buckwheat', 30, 'г'],
  ['lentils', 25, 'г'],
  ['oats', 60, 'г'],
  ['beans', 0.3, 'уп.'],
  ['chickpeas', 0.2, 'уп.'],
  ['tuna', 0.25, 'уп.'],
  ['tomatoPaste', 1 / 3, 'уп.'],
  ['oil', 15, 'мл'],
  ['driedCarrot', 3, 'г'],
  ['driedOnion', 2, 'г'],
  ['driedGarlic', 0.5, 'г'],
  ['curry', 0.5, 'г'],
  ['cumin', 0.3, 'г'],
  ['paprika', 0.4, 'г'],
  ['salt', 3, 'г'],
  ['pepper', 0.3, 'г'],
  ['bouillon', 0.25, 'кубик'],
  ['peanuts', 20, 'г'],
  ['raisins', 15, 'г'],
  ['crispbread', 30, 'г'],
  ['peanutButter', 15, 'г'],
  ['milkPowder', 10, 'г'],
  ['honey', 10, 'г'],
];
export function buildSeason(days = 90, pantry = []) {
  days = Math.round(clamp(days, 30, 180, 90));
  const inventory = new Set(pantry);
  const needs = seasonalRates
    .filter(([id]) => !inventory.has(id))
    .map(([id, rate, unit]) => {
      const product = productById[id];
      const coverage = Math.min(days, Math.max(30, storageDays(product.life)));
      if (unit === 'уп.') {
        const pack = product.packages[0];
        return {
          id,
          amount: Math.ceil(rate * coverage),
          unit,
          key: `${id}:уп.:${pack.size}${pack.unit}`,
          package: { ...pack, count: 1 },
        };
      }
      return { id, amount: rate * coverage, unit, key: `${id}:${unit}` };
    });
  const items = retailPurchases(needs);
  for (const item of items) {
    const coverage = Math.min(days, Math.max(30, storageDays(productById[item.id].life)));
    if (coverage < days) {
      const rate = seasonalRates.find(([id]) => id === item.id);
      item.refillDays = coverage;
      item.seasonDemand = rate[1] * days;
      item.demandUnit = rate[2];
    }
  }
  const uses = Object.fromEntries(
    items.map((item) => [
      item.id,
      recipes
        .filter((r) => !r.shore && recipeProductIds(r).includes(item.id))
        .map((r) => ({ recipeId: r.id })),
    ]),
  );
  return { days, items, uses };
}
