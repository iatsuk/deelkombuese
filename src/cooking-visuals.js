// Action hints supplement the full step without replacing or changing its instructions.
export const visualPaths = {
  can: 'M5 5v14c0 4 14 4 14 0V5M19 5C19 1 5 1 5 5s14 4 14 0ZM5 16c3 3 11 3 14 0m-7-5v3',
  egg: 'M20 15c0 11-16 11-16 0C4 9 9 1 12 1s8 8 8 14Z',
  measure: 'M4 4h12v16H4V4Zm12 3h2a4 4 0 0 1 0 8h-2M4 8h5m-5 4h3m-3 4h5',
  pour: 'm3 3 10 3-4 10-8-3L3 3Zm10 3 4 1-1 4-4-1m5 3c0 0-2 3-2 4a2 2 0 0 0 4 0c0-1-2-4-2-4ZM3 21h18',
  cut: 'm5 2 16 16-3 3L2 5l3-3Zm1 7 7-1m-7 9 3 3m-7-6 3 3',
  stir: 'm17 2-6 13m-5-4h13l-1 10H7L6 11ZM3 11h3m13 0h3m-8-6 2 1',
  flame:
    'M13 2c1 6 7 8 7 13a8 8 0 0 1-16 0c0-4 2-6 4-9 0 3 1 4 2 5 2-3 3-5 3-9Zm-1 12c-5 5-2 8 1 7 3-1 3-4-1-7Z',
  simmer: 'M4 12h16l-1 9H5l-1-9ZM2 12h20M8 8c-2-3 2-3 0-6m8 6c-2-3 2-3 0-6M9 17h.1m5-1h.1',
  lid: 'M3 11h18M5 10c1-8 13-8 14 0M10 3h4M5 14l1 7h12l1-7',
  wait: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  taste: 'M15 2c-5 2-6 7-3 8l-9 11m11-11c5-3 8-9 5-9-1 0-2 0-4 1ZM3 3v5m-2-3h4',
  serve: 'M2 19h20M4 17c0-10 16-10 16 0H4ZM11 6h2m-1 0V4',
  drain: 'M3 10h18l-3 8H6l-3-8ZM1 10h2m18 0h2M8 13h.1m4 0h.1m4 0h.1m-8 8v1m4-1v1m4-1v1',
  bowl: 'M2 11h20c-1 7-5 10-10 10S3 18 2 11ZM7 7c-2-2 2-3 0-5m5 5c-2-2 2-3 0-5m5 5c-2-2 2-3 0-5',
  pan: 'M2 10c0-4 12-4 12 0s-12 4-12 0Zm0 0v4c0 4 12 4 12 0v-4m0 2h9',
  pancakes:
    'M3 8c0-4 18-4 18 0s-18 4-18 0Zm0 0v8c0 4 18 4 18 0V8M3 12c0 4 18 4 18 0m-11-8 5 1-1 3-5-1 1-3Z',
  zip: 'M5 3h14l1 18H4L5 3Zm0 4h14M8 5h3m-4 7h10m-10 4h7',
  air: 'M2 7h13c6 0 6-6 1-5M2 12h17c5 0 5 7 0 6M2 17h8c5 0 5 6 1 5',
  corn: 'M8 4c0-3 8-3 8 0v11c0 7-8 7-8 0V4ZM8 5h8M8 9h8m-8 4h8m-4-11v19M3 11c0 8 3 11 9 11m9-11c0 8-3 11-9 11',
  peas: 'M3 20c0-9 8-17 18-17 0 10-8 18-18 17Zm4-2c-3-4 2-8 5-4m-1-1c-2-4 3-7 5-3m-1-1c-2-3 3-5 4-2',
  milk: 'm7 2 9 0 3 5v15H5V7l2-5Zm0 0 3 5v15m0-15h9M5 7h5m3 5h3m-3 4h3',
  cabbage:
    'M20 17C24 6 17 0 10 3 2 1-1 13 5 19c5 5 12 4 15-2ZM6 6c7-5 16 7 11 13M4 12c7-4 14 1 10 9M12 4c-5 4-5 10 1 13',
  mushroom: 'M2 13C2 0 22 0 22 13H2Zm8 0-1 9h6l-1-9M6 10h.1m10-2h.1',
  cheese: 'M3 9 17 2l4 7H3Zm0 0v12h18V9M7 13h.1m8 3h.1m-8 2h.1',
  thermometer: 'M10 3a2 2 0 0 1 4 0v11a5 5 0 1 1-4 0V3Zm2 7v9m5-14h3m-3 5h3',
  bookOpen: 'M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z',
};

