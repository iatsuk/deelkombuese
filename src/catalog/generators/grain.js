import { guidedGrainSteps } from '../../cooking-guide.js';

// Grain in one pot: rice or buckwheat absorb measured water under a lid, couscous steeps off
// the heat and savoury oats simmer in stock. A spice, one whole can and vegetables name the
// dish; one portion is 90 g of grain (80 g of oats).
const grainCooked = (c) => c.profile.grainCooking;
const cans = ['stew', 'tuna', 'chickpeas', 'peas', 'corn'];

const GRAIN_STEPS = [
  {
    phase: 'add',
    when: (c) => c.base === 'oats' && cans.some((id) => c.moduleIds.has(id)),
    text: 'Добавьте все выбранные консервы целиком, рыбу и овощи без жидкости, и полностью прогрейте.',
  },
];
// A rice or buckwheat base: water by the mug rule and the guided grain method.
const grainBase = (i, id, label, phrase, time, method) => ({
  id,
  label,
  phrase,
  ingredients: [i(id, 90), i('oil', 10, 'мл')],
  time,
  active: 4,
  water: 0,
  grainCooking: true,
  method,
  steps: [{ phase: 'cook', text: (c) => guidedGrainSteps(null, c.prepared) }],
});
// Options that only rice and buckwheat take: they cook with the grain under the lid.
const underTheLid = (reason) => ({ requires: ['rice', 'buckwheat'], reason });

