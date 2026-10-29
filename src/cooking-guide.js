const liquidFractions = {
  tomatoPaste: 0.7,
  passata: 0.9,
  tomato: 0.9,
  ketchup: 0.7,
  coconut: 0.65,
};
const drainedNames = {
  tuna: 'тунец',
  sardines: 'сардины',
  beans: 'фасоль',
  chickpeas: 'нут',
  peas: 'горошек',
  corn: 'кукуруза',
  mushrooms: 'грибы',
  olives: 'оливки',
};

export function absorptionWater(recipe, ingredients, extraWater = 0) {
  if (!recipe.grainCooking) return null;
  const grain = ingredients.find((i) => ['rice', 'buckwheat'].includes(i.id));
  if (!grain) return null;
  // Approximate conversion from the volume rule to the card's gram quantities.
  const target = grain.amount * (grain.id === 'buckwheat' ? 250 / 90 : 2.5);
  const liquid = ingredients.reduce((sum, i) => sum + i.amount * (liquidFractions[i.id] || 0), 0);
  return Math.round(Math.max(target * 0.5, target - liquid) + extraWater);
}

export function grainMeasuringStep(prepared) {
  const grain = prepared.ingredients.find((i) => ['rice', 'buckwheat'].includes(i.id));
  const name = grain.id === 'buckwheat' ? 'гречку' : 'обычный белый рис';
  const adjusted =
    prepared.ingredients.some(
      (i) =>
        liquidFractions[i.id] || i.waterExtra || ['cream', 'milk', 'milkPowder'].includes(i.id),
    ) || prepared.generator?.hydrationWater > 0;
  const measure = `Насыпьте ${name} в сухую кружку или стакан, запомните уровень и пересыпьте в кастрюлю.`;
  return adjusted
    ? `${measure} В этом варианте есть жидкий соус или вода на восстановление сухих продуктов: отмерьте и влейте к крупе ${prepared.water} мл воды из общего расчёта. Ещё две мерки сверху добавлять не нужно.`
    : `${measure} Ориентир — одна мерка крупы и две такие же мерки воды: наполните ту же ёмкость водой до запомненного уровня, вылейте в кастрюлю и повторите ещё раз. В карточке это примерно ${prepared.water} мл. Если на пачке другое соотношение, используйте его: объём и впитывание зависят от крупы.`;
}

export const grainSimmerStep =
  'Доведите до кипения на среднем огне. Как только появились устойчивые пузырьки, убавьте до самого слабого огня и закройте крышкой. Жидкость должна лишь тихо побулькивать. Задача — чтобы крупа впитала воду; бурное кипение с открытой крышкой быстро высушит кастрюлю.';
export function grainDonenessStep(prepared) {
  return 'Готовьте под закрытой крышкой 15–20 минут или по времени на пачке. Не поднимайте крышку каждую минуту и не мешайте без необходимости. Ближе к концу попробуйте крупинку: внутри не должно быть твёрдой сердцевины. Если крупа ещё жёсткая, а дно уже сухое, добавьте 2–3 столовые ложки питьевой воды, закройте и готовьте ещё 3–5 минут.';
}
export const grainRestStep =
  'Когда крупа готова и все добавки полностью прогреты, выключите горелку. Оставьте кастрюлю под закрытой крышкой на 5 минут, затем аккуратно разрыхлите ложкой и подавайте. Не нужно держать готовую крупу на огне, добиваясь полного высыхания.';

