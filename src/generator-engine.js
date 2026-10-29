// Generic engine for recipes with a `generator` definition. A generator keeps one cooking
// principle while its base, sauce and fillings change: each base carries its own technique,
// water and time; definitions supply names, compatibility rules and phase-ordered steps.

// Share of a sauce ingredient that counts as cooking liquid.
const sauceFractions = {
  tomatoPaste: 0.7,
  passata: 0.9,
  tomato: 0.9,
  ketchup: 0.7,
  cream: 0.6,
  milk: 0.9,
};

// The base is chosen through the alternatives of one core ingredient (`choiceKey`).
export function generatorProfile(recipe, choices = {}) {
  const { bases, choiceKey } = recipe.generator;
  return bases.find((base) => base.id === choices[choiceKey]) || bases[0];
}

// Modules that stand in when their group has no selection, e.g. a plain water/broth sauce.
export function generatorDefaults(recipe, selected) {
  const defaults = [];
  for (const id of recipe.generator?.defaultModules || []) {
    const module = recipe.modules.find((m) => m.id === id);
    if (module && !selected.some((m) => m.group === module.group)) defaults.push(module);
  }
  return defaults;
}

export function generatorWater(recipe, choices, ingredients, modules, scale) {
  const profile = generatorProfile(recipe, choices);
  const sauce = modules.find((m) => m.group === 'sauce');
  const sauceWater = ingredients
    .filter((i) => i.moduleId === sauce?.id)
    .reduce((sum, i) => sum + i.amount * (sauceFractions[i.id] || 0), 0);
  const hydration = ingredients
    .filter((i) => i.id === 'soy')
    .reduce((sum, i) => sum + i.amount * 2.5, 0);
  const moduleWater = modules.reduce((sum, m) => sum + (m.waterDelta || 0), 0) * scale;
  // Water on top of a whole sauce: a substitute keeps the sauce's liquid, so diluting
  // tomato paste adds the water the passata would have brought.
  const substitutes = recipe.generator.substitutesKeepLiquid
    ? ingredients.reduce((sum, i) => sum + (i.waterDelta || 0) + (i.waterExtra || 0), 0) * scale
    : null;
  // Potatoes soften before acidic sauces go in, so their water is not reduced by the sauce.
  // Modules that cook in their own water (a side of rice, a curry sauce) add it on top.
  const cooking =
    substitutes === null
      ? Math.max(
          (profile.minWater || 0) * scale,
          (profile.water || 0) * scale - (profile.sauceCredit === false ? 0 : sauceWater),
        ) + moduleWater
      : Math.max(
          (profile.minWater || 0) * scale,
          (profile.water || 0) * scale + moduleWater + substitutes,
        );
  return { water: Math.round(cooking + hydration), hydrationWater: Math.round(hydration), profile };
}

// A named dish matches when its base and every listed module are selected; the most specific wins.
export function generatorDish(recipe, profile, modules) {
  const ids = new Set(modules.map((m) => m.id));
  const matches = (recipe.generator.dishes || []).filter(
    (dish) =>
      (!dish.base || dish.base === profile.id) && (dish.modules || []).every((id) => ids.has(id)),
  );
  const weight = (dish) => (dish.base ? 1 : 0) + (dish.modules || []).length;
  return matches.reduce((best, dish) => (!best || weight(dish) > weight(best) ? dish : best), null);
}

function moduleTitle(module, choices) {
  for (const [ingredientId, labels] of Object.entries(module.titleByChoice || {}))
    if (labels[choices[ingredientId]]) return labels[choices[ingredientId]];
  return module.titleLabel || module.shortLabel;
}

export function generatorTitle(recipe, choices, modules) {
  const profile = generatorProfile(recipe, choices);
  const dish = generatorDish(recipe, profile, modules);
  if (dish) return dish.name;
  const sauce = modules.find((m) => m.group === 'sauce');
  return sauce ? profile.label + ' · ' + moduleTitle(sauce, choices) : profile.label;
}

// Options may require one of several other options or exclude some; each rule has a reason.
export function generatorIssues(profile, modules) {
  const ids = new Set([profile.id, ...modules.map((m) => m.id)]);
  return [profile, ...modules].flatMap((option) => {
    const missing = option.requires && !option.requires.some((id) => ids.has(id));
    const conflict = option.excludes?.some((id) => ids.has(id));
    return missing || conflict ? [{ id: option.id, reason: option.reason }] : [];
  });
}

export function generatedSteps(recipe, prepared) {
  const { profile, hydrationWater } = prepared.generator;
  const modules = prepared.modules;
  const context = {
    prepared,
    profile,
    base: profile.id,
    sauce: modules.find((m) => m.group === 'sauce'),
    modules,
    moduleIds: new Set(modules.map((m) => m.id)),
    ids: new Set(prepared.ingredients.map((i) => i.id)),
    hydrationWater,
    cookingWater: prepared.water - hydrationWater,
  };
  const phases = recipe.generator.phases;
  const entries = [
    ...recipe.generator.steps,
    ...(profile.steps || []),
    ...modules.flatMap((m) => m.steps || []),
  ].sort((a, b) => phases.indexOf(a.phase) - phases.indexOf(b.phase));
  return entries.flatMap((entry) => {
    if (entry.when && !entry.when(context)) return [];
    const text = typeof entry.text === 'function' ? entry.text(context) : entry.text;
    return [text].flat().filter(Boolean);
  });
}

// Passage profiles are keyed by day (pasta dinners rotate) or by meal (eggs at breakfast).
export function tripProfile(recipe, day, slot) {
  const profiles = recipe.generator?.tripProfiles;
  return profiles ? profiles[day] || profiles[slot] || profiles.default : null;
}