export function createGrainGenerator({ i, r, aroma, tomato, fish, meat }) {
  return r(
    'grain-generator',
    'Генератор · крупа',
    'rice',
    27,
    4,
    'Рис, гречка, кускус или овсянка, пряность и одна банка: от плова и гречки с мясом до кускуса с нутом.',
    [],
    0,
    [],
    {
      kind: 'generator',
      // Dish kinds the chapter covers in the recipe filter.
      kinds: ['porridge'],
      vessel: 'pot',
      meal: 'main',
      mealTags: ['main', 'breakfast'],
      satiety: '3–4 ч',
      tone: 'gold',
      template: {
        core: ['rice'],
        text: 'Крупа задаёт технику и воду, пряность и банка — название блюда. Рис и гречка впитывают воду по мерке под крышкой.',
      },
      generator: {
        choiceKey: 'technique',
        slug: 'grain',
        chapter: {
          order: 5,
          title: 'Крупа в одной кастрюле: плов, гречка, кускус',
          formula: 'крупа + пряность + банка',
          alt: 'Гуашь: рис с морковью и нутом в синей кастрюле, банка гречки и мерная кружка риса на камбузе у иллюминатора',
          principle:
            'Одна кружка крупы и две такие же кружки воды: рис и гречка впитывают воду под крышкой на самом слабом огне, а пряность, целая банка мяса, рыбы или нута и овощи готовятся вместе с ними. Кускус не варят — его запаривают после выключения огня, а несладкую овсянку варят на бульоне. Одна кастрюля, без отдельного гарнира и без слива воды.',
        },
        // «Крупа: [рис] [с зирой] [с мясом]».
        sentence: [
          'Крупа:',
          { axis: 'base' },
          { group: 'spice', empty: 'без пряностей' },
          { group: 'can', empty: 'без банки' },
        ],
        bases: [
          grainBase(
            i,
            'rice',
            'Рис',
            'рис',
            27,
            'Обычный белый рис впитывает две мерки воды под крышкой на самом слабом огне.',
          ),
          grainBase(
            i,
            'buckwheat',
            'Гречка',
            'гречка',
            25,
            'Гречка впитывает две мерки воды под крышкой; промывать её не нужно.',
          ),
          {
            id: 'couscous',
            label: 'Кускус',
            phrase: 'кускус',
            ingredients: [i('couscous', 90), i('oil', 10, 'мл')],
            water: 120,
            time: 10,
            active: 3,
            tip: 'Кускус не равен рису по способу готовки: его запаривают после выключения огня.',
            steps: [
              {
                phase: 'boil',
                text: 'В кастрюле доведите питьевую воду до кипения вместе со всеми выбранными добавками: консервы — без жидкости, сухие лук и пряности — сразу.',
              },
              {
                phase: 'cook',
                text: 'Выключите огонь, всыпьте кускус и добавьте масло. Проверьте соотношение воды и кускуса на упаковке: для некоторых марок нужно больше воды.',
              },
              {
                phase: 'finish',
                text: 'Накройте на 5 минут. Разрыхлите ложкой, попробуйте и посолите.',
              },
            ],
          },
          {
            id: 'oats',
            label: 'Несладкая овсянка',
            phrase: 'овсяные хлопья',
            ingredients: [
              i('oats', 80),
              i('bouillon', 0.5, 'кубик'),
              i('driedOnion', 3),
              i('oil', 10, 'мл'),
            ],
            water: 280,
            time: 10,
            active: 3,
            steps: [
              {
                phase: 'boil',
                text: 'Вскипятите воду с сухим луком и бульоном. Всыпьте быстрые овсяные хлопья.',
              },
              {
                phase: 'cook',
                text: 'Варите по пачке, обычно 3–7 минут, помешивая. Плотным хлопьям нужны дополнительное время и вода.',
              },
              {
                phase: 'finish',
                text: 'Добавьте масло. Сначала попробуйте, затем досаливайте: бульон уже солёный.',
              },
            ],
          },
        ],
        dishes: [
          {
            name: 'Походный плов',
            base: 'rice',
            modules: ['stew', 'cumin', 'carrot'],
            tip: 'Если нет моркови, можно обойтись без неё. Получится рис с мясом и зирой, а подготовка займёт меньше времени.',
            legacyId: 'pilaf',
          },
          {
            name: 'Рис с рыбой и паприкой',
            base: 'rice',
            modules: ['tuna', 'tomato-paprika'],
            tip: 'Это упрощённый походный вариант паэльи, а не традиционная паэлья. Сардины подходят так же хорошо, как тунец.',
            legacyId: 'paella',
          },
          {
            name: 'Рис с нутом карри',
            base: 'rice',
            modules: ['chickpeas', 'curry'],
            tip: 'Кокосовое молоко можно заменить водой того же объёма. Вкус станет менее сливочным; нут остаётся источником белка.',
            legacyId: 'curry',
          },
          {
            name: 'Рис с кукурузой и тунцом',
            base: 'rice',
            modules: ['tuna', 'corn'],
            legacyId: 'rice-corn',
          },
          {
            name: 'Гречка с мясом и морковью',
            base: 'buckwheat',
            modules: ['stew', 'carrot'],
            legacyId: 'buckwheat-stew',
          },
          // Its own address: 'buckwheat-stew' is buckwheat with meat and carrot.
          { name: 'Гречка с мясом', base: 'buckwheat', modules: ['stew'], slug: 'buckwheat-meat' },
          {
            name: 'Гречка с зелёным горошком',
            base: 'buckwheat',
            modules: ['peas'],
            legacyId: 'buckwheat-peas',
          },
          {
            name: 'Кускус с нутом',
            base: 'couscous',
            modules: ['chickpeas'],
            legacyId: 'couscous',
          },
          { name: 'Несладкая овсянка', base: 'oats', modules: [], legacyId: 'savory-oats' },
          { name: 'Овсянка с рыбой', base: 'oats', modules: ['tuna'] },
        ],
        phases: ['boil', 'cook', 'add', 'finish'],
        steps: GRAIN_STEPS,
        // A substitute keeps the liquid of what it replaces in couscous and oats;
        // rice and buckwheat count their water by the mug rule.
        substitutesKeepLiquid: true,
        // Passage lunches: buckwheat with peas, rice with tuna and corn, couscous;
        // savoury oats for breakfast.
        tripProfiles: {
          breakfast: { choices: { technique: 'oats' }, modules: [] },
          '4-lunch': {
            choices: { technique: 'rice' },
            modules: ['corn', 'tuna', 'paprika'],
          },
          '7-lunch': {
            choices: { technique: 'couscous', aromatics: 'driedOnion' },
            modules: ['chickpeas', 'paprika', 'raisins', 'aromatics'],
          },
          default: {
            choices: { technique: 'buckwheat', aromatics: 'driedOnion' },
            modules: ['peas', 'aromatics'],
          },
        },
      },
      modules: [
        {
          id: 'cumin',
          label: 'Зира',
          phrase: 'с зирой',
          titleLabel: 'с зирой',
          group: 'spice',
          ingredients: [i('cumin', 0.5, 'ч. л.')],
          excludes: ['oats'],
          reason: 'Несладкая овсянка варится на бульоне без пряностей.',
        },
        {
          id: 'paprika',
          label: 'Паприка',
          phrase: 'с паприкой',
          titleLabel: 'с паприкой',
          group: 'spice',
          ingredients: [i('paprika', 0.5, 'ч. л.')],
          excludes: ['oats'],
          reason: 'Несладкая овсянка варится на бульоне без пряностей.',
        },
        {
          id: 'tomato-paprika',
          label: 'Томат и паприка',
          phrase: 'с томатом и паприкой',
          titleLabel: 'с томатом',
          group: 'spice',
          ingredients: [tomato(), i('paprika', 1, 'ч. л.')],
          extraMinutes: 3,
          extraActive: 1,
          excludes: ['oats'],
          reason: 'Несладкая овсянка варится на бульоне без пряностей.',
        },
        {
          id: 'curry',
          label: 'Карри',
          phrase: 'с карри',
          titleLabel: 'с карри',
          group: 'spice',
          ingredients: [i('curry', 1, 'ч. л.')],
          extraMinutes: 3,
          extraActive: 1,
          excludes: ['oats'],
          reason: 'Несладкая овсянка варится на бульоне без пряностей.',
        },
        {
          id: 'stew',
          label: 'Мясные консервы',
          phrase: 'с мясом',
          titleLabel: 'с мясом',
          group: 'can',
          ingredients: [meat()],
        },
        {
          id: 'tuna',
          label: 'Тунец',
          phrase: 'с тунцом',
          titleLabel: 'с тунцом',
          group: 'can',
          ingredients: [fish()],
        },
        {
          id: 'chickpeas',
          label: 'Нут',
          phrase: 'с нутом',
          titleLabel: 'с нутом',
          group: 'can',
          ingredients: [i('chickpeas', 1, 'уп.')],
        },
        {
          id: 'peas',
          label: 'Горошек',
          titleLabel: 'с горошком',
          group: 'vegetables',
          ingredients: [i('peas', 1, 'уп.')],
        },
        {
          id: 'corn',
          label: 'Кукуруза',
          titleLabel: 'с кукурузой',
          group: 'vegetables',
          ingredients: [i('corn', 1, 'уп.')],
        },
        {
          id: 'carrot',
          label: 'Морковь',
          titleLabel: 'с морковью',
          group: 'vegetables',
          ingredients: [
            i('carrot', 1, 'шт.', [
              {
                id: 'driedCarrot',
                amount: 12,
                unit: 'г',
                waterExtra: 60,
                note: '12 г вместо одной моркови. Добавить около 60 мл воды; обычным сушёным кусочкам может понадобиться 20–60 минут предварительного восстановления.',
              },
            ]),
          ],
          extraMinutes: 3,
          extraActive: 3,
          ...underTheLid('Морковь обжаривают и томят с рисом или гречкой под крышкой.'),
        },
        {
          id: 'aromatics',
          label: 'Лук и ароматы',
          ingredients: [aroma()],
          excludes: ['oats'],
          reason: 'В несладкой овсянке уже есть сушёный лук.',
        },
        {
          id: 'raisins',
          label: 'Изюм',
          ingredients: [i('raisins', 20)],
          requires: ['couscous'],
          reason: 'Изюм запаривают вместе с кускусом.',
        },
        {
          id: 'coconut',
          label: 'Кокосовое молоко · по желанию',
          ingredients: [i('coconut', 150, 'мл')],
          requires: ['curry'],
          excludes: ['couscous', 'oats'],
          reason: 'Кокосовое молоко томят с рисом или гречкой в соусе карри.',
        },
        {
          id: 'ginger',
          label: 'Имбирь',
          ingredients: [i('driedGinger', 0.25, 'ч. л.')],
          excludes: ['oats'],
          reason: 'Несладкая овсянка варится на бульоне без пряностей.',
        },
        {
          id: 'bouillon',
          label: 'Сухой бульон',
          ingredients: [i('bouillon', 0.5, 'кубик')],
          excludes: ['oats'],
          reason: 'Несладкая овсянка уже варится на бульоне.',
          steps: [
            {
              phase: 'boil',
              when: (c) => !grainCooked(c),
              text: 'Добавьте сухой бульон в воду блюда. Он заменяет часть соли, а не воду.',
            },
          ],
        },
        {
          id: 'cheese',
          label: 'Сыр · с берега',
          shore: true,
          ingredients: [i('cheese', 100)],
          requires: ['oats'],
          reason: 'Сыр вмешивают в несладкую овсянку.',
          steps: [
            {
              phase: 'add',
              text: 'Вмешайте весь сыр из небольшой упаковки и прогрейте. Сыр сохранять в холоде до этой готовки.',
            },
          ],
        },
        {
          id: 'seasoning',
          label: 'Соль и перец по вкусу',
          ingredients: [i('salt', 0.125, 'ч. л.'), i('pepper', 0.125, 'ч. л.')],
          excludes: ['oats'],
          reason: 'Несладкая овсянка уже солёная от бульона.',
          steps: [
            {
              phase: 'finish',
              when: (c) => !grainCooked(c),
              text: 'Попробуйте готовую основу и только затем добавляйте соль и перец. С бульонным кубиком соли может не понадобиться.',
            },
          ],
        },
      ],
    },
  );
}
