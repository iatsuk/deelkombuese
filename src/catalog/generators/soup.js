// Soup in one pot: each base is its own soup with its liquid and thickener — stock with
// potatoes, lentils, a whole pack of passata, sauerkraut or a can of vegetables to mash.
// A protein and additions complete it; the whole pot is eaten at one meal.
const has = (c, id) => c.ids.has(id);

const SOUP_STEPS = [
  {
    phase: 'finish',
    when: (c) => c.moduleIds.has('seasoning'),
    text: 'Попробуйте готовую основу и только затем добавляйте соль и перец. С бульонным кубиком соли может не понадобиться.',
  },
];
// The chosen form of tomatoes, for the tomato soup and its substitutes.
const tomatoPack = (c) =>
  has(c, 'passata')
    ? 'весь выбранный пакет пассаты'
    : has(c, 'tomatoPaste')
      ? 'всю томатную пасту, разведённую рассчитанной водой'
      : has(c, 'ketchup')
        ? 'весь кетчуп с рассчитанной водой'
        : 'нарезанные свежие томаты';
// Tomato paste in a soup: a substitute keeps the liquid of the paste it replaces.
const tomatoWater = { passata: -100, tomato: -150, ketchup: 0 };

export function createSoupGenerator({ r, i, aroma, tomato, fish, meat }) {
  const tomatoes = () => {
    const paste = tomato();
    return {
      ...paste,
      alternatives: paste.alternatives.map((a) => ({ ...a, waterDelta: tomatoWater[a.id] })),
    };
  };
  return r(
    'soup-generator',
    'Генератор · суп',
    'potato',
    25,
    5,
    'Бульон, чечевица, томаты, квашеная капуста или банка овощей: от супа на бульоне до щей и супа-пюре.',
    [],
    0,
    [],
    {
      kind: 'generator',
      // Dish kinds the chapter covers in the recipe filter.
      kinds: ['soup'],
      vessel: 'pot',
      meal: 'main',
      mealTags: ['main'],
      satiety: '3–4 ч',
      tone: 'red',
      template: {
        core: ['potato'],
        text: 'Основа задаёт жидкость, густоту и способ, белок и добавки — название супа. Всю кастрюлю съедают за один приём пищи.',
      },
      generator: {
        choiceKey: 'technique',
        slug: 'soup',
        chapter: {
          order: 2,
          title: 'Суп в одной кастрюле: бульон, чечевица, щи',
          formula: 'основа + белок + добавки',
          alt: 'Гуашь: суп с фасолью и овощами в синей кастрюле с половником, миска супа, открытая банка фасоли и бульонные кубики на камбузе',
          principle:
            'Суп держится на жидкости и том, что её загущает: картофель или крупа в бульоне, чечевица, целый пакет пассаты, квашеная капуста или банка горошка, размятая с картофелем. Кислое и консервы добавляют к мягкому картофелю в конце, а всю кастрюлю съедают сразу: готовый суп без холодильника на следующую вахту не оставляют.',
        },
        // «Суп: [на бульоне] [с рыбой]».
        sentence: ['Суп:', { axis: 'base' }, { group: 'protein', empty: 'без добавки' }],
        bases: [
          {
            id: 'broth',
            label: 'Суп на бульоне',
            phrase: 'на бульоне',
            ingredients: [
              i('potato', 200, 'г', [
                {
                  id: 'pasta',
                  amount: 50,
                  unit: 'г',
                  timeDelta: -10,
                  note: 'Вместо картофеля — 50 г короткой пасты. Варить по пачке, обычно 8–12 минут.',
                },
                {
                  id: 'rice',
                  amount: 50,
                  unit: 'г',
                  timeDelta: -3,
                  note: 'Вместо картофеля — 50 г белого риса. Варить до мягкости, обычно 15–18 минут.',
                },
                {
                  id: 'oats',
                  amount: 40,
                  unit: 'г',
                  timeDelta: -12,
                  note: 'Вместо картофеля — 40 г быстрых овсяных хлопьев. Варить по пачке, обычно 3–7 минут; суп будет гуще.',
                },
              ]),
              i('bouillon', 0.5, 'кубик'),
              i('driedCarrot', 8),
              i('driedOnion', 3),
              i('oil', 5, 'мл'),
            ],
            water: 450,
            time: 25,
            active: 5,
            steps: [
              {
                phase: 'prepare',
                text: 'Вскипятите воду с бульоном и сушёными овощами. Для быстрой версии используйте мелкие быстро восстанавливаемые овощи; обычные кусочки заранее замочите по инструкции.',
              },
              {
                phase: 'simmer',
                text: (c) =>
                  has(c, 'rice')
                    ? 'Всыпьте рис и варите 15–18 минут до мягкости.'
                    : has(c, 'pasta')
                      ? 'Всыпьте короткую пасту и варите по времени на пачке, помешивая.'
                      : has(c, 'oats')
                        ? 'Всыпьте хлопья и варите по времени на пачке, помешивая.'
                        : 'Добавьте картофель кубиками до 1 см и варите 15–20 минут до полной мягкости.',
              },
              {
                phase: 'finish',
                text: 'Вмешайте масло. Попробуйте перед досаливанием: бульон уже солёный. Ешьте сразу.',
              },
            ],
          },
          {
            id: 'lentil',
            label: 'Чечевичный суп',
            phrase: 'чечевичный',
            ingredients: [
              i('lentils', 100),
              tomatoes(),
              aroma(),
              i('paprika', 1, 'ч. л.'),
              i('oil', 10, 'мл'),
            ],
            water: 450,
            time: 22,
            active: 5,
            steps: [
              {
                phase: 'prepare',
                text: 'Промойте чечевицу питьевой водой. В кастрюле прогрейте масло с ароматической смесью и паприкой около 20 секунд.',
              },
              {
                phase: 'simmer',
                text: 'Добавьте чечевицу и питьевую воду. Варите 12 минут на слабом огне.',
              },
              {
                phase: 'finish',
                text: (c) =>
                  `Добавьте ${has(c, 'tomatoPaste') ? 'томатную пасту' : has(c, 'passata') ? 'всю пассату из выбранной упаковки' : has(c, 'ketchup') ? 'выбранный кетчуп' : 'нарезанные свежие томаты'} и томите ещё 5–8 минут до мягкости. Подстройте густоту водой, посолите.`,
              },
            ],
          },
          {
            id: 'tomato',
            label: 'Томатный суп из целого пакета',
            phrase: 'томатный из пакета пассаты',
            ingredients: [
              i('passata', 500),
              i('beans', 1, 'уп.'),
              i('bread', 60),
              i('driedOnion', 5),
              i('driedGarlic', 0.25, 'ч. л.'),
              i('paprika', 0.5, 'ч. л.'),
              i('oil', 10, 'мл'),
            ],
            water: 20,
            // The whole 500 g pack of passata is the point of this soup.
            defaultPacks: { passata: 500 },
            time: 12,
            active: 4,
            tip: 'Для одиночного камбуза большой пакет томатов удобнее превратить в густой суп, чем пропорционально увеличивать сухую пасту. Меньше лишнего выхода при полном расходе пассаты.',
            steps: [
              {
                phase: 'prepare',
                text: (c) =>
                  `Прогрейте масло с сушёным луком, чесноком и паприкой несколько секунд. Влейте ${tomatoPack(c)}.`,
              },
              {
                phase: 'simmer',
                text: 'Слейте жидкость из фасоли и добавьте всю банку. Томите 7–10 минут, помешивая. Суп густой; питьевую воду добавляйте понемногу, если нужно.',
              },
              {
                phase: 'finish',
                text: 'Посолите по вкусу и подайте с рассчитанным количеством хлеба. В этой схеме весь пакет томатов и вся банка фасоли уходят в текущий обед.',
              },
            ],
          },
          {
            id: 'sauerkraut',
            label: 'Щи из квашеной капусты',
            phrase: 'щи из квашеной капусты',
            ingredients: [
              i('sauerkraut', 1, 'уп.'),
              i('potato', 150),
              i('driedCarrot', 8),
              i('driedOnion', 3),
              i('bouillon', 0.5, 'кубик'),
              i('oil', 10, 'мл'),
            ],
            water: 250,
            minWater: 250,
            time: 28,
            active: 7,
            tip: 'Для одиночного камбуза удобен пакет капусты 150 г и небольшая банка свёклы. Большую упаковку нужно использовать всю — готового супа получится больше, на следующие дни без холодильника его не оставлять.',
            steps: [
              {
                phase: 'prepare',
                text: 'Подготовьте мелкие быстро восстанавливаемые морковь и лук. Картофель нарежьте кубиками до 1 см; прогрейте масло и овощи, не пережаривая сухие хлопья.',
              },
              {
                phase: 'simmer',
                text: 'Влейте рассчитанную воду, добавьте картофель и бульон. Варите под крышкой 15–20 минут до полной мягкости картофеля. Кислую капусту и томаты пока не добавляйте.',
              },
              {
                phase: 'add',
                text: (c) =>
                  `Всю выбранную упаковку готовой капусты слейте${c.moduleIds.has('rinse') ? ' и промойте' : ''}. Добавьте капусту только к мягкому картофелю.`,
              },
              {
                phase: 'finish',
                text: 'Доведите до кипения и томите ещё 5–8 минут или по указанию готовой капусты. Полностью прогрейте выбранные добавки; попробуйте перед досаливанием. Съешьте всё в текущий приём пищи.',
              },
            ],
          },
          {
            id: 'puree',
            label: 'Суп-пюре из горошка или кукурузы',
            phrase: 'пюре из горошка или кукурузы',
            ingredients: [
              i('potato', 150),
              i('peas', 1, 'уп.', [
                {
                  id: 'corn',
                  amount: 1,
                  unit: 'уп.',
                  note: 'Использовать всю маленькую банку кукурузы без жидкости. Зёрна останутся кусочками; это другой вкус и текстура.',
                },
              ]),
              i('bouillon', 0.5, 'кубик'),
              i('driedOnion', 3),
              i('oil', 10, 'мл'),
            ],
            water: 300,
            time: 23,
            active: 6,
            steps: [
              {
                phase: 'simmer',
                text: 'Нарежьте картофель кубиками до 1 см. Залейте водой, добавьте сушёный лук и бульон; варите под крышкой 15–20 минут до полной мягкости.',
              },
              {
                phase: 'add',
                text: 'Слейте жидкость из выбранной банки горошка или кукурузы и добавьте всё содержимое. Полностью прогрейте.',
              },
              {
                phase: 'finish',
                text: 'Снимите с огня. Разомните картофель и часть овощей ложкой или толкушкой прямо в кастрюле, добавьте масло. Это суп с текстурой, не гладкий крем; густоту подстройте водой.',
              },
            ],
          },
        ],
        dishes: [
          { name: 'Суп на бульоне', base: 'broth', modules: [], legacyId: 'broth-soup' },
          { name: 'Суп на бульоне с рыбой', base: 'broth', modules: ['fish'] },
          { name: 'Чечевичный суп', base: 'lentil', modules: [], legacyId: 'soup' },
          { name: 'Пряный чечевичный суп', base: 'lentil', modules: ['curry'] },
          {
            name: 'Томатный суп из целого пакета',
            base: 'tomato',
            modules: [],
            legacyId: 'tomato-pack-soup',
          },
          {
            name: 'Щи из квашеной капусты',
            base: 'sauerkraut',
            modules: [],
            legacyId: 'cabbage-soup',
          },
          { name: 'Щи с мясом', base: 'sauerkraut', modules: ['meat'] },
          { name: 'Борщ с квашеной капустой', base: 'sauerkraut', modules: ['borscht'] },
          { name: 'Борщ с мясом', base: 'sauerkraut', modules: ['borscht', 'meat'] },
          {
            name: 'Суп-пюре из горошка или кукурузы',
            base: 'puree',
            modules: [],
            legacyId: 'pea-potato-soup',
          },
        ],
        phases: ['ready', 'prepare', 'base', 'simmer', 'add', 'finish'],
        steps: SOUP_STEPS,
        substitutesKeepLiquid: true,
        // Passage lunches: tomato soup, stock soup with fish, lentils, shchi.
        tripProfiles: {
          '2-lunch': { choices: { technique: 'tomato' }, modules: [] },
          '5-lunch': { choices: { technique: 'lentil' }, modules: [] },
          '6-lunch': { choices: { technique: 'sauerkraut' }, modules: ['rinse'] },
          default: { choices: { technique: 'broth' }, modules: ['fish'] },
        },
      },
      modules: [
        {
          id: 'fish',
          label: 'Рыба из банки',
          phrase: 'с рыбой',
          group: 'protein',
          ingredients: [fish()],
          requires: ['broth'],
          reason: 'Рыбу из банки добавляют в суп на бульоне.',
          steps: [
            {
              phase: 'add',
              text: 'Добавьте всю выбранную банку готовой рыбы без жидкости в конце готовки и полностью прогрейте.',
            },
          ],
        },
        {
          id: 'beans',
          label: 'Фасоль или нут',
          phrase: 'с фасолью',
          group: 'protein',
          ingredients: [i('beans', 1, 'уп.')],
          requires: ['broth', 'sauerkraut'],
          reason: 'Фасоль и мясо добавляют в суп на бульоне или в щи.',
          steps: [
            {
              phase: 'add',
              text: 'Слейте жидкость и добавьте всю банку готовых бобовых. Полностью прогрейте вместе с основой.',
            },
          ],
        },
        {
          id: 'meat',
          label: 'Мясные консервы / соевый текстурат',
          phrase: 'с мясом',
          group: 'protein',
          ingredients: [meat()],
          requires: ['broth', 'sauerkraut'],
          reason: 'Фасоль и мясо добавляют в суп на бульоне или в щи.',
          steps: [
            {
              phase: 'add',
              text: 'Мясные консервы добавьте целиком и прогрейте. Быстрый сухой текстурат предварительно восстановите по инструкции: отберите на это 125 мл из рассчитанной воды. При другом соотношении увеличьте воду и время.',
            },
          ],
        },
        {
          id: 'borscht',
          label: 'Свёкла → борщ',
          ingredients: [i('beetCanned', 1, 'уп.')],
          extraMinutes: 2,
          extraActive: 1,
          requires: ['sauerkraut'],
          reason: 'Свёклу добавляют в щи — получается борщ.',
          steps: [
            {
              phase: 'add',
              text: 'Для борща добавьте всю небольшую банку готовой свёклы без заливки после размягчения картофеля. Нарежьте кусочки прямо перед добавлением.',
            },
          ],
        },
        {
          id: 'tomatoes',
          label: 'Томатный вкус',
          ingredients: [tomatoes()],
          requires: ['sauerkraut'],
          reason: 'Томаты добавляют в щи после мягкого картофеля.',
          steps: [
            {
              phase: 'add',
              text: 'После размягчения картофеля добавьте всю выбранную упаковку томатов. Пасту размешайте в бульоне; пассату не нужно предварительно обжаривать.',
            },
          ],
        },
        {
          id: 'rinse',
          label: 'Промыть капусту',
          ingredients: [],
          prepWater: 300,
          prepWaterProduct: 'sauerkraut',
          prepWaterReference: 150,
          requires: ['sauerkraut'],
          reason: 'Промывают только квашеную капусту.',
          steps: [
            {
              phase: 'ready',
              text: 'До готовки слейте капусту и быстро промойте питьевой водой, затем хорошо отожмите. На маленькую упаковку в плане отведено около 300 мл отдельно от воды супа.',
            },
          ],
        },
        {
          id: 'curry',
          label: 'Вкус карри',
          ingredients: [i('curry', 0.5, 'ч. л.')],
          requires: ['lentil'],
          reason: 'Карри прогревают с ароматами для чечевичного супа.',
          steps: [
            {
              phase: 'prepare',
              text: 'Карри коротко прогрейте с ароматами перед добавлением воды.',
            },
          ],
        },
        {
          id: 'milk',
          label: 'Молочный вкус',
          ingredients: [i('milkPowder', 15)],
          requires: ['puree'],
          reason: 'Сухое молоко добавляют в суп-пюре.',
          steps: [
            {
              phase: 'ready',
              text: (c) =>
                has(c, 'milkPowder')
                  ? 'Сухое молоко размешайте в воде из состава без комочков.'
                  : 'Используйте всю упаковку UHT-молока вместо части воды: воды в составе уже меньше.',
            },
          ],
        },
        {
          id: 'bouillon',
          label: 'Сухой бульон',
          ingredients: [i('bouillon', 0.5, 'кубик')],
          excludes: ['broth', 'sauerkraut', 'puree'],
          reason: 'В этом супе бульон уже есть в составе.',
          steps: [
            {
              phase: 'base',
              text: 'Добавьте сухой бульон в воду блюда. Он заменяет часть соли, а не воду.',
            },
          ],
        },
        {
          id: 'seasoning',
          label: 'Соль и перец по вкусу',
          ingredients: [i('salt', 0.125, 'ч. л.'), i('pepper', 0.125, 'ч. л.')],
        },
      ],
    },
  );
}
