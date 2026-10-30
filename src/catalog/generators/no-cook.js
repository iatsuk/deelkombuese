// No stove: a carrier (bread or a tin of beans), a filling and a dressing. Everything is
// ready to eat, so the only rule is to finish an opened tin and fresh-garlic oil at once.
const dressing = (c) => c.modules.find((m) => m.group === 'dressing');
const onBread = (c) => c.base === 'bread';

const NO_COOK_STEPS = [
  {
    phase: 'serve',
    text: (c) =>
      c.ids.has('peanutButter')
        ? 'Съешьте сразу; сухие остатки продуктов закройте отдельно. Учитывайте аллергию на арахис.'
        : 'Съешьте сразу. Открытые банки и масло со свежим чесноком на следующую вахту не оставляйте: без холодильника это не запас.',
  },
];
// Shared by the dressings: peanut butter is eaten without an oil dressing.
const noOilWithPeanut = {
  excludes: ['peanut'],
  reason: 'Арахисовую пасту едят без масляной заправки.',
};
// A tin of beans or chickpeas is the base of a cold salad.
const tinBase = (id, label, phrase, product) => ({
  id,
  label,
  phrase,
  time: 5,
  active: 5,
  water: 0,
  satiety: '3–4 ч',
  requires: ['onion-paprika', 'oil-pepper', 'garlic-oil', 'tuna', 'corn'],
  reason: 'Добавьте к бобовым начинку или заправку.',
  steps: [
    {
      phase: 'open',
      text: `Откройте банку ${product}, слейте жидкость и выложите всё содержимое в миску.`,
    },
  ],
});

