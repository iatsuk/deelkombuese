import { normalizeFavorites } from '../preferences.js';
import { productById, recipeById, recipeMigrations } from '../data.js';
import { migrateRecipeEntry } from '../model.js';
export const storageKey = 'deelstuff-kombuese-v1';
export function getBrowserStorage(environment = globalThis) {
  try {
    return environment.localStorage;
  } catch {
    return null;
  }
}
export function loadState(storage) {
  let storageFailed = false;
  const KEY = storageKey;
  function readSaved() {
    try {
      const raw = JSON.parse(storage.getItem(KEY) || '{}');
      return {
        favorites: normalizeFavorites(raw.favorites),
        pantry: Array.isArray(raw.pantry)
          ? [
              ...new Set(
                raw.pantry.filter((id) => productById[id] && productById[id].state !== 'shore'),
              ),
            ]
          : [],
        plan: Array.isArray(raw.plan)
          ? raw.plan
              .map(migrateRecipeEntry)
              .filter((p) => recipeById[p.recipeId])
              .slice(0, 100)
              .map((p) => ({
                key: crypto.randomUUID(),
                recipeId: p.recipeId,
                count: Math.min(30, Math.max(1, parseInt(p.count) || 1)),
                choices: p.choices && typeof p.choices === 'object' ? p.choices : {},
                packSizes: p.packSizes && typeof p.packSizes === 'object' ? p.packSizes : {},
                anchorId: typeof p.anchorId === 'string' ? p.anchorId : null,
                modules: Array.isArray(p.modules)
                  ? p.modules.filter((id) =>
                      recipeById[p.recipeId].modules.some((m) => m.id === id),
                    )
                  : [],
                source: p.source === 'builder' ? 'builder' : 'user',
                day: Number(p.day) || null,
                slot: ['breakfast', 'lunch', 'dinner', 'snack'].includes(p.slot) ? p.slot : null,
              }))
          : [],
        manual: Array.isArray(raw.manual)
          ? raw.manual
              .filter((p) => productById[p.id])
              .slice(0, 100)
              .map((p) => ({
                id: p.id,
                amount: Math.min(100000, Math.max(0.001, Number(p.amount) || 1)),
                unit: ['уп.', 'г', 'мл', 'шт.', 'ч. л.', 'кубик', 'зубчик'].includes(p.unit)
                  ? p.unit
                  : 'уп.',
                ...(p.package &&
                Number(p.package.size) > 0 &&
                ['г', 'мл', 'шт.', 'кубик'].includes(p.package.unit)
                  ? {
                      package: {
                        size: Number(p.package.size),
                        unit: p.package.unit,
                        edible: Number(p.package.edible) || Number(p.package.size),
                        count: 1,
                      },
                    }
                  : {}),
                source: p.source === 'builder' ? 'builder' : 'user',
              }))
          : [],
        checked: Array.isArray(raw.checked) ? raw.checked.filter((x) => typeof x === 'string') : [],
        mode: raw.mode === 'shore' ? 'shore' : 'sea',
        crew: Math.min(4, Math.max(1, Math.round(Number(raw.crew)) || 1)),
        // The stove's gas rate (g/h on a full flame) and kettle minutes per person per day.
        burnerRate: Math.min(400, Math.max(50, Number(raw.burnerRate) || 150)),
        kettleMinutes: Math.min(30, Math.max(0, Number(raw.kettleMinutes ?? 5) || 0)),
        builderMeta:
          raw.builderMeta && ['trip', 'season'].includes(raw.builderMeta.kind)
            ? {
                kind: raw.builderMeta.kind,
                days: Math.min(180, Math.max(1, Number(raw.builderMeta.days) || 3)),
                drinkLitres: Number(raw.builderMeta.drinkLitres) || 3,
                washLitres: Number(raw.builderMeta.washLitres ?? 1.5),
                reservePct: Number(raw.builderMeta.reservePct ?? 25),
                includeEggs: !!raw.builderMeta.includeEggs,
                overrides:
                  raw.builderMeta.overrides && typeof raw.builderMeta.overrides === 'object'
                    ? Object.fromEntries(
                        Object.entries(raw.builderMeta.overrides)
                          .filter(
                            ([key, value]) =>
                              /^\d-(breakfast|lunch|dinner|snack)$/.test(key) &&
                              (recipeById[value] || recipeMigrations[value]),
                          )
                          .map(([key, value]) => [key, recipeMigrations[value]?.recipeId || value]),
                      )
                    : {},
              }
            : null,
      };
    } catch {
      storageFailed = true;
      return { favorites: [], pantry: [], plan: [], manual: [], checked: [], mode: 'sea' };
    }
  }
  const saved = readSaved();
  return { saved, failed: storageFailed };
}
export function saveState(storage, state) {
  try {
    storage.setItem(
      storageKey,
      JSON.stringify({
        favorites: state.favorites,
        pantry: state.pantry,
        plan: state.plan,
        manual: state.manual,
        checked: state.checked,
        mode: state.mode,
        crew: state.crew,
        burnerRate: state.burnerRate,
        kettleMinutes: state.kettleMinutes,
        builderMeta: state.builderMeta,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