export function guidedGrainSteps(recipe, prepared) {
  const ids = new Set(prepared.ingredients.map((i) => i.id)),
    steps = [];
  const hydration = Math.round(
    prepared.ingredients
      .filter((i) => i.id === 'soy' && i.waterExtra)
      .reduce((sum, i) => sum + i.waterExtra * prepared.scale, 0),
  );
  if (hydration)
    steps.push(
      `Сначала восстановите быстрый соевый текстурат по пачке. Отберите на это ${hydration} мл из общего объёма воды карточки. Для крупы останется ${prepared.water - hydration} мл; дополнительную воду для текстурата второй раз не наливайте.`,
    );
  if (ids.has('carrot') || ids.has('onion'))
    steps.push(
      'Свежую морковь нарежьте мелкими кубиками, выбранный свежий лук — мелко. Прогрейте масло на среднем огне и обжарьте овощи 3–5 минут, помешивая.',
    );
  else
    steps.push(
      'Налейте масло в кастрюлю и прогрейте на среднем огне. Добавьте выбранные сухие лук и специи из состава, помешайте около 20 секунд. Сухие специи не должны темнеть и гореть.',
    );
  if (ids.has('driedCarrot'))
    steps.push(
      'Для быстрой готовки возьмите мелкие быстро восстанавливаемые морковные хлопья и отправьте их с водой. Если на пачке указано долгое замачивание, подготовьте морковь заранее; это время сверх карточки.',
    );
  if (ids.has('carrot') || ids.has('onion'))
    steps.push(
      'После свежих овощей добавьте остальные выбранные сухие ароматы и специи, прогрейте около 20 секунд.',
    );
  if (ids.has('tomatoPaste'))
    steps.push(
      'Добавьте всю томатную пасту из выбранной упаковки и прогрейте 20 секунд. Если выбраны пассата, кетчуп или свежие томаты, их вводят вместе с водой, а не обжаривают как концентрат.',
    );
  steps.push(grainMeasuringStep({ ...prepared, water: prepared.water - hydration }));
  if (['passata', 'ketchup', 'tomato'].some((id) => ids.has(id)))
    steps.push(
      'Вместе с водой добавьте все выбранные жидкие томаты или кетчуп; свежие томаты предварительно мелко нарежьте.',
    );
  if (ids.has('coconut'))
    steps.push(
      'Влейте всё кокосовое молоко из выбранной упаковки и аккуратно перемешайте. Его жидкость уже учтена в расчёте воды.',
    );
  if (ids.has('bouillon'))
    steps.push(
      'Растворите выбранный сухой бульон в жидкости блюда. Соль пока не добавляйте: бульон уже солёный.',
    );
  steps.push(grainSimmerStep, grainDonenessStep(prepared));
  if (ids.has('coconut'))
    steps.push(
      'В густом кокосовом соусе следите за дном: при необходимости один раз аккуратно проведите ложкой по дну. Нагрев должен оставаться слабым.',
    );
  const drained = Object.entries(drainedNames)
    .filter(([id]) => ids.has(id))
    .map(([, name]) => name);
  if (drained.length)
    steps.push(
      `Откройте готовые консервы: ${drained.join(', ')}. Слейте заливку, придерживая содержимое ложкой или крышкой, и добавьте всё содержимое упаковок без заливки к готовой крупе. Прогрейте 2–3 минуты до горячего состояния.`,
    );
  if (ids.has('stew'))
    steps.push(
      'Откройте мясные консервы и добавьте всё содержимое вместе с соком к готовой крупе. Полностью прогрейте 2–3 минуты до горячего состояния.',
    );
  if (ids.has('soy'))
    steps.push('Вмешайте весь подготовленный текстурат и полностью прогрейте вместе с крупой.');
  steps.push(
    ids.has('salt') || ids.has('pepper')
      ? 'Попробуйте блюдо и добавьте выбранные соль и перец по вкусу.'
      : 'Попробуйте готовое блюдо перед подачей.',
  );
  steps.push(grainRestStep);
  return steps;
}

export function cookingBasics(recipe, prepared) {
  const ids = new Set(prepared.ingredients.map((i) => i.id));
  const tips = [];
  if (recipe.vessel === 'pan')
    tips.push(
      'Средний огонь: масло прогрелось, но не дымится. Если снаружи уже темнеет, а внутри сыро, уменьшите нагрев и готовьте дольше.',
    );
  else if (recipe.vessel !== 'cold' && !recipe.grainCooking)
    tips.push(
      'После закипания уменьшите огонь: «томить» — значит поддерживать редкие небольшие пузырьки, а не бурное кипение.',
    );
  const drained = Object.entries(drainedNames)
    .filter(([id]) => ids.has(id))
    .map(([, name]) => name);
  if (drained.length)
    tips.push(
      `Консервы без заливки в этом рецепте: ${drained.join(', ')}. «Без жидкости» — слейте заливку, придерживая содержимое ложкой или крышкой. В блюдо идёт всё содержимое без заливки.`,
    );
  // Grated potatoes (potato pancakes) need no advice on dicing.
  if (ids.has('potato') && !prepared.generator?.profile.grated)
    tips.push(
      'Кубики картофеля до 1 см — примерно с ноготь большого пальца. Крупные куски готовятся дольше указанного времени.',
    );
  return tips;
}

export function recipeUtensils(recipe, prepared) {
  const items =
    recipe.vessel === 'cold'
      ? ['миска или тарелка', 'ложка']
      : recipe.vessel === 'pan'
        ? ['сковорода', 'лопатка']
        : ['кастрюля с крышкой', 'ложка'];
  if (recipe.grainCooking || prepared.generator?.profile.absorption)
    items.push('сухая кружка или стакан для мерки');
  // A generator base names what its technique needs beyond the vessel: a bowl, a grater.
  items.push(...(prepared.generator?.profile.utensils || []));
  return items;
}