export function createNoCookGenerator({ r, i, fish }) {
  return r(
    'no-cook-generator',
    'Генератор · без плиты',
    'bread',
    3,
    3,
    'Хлеб или банка бобовых, начинка и заправка: от хлеба с тунцом до фасоли с кукурузой.',
    [
      i('bread', 100, 'г', [
        {
          id: 'ryeBread',
          amount: 100,
          unit: 'г',
          note: 'Открытый пастеризованный хлеб расходовать за 3–5 дней в сухой прохладе.',
        },
        {
          id: 'crispbread',
          amount: 50,
          unit: 'г',
          note: 'Хлебцы — сухой резерв. Намазывайте и поливайте их только перед едой.',
        },
        {
          id: 'beans',
          amount: 1,
          unit: 'уп.',
          note: 'Вместо хлеба — целая банка фасоли: получится холодный салат в миске.',
        },
        {
          id: 'chickpeas',
          amount: 1,
          unit: 'уп.',
          note: 'Вместо хлеба — целая банка нута: получится холодный салат в миске.',
        },
      ]),
    ],
    0,
    [],
    {
      kind: 'generator',
      // Dish kinds the chapter covers in the recipe filter.
      kinds: ['snack', 'bread'],
      vessel: 'cold',
      meal: 'snack',
      mealTags: ['snack', 'breakfast'],
      satiety: '2–3 ч',
      tone: 'gold',
      template: {
        core: ['bread'],
        text: 'Основа задаёт посуду и сытость, начинка и заправка — название блюда. Всё уже готово к еде: открытую банку съедают сразу.',
      },
      generator: {
        choiceKey: 'bread',
        slug: 'no-cook',
        chapter: {
          order: 7,
          title: 'Без плиты: хлеб, банка и заправка',
          formula: 'основа + начинка + заправка',
          alt: 'Гуашь: ломоть хлеба с тунцом и открытая банка на коралловом фоне',
          principle:
            'Когда плиту не зажечь — в шторм, в жару или на короткой вахте, — еду собирают из готового: хлеба или хлебцев, банки рыбы, фасоли или кукурузы и простой заправки. Правило одно: открытую банку и масло со свежим чесноком съедают сразу, на потом их не оставляют.',
        },
        // «Без плиты: [хлеб] [с тунцом] [с маслом и перцем]».
        sentence: [
          'Без плиты:',
          { axis: 'base' },
          { group: 'filling', empty: 'без начинки' },
          { group: 'dressing', empty: 'без заправки' },
        ],
        bases: [
          {
            id: 'bread',
            label: 'Хлеб',
            phrase: 'хлеб',
            time: 3,
            active: 3,
            water: 0,
            satiety: '1–2 ч',
            requires: ['tuna', 'peanut', 'garlic-oil', 'oil-pepper', 'onion-paprika'],
            reason: 'Хлебу нужна начинка или заправка.',
            steps: [
              {
                phase: 'assemble',
                when: (c) => !c.moduleIds.has('tuna') && !c.moduleIds.has('peanut'),
                text: 'Нарежьте хлеб, макайте ломтики в заправку или полейте их.',
              },
            ],
          },
          tinBase('beans', 'Фасоль из банки', 'фасоль из банки', 'фасоли'),
          tinBase('chickpeas', 'Нут из банки', 'нут из банки', 'нута'),
        ],
        dishes: [
          {
            name: 'Хлеб с тунцом',
            base: 'bread',
            modules: ['tuna'],
            satiety: '2–3 ч',
            legacyId: 'tuna-toast',
          },
          {
            name: 'Хлеб с арахисовой пастой',
            base: 'bread',
            modules: ['peanut'],
            satiety: '2–3 ч',
            legacyId: 'bread-peanut',
          },
          {
            name: 'Хлеб с маслом и чесноком',
            base: 'bread',
            modules: ['garlic-oil'],
            legacyId: 'bread-oil',
          },
          { name: 'Хлеб с маслом и перцем', base: 'bread', modules: ['oil-pepper'] },
          { name: 'Хлеб с луком и паприкой', base: 'bread', modules: ['onion-paprika'] },
          {
            name: 'Фасоль с кукурузой',
            base: 'beans',
            modules: ['corn'],
            legacyId: 'bean-corn-salad',
          },
          { name: 'Фасоль с тунцом', base: 'beans', modules: ['tuna'] },
          { name: 'Нут с тунцом', base: 'chickpeas', modules: ['tuna'] },
          { name: 'Нут с кукурузой', base: 'chickpeas', modules: ['corn'] },
        ],
        phases: ['open', 'dress', 'assemble', 'serve'],
        steps: NO_COOK_STEPS,
        // On a passage: peanut butter at breakfast, garlic bread as a snack.
        tripProfiles: {
          breakfast: { modules: ['peanut'] },
          snack: { modules: ['garlic-oil'], choices: { garlic: 'driedGarlic' } },
        },
      },
      modules: [
        {
          id: 'tuna',
          label: 'Тунец · вся банка',
          phrase: 'с тунцом',
          group: 'filling',
          ingredients: [fish()],
          extraMinutes: 2,
          extraActive: 2,
          steps: [
            {
              phase: 'open',
              text: (c) =>
                onBread(c)
                  ? 'Откройте банку рыбы и слейте жидкость.'
                  : 'Откройте банку рыбы, слейте жидкость и добавьте рыбу в миску крупными кусочками.',
            },
            {
              phase: 'assemble',
              when: onBread,
              text: (c) =>
                `Разложите всю рыбу по хлебу или хлебцам${dressing(c) && dressing(c).id !== 'oil-pepper' ? ' и полейте заправкой' : ''}. Если рыбы много, добавьте хлеба.`,
            },
          ],
        },
        {
          id: 'peanut',
          label: 'Арахисовая паста с изюмом',
          phrase: 'с арахисовой пастой',
          group: 'filling',
          ingredients: [i('peanutButter', 50), i('raisins', 20)],
          requires: ['bread'],
          reason: 'Арахисовую пасту намазывают на хлеб или хлебцы.',
          steps: [
            {
              phase: 'assemble',
              text: 'Намажьте хлеб или хлебцы всей арахисовой пастой и посыпьте изюмом.',
            },
          ],
        },
        {
          id: 'corn',
          label: 'Кукуруза · вся банка',
          phrase: 'с кукурузой',
          group: 'filling',
          ingredients: [i('corn', 1, 'уп.')],
          requires: ['beans', 'chickpeas'],
          reason: 'Кукурузу смешивают с фасолью или нутом в миске.',
          steps: [
            {
              phase: 'open',
              text: 'Слейте жидкость из банки кукурузы и добавьте её целиком в миску.',
            },
          ],
        },
        {
          id: 'oil-pepper',
          label: 'Масло и перец',
          phrase: 'с маслом и перцем',
          group: 'dressing',
          ingredients: [i('oil', 10, 'мл'), i('pepper', 0.125, 'ч. л.')],
          ...noOilWithPeanut,
          steps: [
            {
              phase: 'dress',
              text: (c) =>
                !onBread(c)
                  ? 'Добавьте масло и перец и перемешайте.'
                  : c.moduleIds.has('tuna')
                    ? 'Разомните рыбу с маслом и перцем на тарелке.'
                    : 'Смешайте масло с перцем на тарелке.',
            },
          ],
        },
        {
          id: 'garlic-oil',
          label: 'Масло с чесноком',
          phrase: 'с чесночным маслом',
          group: 'dressing',
          ingredients: [
            i('oil', 15, 'мл'),
            i('garlic', 1, 'зубчик', [
              {
                id: 'driedGarlic',
                amount: 0.125,
                unit: 'ч. л.',
                note: 'Сухой чеснок вмешать непосредственно перед едой.',
              },
            ]),
            i('salt', 0.125, 'ч. л.'),
            i('pepper', 0.125, 'ч. л.'),
          ],
          ...noOilWithPeanut,
          steps: [
            {
              phase: 'dress',
              text: (c) =>
                onBread(c)
                  ? 'В чистой маленькой миске или тарелке смешайте масло с солью, перцем и свеженарезанным либо сухим чесноком.'
                  : 'Добавьте масло, соль, перец и мелко нарезанный либо сухой чеснок, перемешайте.',
            },
          ],
        },
        {
          id: 'onion-paprika',
          label: 'Масло, лук и паприка',
          phrase: 'с луком и паприкой',
          group: 'dressing',
          ingredients: [i('oil', 10, 'мл'), i('driedOnion', 3), i('paprika', 0.5, 'ч. л.')],
          ...noOilWithPeanut,
          steps: [
            {
              phase: 'dress',
              text: (c) => {
                const onion = c.ids.has('onion') ? 'мелко нарезанный лук' : 'сушёный лук';
                return onBread(c)
                  ? `Смешайте масло, ${onion} и паприку и дайте постоять пару минут.`
                  : `Добавьте масло, ${onion} и паприку. Перемешайте, посолите по вкусу и дайте постоять пару минут, чтобы лук размягчился.`;
              },
            },
          ],
        },
        {
          id: 'honey',
          label: 'Мёд',
          ingredients: [i('honey', 15)],
          requires: ['peanut'],
          reason: 'Мёд добавляют к арахисовой пасте.',
          steps: [{ phase: 'assemble', text: 'Перед едой добавьте к пасте немного мёда.' }],
        },
      ],
    },
  );
}