export function cookingAction(step) {
  const first = step.split(/[.!?](?:\s|$)/u)[0].toLocaleLowerCase('ru');
  const rules = [
    [
      /выключ|снимите.*огня|оставьте.*минут|дайте отдохнуть|без огня/,
      'wait',
      'Снять с огня / дать постоять',
    ],
    [/проверь|попробуйте|разломите|готовност|термометр/, 'taste', 'Проверить'],
    [/слейте|слить|сцед|заливку/, 'drain', 'Слить заливку'],
    [/насыпьте|отмер|сухую кружку|мерк/, 'measure', 'Отмерить'],
    [/снимите крышку/, 'lid', 'Снять крышку'],
    [/накрой|закрой.*крыш|под (?:закрытой )?крышкой/, 'lid', 'Под крышкой'],
    [/слаб.*ог|тих.*кип|томите|тушите/, 'simmer', 'Слабый огонь'],
    [/нареж|натрите|измельч|очистите|подготовьте|снимите поврежд/, 'cut', 'Подготовить'],
    [/влейте|налейте|долейте|залейте|восстановите|разведите/, 'pour', 'Добавить жидкость'],
    [/обжар|подрумян|разогрей|прогрей|кипени|вскипят/, 'flame', 'Нагреть'],
    [/варите|доведите до мягкости/, 'simmer', 'Готовить'],
    [/выпекайте|испеките|выкладывайте|сковород/, 'pan', 'На сковороде'],
    [/откройте/, 'can', 'Открыть упаковку'],
    [/закройте/, 'zip', 'Закрыть и убрать'],
    [/разбейте.*яй/, 'egg', 'Добавить яйца'],
    [/положите|всыпьте/, 'stir', 'Добавить основу'],
    [/отрегулируйте|посолите/, 'taste', 'Довести до вкуса'],
    [/намажьте/, 'stir', 'Собрать'],
    [/подавай|подайте|съешьте|разложите/, 'serve', 'Подать'],
    [/смеш|перемеш|вмеш|размеш|взбей|добавьте/, 'stir', 'Смешать / добавить'],
  ];
  const match = rules.find(([test]) => test.test(first));
  return match ? { icon: match[1], label: match[2] } : { icon: 'bookOpen', label: 'Примечание' };
}

export function grainDiagram(recipe, prepared) {
  if (!recipe.grainCooking && !prepared.generator?.profile.absorption) return null;
  const adjusted =
    prepared.ingredients.some(
      (i) =>
        [
          'tomatoPaste',
          'passata',
          'tomato',
          'ketchup',
          'coconut',
          'milk',
          'milkPowder',
          'cream',
          'soy',
        ].includes(i.id) || i.waterExtra,
    ) || prepared.generator?.hydrationWater > 0;
  return {
    adjusted,
    water: prepared.water,
    waterLabel: adjusted ? 'Вода по составу' : '2 такие же мерки',
    note: adjusted
      ? 'Соус и восстановление сухих продуктов уже учтены. Используйте воду из состава, не добавляйте ещё две мерки сверху.'
      : '1 объём крупы + 2 объёма воды. Используйте одну ёмкость и один уровень наполнения; пропорции на пачке имеют приоритет.',
  };
}

export function recipeGlyph(recipe) {
  return (
    {
      generator: 'swap',
      soup: 'bowl',
      pancakes: 'pancakes',
      porridge: 'grain',
      stew: 'pot',
      skillet: 'pan',
      eggs: 'egg',
      bread: 'bread',
      snack: 'bowl',
      pasta: 'pasta',
    }[recipe.kind] ||
    {
      pasta: 'pasta',
      potato: 'potato',
      legumes: 'beans',
      oats: 'grain',
      bread: 'bread',
      eggs: 'egg',
    }[recipe.base] ||
    'pot'
  );
}

export function productGlyph(product) {
  return (
    {
      corn: 'corn',
      peas: 'peas',
      sauerkraut: 'cabbage',
      milk: 'milk',
      milkPowder: 'milk',
      cream: 'milk',
      mushrooms: 'mushroom',
      cheese: 'cheese',
      flour: 'zip',
    }[product.id] || product.icon
  );
}
