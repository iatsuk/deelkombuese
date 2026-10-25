import {
  grainMeasuringStep,
  grainSimmerStep,
  grainDonenessStep,
  grainRestStep,
} from './cooking-guide.js';
// Flavour combinations can share bases; techniques and water calculations remain distinct.
export function generatorProfile(recipe, choices = {}) {
  return (
    recipe.generator.bases.find((base) => base.id === (choices.pasta || 'pasta')) ||
    recipe.generator.bases[0]
  );
}

export function generatorWater(recipe, choices, ingredients, modules, scale) {
  const profile = generatorProfile(recipe, choices);
  const sauce = modules.find((m) => m.group === 'sauce');
  const fractions = {
    tomatoPaste: 0.7,
    passata: 0.9,
    tomato: 0.9,
    ketchup: 0.7,
    cream: 0.6,
    milk: 0.9,
  };
  const sauceWater = ingredients
    .filter((i) => i.moduleId === sauce?.id)
    .reduce((sum, i) => sum + i.amount * (fractions[i.id] || 0), 0);
  const hydration = ingredients
    .filter((i) => i.id === 'soy')
    .reduce((sum, i) => sum + i.amount * 2.5, 0);
  const cooking = Math.max(
    profile.minWater * scale,
    profile.water * scale - (profile.id === 'potato' ? 0 : sauceWater),
  );
  return { water: Math.round(cooking + hydration), hydrationWater: Math.round(hydration), profile };
}

export function generatedSteps(recipe, prepared) {
  const { profile, hydrationWater } = prepared.generator;
  const modules = prepared.modules;
  const sauce = modules.find((m) => m.group === 'sauce');
  const ids = new Set(prepared.ingredients.map((i) => i.id));
  const cookingWater = prepared.water - hydrationWater;
  const steps = [];
  if (hydrationWater)
    steps.push(
      `До начала готовки восстановите быстрый соевый текстурат по пачке. На это в расчёте отведено ${hydrationWater} мл из общего объёма воды, а не сверх него. При другом соотношении на пачке скорректируйте воду и время.`,
    );
  if (profile.id === 'potato')
    steps.push(
      'Картофель нарежьте кубиками до 1 см. Кислые томаты пока отставьте: их добавляют после размягчения картофеля.',
    );
  if (profile.id === 'risottoRice')
    steps.push(
      'Арборио или карнароли не промывайте: поверхностный крахмал нужен для текстуры. Отмерьте воду, часть оставьте для постепенного доливания.',
    );
  if (ids.has('beef'))
    steps.push(
      'В этой же кастрюле сначала обжарьте фарш на части масла, разбивая комки. В конце приготовления проверьте пищевым термометром: не менее 71 °C в центре фарша.',
    );
  if (modules.some((m) => m.id === 'onion'))
    steps.push(
      'Свежий лук нарежьте и обжарьте на части масла 3–5 минут. Сухой лук отправьте с водой, без длительного обжаривания.',
    );
  if (sauce?.id === 'sauce-tomato' && profile.id !== 'potato')
    steps.push(
      ids.has('tomatoPaste')
        ? 'Томатную пасту прогрейте в части масла 20 секунд.'
        : 'Всю пассату или кетчуп добавьте с жидкостью; свежие нарезанные томаты предварительно размягчите. Не обжаривайте пассату как концентрат.',
    );
  if (profile.id === 'pasta')
    steps.push(
      `Положите короткую пасту в ту же кастрюлю. Начальный объём воды для её приготовления — около ${cookingWater} мл; добавьте выбранный бульон. Варите по пачке, часто помешивая и доливая понемногу при необходимости. Отдельная варка и слив не нужны.`,
    );
  else if (profile.id === 'potato')
    steps.push(
      `Положите картофель в кастрюлю с частью масла и примерно ${cookingWater} мл воды. Если выбран бульон, добавьте его сейчас. Готовьте под крышкой 15–20 минут до полной мягкости; проверяйте дно и доливайте при высыхании.`,
    );
  else if (profile.id === 'rice') {
    steps.push(grainMeasuringStep({ ...prepared, water: cookingWater }));
    if (ids.has('bouillon')) steps.push('Растворите выбранный бульон в воде блюда.');
    steps.push(grainSimmerStep, grainDonenessStep(prepared));
  } else
    steps.push(
      `Коротко прогрейте рис в части масла около минуты. Добавьте примерно половину из ${cookingWater} мл воды и выбранный бульон, затем доливайте оставшуюся воду частями. ${profile.id === 'risottoRice' ? 'Готовьте примерно 18–22 минуты, регулярно перемешивая, до мягкого риса и кремовой жидкости.' : 'Готовьте по времени на пачке до мягкости.'} При необходимости потребуется немного дополнительной воды.`,
    );
  if (sauce?.id === 'sauce-tomato' && profile.id === 'potato')
    steps.push(
      'Только когда картофель полностью мягкий, добавьте все выбранные томаты, перемешайте и томите ещё несколько минут. Вода для предварительной варки не уменьшена на томатную жидкость.',
    );
  const fillings = modules.filter(
    (m) => m.group === 'vegetables' || (m.group === 'protein' && !['soy', 'mince'].includes(m.id)),
  );
  if (fillings.length)
    steps.push(
      'Выбранные добавки: ' +
        fillings.map((m) => m.label).join(', ') +
        '. Слейте жидкость из всех открываемых консервов и используйте содержимое целиком. Добавьте к мягкой основе и полностью прогрейте; сыр вмешайте в конце.',
    );
  if (ids.has('soy'))
    steps.push('Добавьте весь подготовленный текстурат и полностью прогрейте вместе с основой.');
  if (sauce && ['sauce-cream', 'sauce-peanut', 'sauce-garlic', 'sauce-pesto'].includes(sauce.id))
    steps.push(sauce.instruction);
  const accents = modules.filter((m) => !m.group && !['onion', 'bouillon'].includes(m.id));
  if (accents.length) steps.push(accents.map((m) => m.instruction).join(' '));
  if (profile.id === 'rice') steps.push(grainRestStep);
  steps.push(
    'Отрегулируйте густоту и соль перед подачей. Съешьте весь выход сейчас; открытые упаковки и готовое блюдо без холодильника на следующую вахту не оставлять.',
  );
  return steps;
}
