// Batter on the pan: flour, oats or grated potato become a batter of different thickness.
// Each base brings its own ingredients, water and method; one flavour finishes the dish.
// Raw batter is never tasted, the middle is cooked through and all of it is cooked at once.
const bowl = 'миска для смешивания';

const BATTER_STEPS = [
  {
    phase: 'serve',
    text: (c) =>
      c.ids.has('eggs') || c.ids.has('eggsCold')
        ? 'Съешьте сразу; смесь с сырым яйцом и готовые блины без холодильника не хранят.'
        : 'Съешьте сразу: тесто и готовое без холодильника на следующую вахту не оставляют.',
  },
];
// Toppings for thin pancakes and fritters.
const forPancakes = (reason) => ({ requires: ['crepes', 'fritters'], reason });

export function createBatterGenerator({ r, i, fish }) {
  return r(
    'batter-generator',
    'Генератор · тесто',
    'flour',
    18,
    10,
    'Мука, хлопья или тёртый картофель: от тонких блинов и оладий до овсяных котлет, драников и лепёшки.',
    [],
    0,
    [],
    {
      kind: 'generator',
      // Dish kinds the chapter covers in the recipe filter.
      kinds: ['pancakes'],
      vessel: 'pan',
      meal: 'breakfast',
      mealTags: ['breakfast', 'snack', 'main'],
      satiety: '3–4 ч',
      tone: 'gold',
      template: {
        core: ['flour'],
        text: 'Основа задаёт состав, воду и густоту теста, вкус — подачу или начинку. Сырое тесто не пробуют.',
      },
      generator: {
        choiceKey: 'technique',
        slug: 'batter',
        chapter: {
          order: 6,
          title: 'Тесто на сковороде: блины, оладьи, котлеты',
          formula: 'тесто + вкус',
          alt: 'Гуашь: оладьи в синей сковороде, миска жидкого теста с венчиком, баночка мёда и бумажный пакет муки на камбузе',
          principle:
            'Мука, хлопья или тёртый картофель становятся тестом разной густоты: жидкое растекается тонкими блинами, густое держится оладьями, плотное лепится в котлеты, драники и лепёшки. Сырое тесто не пробуют, середину доводят до полной готовности, а всё тесто пекут за одну готовку.',
        },
        // «На сковороде: [тонкие блины] [с мёдом]».
        sentence: ['На сковороде:', { axis: 'base' }, { group: 'flavour', empty: 'без добавок' }],
        bases: [
          {
            id: 'crepes',
            label: 'Тонкие блины',
            phrase: 'тонкие блины',
            ingredients: [
              i('flour', 90),
              i('eggs', 1, 'шт.', [
                {
                  id: 'eggsCold',
                  amount: 1,
                  unit: 'шт.',
                  note: 'Холодовую цепь сохранять до готовки.',
                },
              ]),
              i('oil', 10, 'мл'),
            ],
            water: 180,
            time: 22,
            active: 14,
            utensils: [bowl],
            steps: [
              {
                phase: 'mix',
                text: 'Смешайте в миске яйцо, воду и муку до гладкого жидкого теста; часть масла вмешайте в тесто. Дайте постоять 5 минут. Сырое тесто не пробуйте.',
              },
              {
                phase: 'cook',
                text: 'Слегка смажьте разогретую сковороду оставшимся маслом. Наливайте тонким слоем и пеките примерно 1–2 минуты с каждой стороны до полностью приготовленного теста. Регулируйте нагрев и густоту понемногу водой. Испеките всё тесто.',
              },
            ],
          },
          {
            id: 'fritters',
            label: 'Оладьи',
            phrase: 'оладьи без кефира',
            ingredients: [i('flour', 100), i('bakingPowder', 4), i('oil', 15, 'мл')],
            water: 120,
            time: 18,
            active: 10,
            utensils: [bowl],
            steps: [
              {
                phase: 'mix',
                text: 'В миске смешайте муку с разрыхлителем, затем добавьте воду и треть масла. Получится густое тесто, медленно сползающее с ложки. Не пробуйте сырым.',
              },
              {
                phase: 'cook',
                text: 'Выкладывайте небольшие оладьи в сковороду с оставшимся маслом. Жарьте на умеренном огне примерно 3–4 минуты с каждой стороны; при необходимости под крышкой, чтобы середина пропеклась.',
              },
              {
                phase: 'check',
                text: 'Разломите один оладушек: внутри не должно быть липкого сырого теста. Приготовьте всё тесто.',
              },
            ],
          },
          {
            id: 'oat-fritters',
            label: 'Овсяные оладьи',
            phrase: 'овсяные оладьи',
            ingredients: [i('oats', 70), i('flour', 30), i('bakingPowder', 3), i('oil', 15, 'мл')],
            water: 160,
            time: 25,
            active: 12,
            utensils: [bowl],
            steps: [
              {
                phase: 'soak',
                text: 'Залейте мелкие быстрые хлопья тёплой питьевой водой в миске и дайте набухнуть 8–10 минут. Плотные хлопья требуют больше времени; для быстрой версии выбирайте мелкие.',
              },
              {
                phase: 'cook',
                text: 'Вмешайте муку, разрыхлитель и выбранные добавки. Жарьте небольшие плоские оладьи на масле примерно 3–4 минуты с каждой стороны на умеренном огне. Сырую мучную смесь не пробуйте.',
              },
              {
                phase: 'check',
                text: 'Проверьте полную готовность середины и приготовьте всю массу.',
              },
            ],
          },
          {
            id: 'oat-cutlets',
            label: 'Овсяные котлеты',
            phrase: 'овсяные котлеты',
            ingredients: [
              i('oats', 80),
              i('flour', 20),
              i('driedOnion', 5),
              i('paprika', 0.5, 'ч. л.'),
              i('oil', 15, 'мл'),
            ],
            water: 130,
            time: 25,
            active: 12,
            utensils: [bowl],
            steps: [
              {
                phase: 'soak',
                text: 'Залейте мелкие быстрые хлопья кипятком в миске, добавьте лук и паприку. Накройте на 8–10 минут: масса должна стать плотной, без свободной воды.',
              },
              {
                phase: 'cook',
                text: 'Вмешайте муку. Влажной ложкой сформируйте плоские котлеты толщиной до 1 см и обжарьте на масле примерно 4–5 минут с каждой стороны. Сырое тесто не пробуйте.',
              },
              {
                phase: 'check',
                text: 'Доведите середину до полной готовности на умеренном огне, при необходимости под крышкой. Пожарьте все котлеты в эту готовку.',
              },
            ],
          },
          {
            id: 'potato-pancakes',
            label: 'Драники',
            phrase: 'драники без яйца',
            ingredients: [i('potato', 300), i('flour', 25), i('driedOnion', 4), i('oil', 15, 'мл')],
            water: 0,
            time: 25,
            active: 14,
            grated: true,
            utensils: [bowl, 'тёрка'],
            steps: [
              {
                phase: 'mix',
                text: 'Натрите картофель в миску. Слегка отожмите лишнюю жидкость, вмешайте муку и сушёный лук. Сырое тесто не пробуйте.',
              },
              {
                phase: 'cook',
                text: 'Выкладывайте ложкой на сковороду с маслом и расплющивайте до 5–7 мм. Жарьте на умеренном огне примерно 4–5 минут с каждой стороны, при необходимости коротко под крышкой.',
              },
              {
                phase: 'check',
                text: 'Проверьте, что картофель внутри полностью мягкий, а мучной середины нет. Пожарьте все драники в эту готовку.',
              },
            ],
          },
          {
            id: 'flatbread',
            label: 'Лепёшка',
            phrase: 'лепёшки',
            ingredients: [i('flour', 100), i('oil', 10, 'мл')],
            water: 60,
            time: 18,
            active: 10,
            satiety: '2–3 ч',
            tip: 'Лепёшка — основа, а не полноценный обед. Добавьте белок, например маленькую банку рыбы.',
            steps: [
              {
                phase: 'mix',
                text: 'Смешайте муку, питьевую воду, масло и щепотку соли прямо в холодной чистой сковороде. Замесите ложкой, затем руками; сырое тесто не пробуйте.',
              },
              {
                phase: 'mix',
                text: 'Выньте тесто на чистую тарелку, дайте отдохнуть 5 минут и разделите на две тонкие лепёшки.',
              },
              {
                phase: 'cook',
                text: 'На сухой разогретой сковороде выпекайте по 2–3 минуты с каждой стороны. Лепёшки должны пропечься внутри.',
              },
            ],
          },
        ],
        dishes: [
          { name: 'Тонкие блины', base: 'crepes', modules: [], legacyId: 'pancakes' },
          {
            name: 'Блины с ветчиной и сыром',
            base: 'crepes',
            modules: ['ham-cheese'],
            shore: true,
          },
          { name: 'Оладьи', base: 'fritters', modules: [], legacyId: 'fritters' },
          { name: 'Овсяные оладьи', base: 'oat-fritters', modules: [], legacyId: 'oat-fritters' },
          { name: 'Овсяные оладьи с кукурузой', base: 'oat-fritters', modules: ['corn'] },
          { name: 'Овсяные котлеты', base: 'oat-cutlets', modules: [], legacyId: 'oat-cutlets' },
          { name: 'Овсяные котлеты с рыбой', base: 'oat-cutlets', modules: ['fish'] },
          { name: 'Овсяные котлеты с фасолью', base: 'oat-cutlets', modules: ['beans'] },
          { name: 'Драники', base: 'potato-pancakes', modules: [], legacyId: 'potato-pancakes' },
          { name: 'Драники с рыбой', base: 'potato-pancakes', modules: ['fish'] },
          { name: 'Лепёшка', base: 'flatbread', modules: [], legacyId: 'flatbread' },
        ],
        phases: ['prepare', 'soak', 'mix', 'cook', 'check', 'top', 'serve'],
        steps: BATTER_STEPS,
        substitutesKeepLiquid: true,
        // Passage breakfasts: fritters with honey, oat fritters with raisins on day four;
        // as a main meal, oat cutlets.
        tripProfiles: {
          '4-breakfast': { choices: { technique: 'oat-fritters' }, modules: ['sweet'] },
          breakfast: { choices: { technique: 'fritters' }, modules: ['honey'] },
          default: { choices: { technique: 'oat-cutlets' }, modules: [] },
        },
      },
      modules: [
        {
          id: 'honey',
          label: 'Мёд',
          phrase: 'с мёдом',
          group: 'flavour',
          ingredients: [i('honey', 20)],
          ...forPancakes('Мёд и варенье подают к блинам и оладьям.'),
          steps: [{ phase: 'top', text: 'Подайте готовое блюдо с мёдом.' }],
        },
        {
          id: 'jam',
          label: 'Варенье',
          phrase: 'с вареньем',
          group: 'flavour',
          ingredients: [i('jam', 25)],
          ...forPancakes('Мёд и варенье подают к блинам и оладьям.'),
          steps: [{ phase: 'top', text: 'Используйте всю порционную баночку варенья при подаче.' }],
        },
        {
          id: 'ham-cheese',
          label: 'Ветчина и сыр · с берега',
          phrase: 'с ветчиной и сыром',
          group: 'flavour',
          shore: true,
          meal: 'main',
          ingredients: [i('ham', 100), i('cheese', 100)],
          extraMinutes: 3,
          extraActive: 2,
          ...forPancakes('Ветчину с сыром кладут на готовые блины и оладьи.'),
          steps: [
            {
              phase: 'top',
              text: 'Всю небольшую упаковку ветчины и сыра распределите по готовым изделиям и прогрейте под крышкой. Готовить в день покупки с сохранением холодовой цепи.',
            },
          ],
        },
        {
          id: 'sweet',
          label: 'Изюм и мёд',
          phrase: 'с изюмом и мёдом',
          group: 'flavour',
          ingredients: [i('raisins', 20), i('honey', 15)],
          requires: ['oat-fritters'],
          reason: 'Изюм с мёдом вмешивают в овсяные оладьи.',
          steps: [
            { phase: 'mix', text: 'Изюм вмешайте в тесто, мёд оставьте для готовых оладий.' },
          ],
        },
        {
          id: 'corn',
          label: 'Кукуруза и лук',
          phrase: 'с кукурузой и луком',
          group: 'flavour',
          ingredients: [i('corn', 1, 'уп.'), i('driedOnion', 4)],
          waterDelta: -20,
          extraMinutes: 3,
          extraActive: 2,
          requires: ['oat-fritters'],
          reason: 'Кукурузу с луком вмешивают в овсяные оладьи.',
          steps: [
            {
              phase: 'mix',
              text: 'Всю банку кукурузы тщательно слейте и вмешайте с луком в тесто. Масса должна держаться на ложке; при избытке жидкости подсыпьте немного муки.',
            },
          ],
        },
        {
          id: 'fish',
          label: 'Рыба из банки',
          phrase: 'с рыбой',
          group: 'flavour',
          ingredients: [fish()],
          // Fish mixed into cutlets replaces some of their water; potato pancakes have none.
          waterDelta: -20,
          requires: ['oat-cutlets', 'potato-pancakes'],
          reason: 'Рыбу вмешивают в овсяные котлеты или подают к драникам.',
          steps: [
            {
              phase: 'mix',
              when: (c) => c.base === 'oat-cutlets',
              text: 'Тщательно слейте всю банку рыбы, разомните и вмешайте в овсяную массу перед формованием.',
            },
            {
              phase: 'top',
              when: (c) => c.base !== 'oat-cutlets',
              text: 'Всю банку рыбы подайте к готовым драникам; открытую банку не оставляйте на потом.',
            },
          ],
        },
        {
          id: 'beans',
          label: 'Фасоль или нут',
          phrase: 'с фасолью',
          group: 'flavour',
          ingredients: [i('beans', 1, 'уп.')],
          waterDelta: -20,
          requires: ['oat-cutlets'],
          reason: 'Размятую фасоль или нут вмешивают в овсяные котлеты.',
          steps: [
            {
              phase: 'mix',
              text: 'Всю маленькую банку фасоли или нута слейте, разомните и вмешайте перед формованием. Если масса влажная, добавьте немного муки.',
            },
          ],
        },
        {
          id: 'milk',
          label: 'Молочный вкус',
          ingredients: [i('milkPowder', 15)],
          ingredientsByBase: { crepes: [i('milkPowder', 20)] },
          requires: ['crepes', 'fritters', 'oat-fritters'],
          reason: 'Сухое молоко размешивают в жидком тесте блинов и оладий.',
          steps: [
            {
              phase: 'prepare',
              text: (c) =>
                c.ids.has('milkPowder')
                  ? 'Сухое молоко сначала размешайте в воде из состава без комочков: тесто замешивается на этом молоке.'
                  : c.cookingWater
                    ? 'Смешайте всю упаковку UHT-молока с водой из состава: тесто замешивается на этой смеси.'
                    : 'Вместо воды используйте всю упаковку UHT-молока.',
            },
          ],
        },
        {
          id: 'garlic',
          label: 'Чеснок',
          ingredients: [i('driedGarlic', 0.25, 'ч. л.')],
          requires: ['potato-pancakes'],
          reason: 'Чеснок вмешивают в картофельную массу драников.',
          steps: [
            {
              phase: 'mix',
              text: 'Вмешайте выбранный чеснок в картофельную массу перед жаркой.',
            },
          ],
        },
        {
          id: 'seasoning',
          label: 'Соль и перец по вкусу',
          ingredients: [i('salt', 0.125, 'ч. л.'), i('pepper', 0.125, 'ч. л.')],
          requires: ['oat-cutlets', 'potato-pancakes'],
          reason: 'Соль и перец добавляют в котлеты и драники.',
          steps: [
            {
              phase: 'mix',
              text: 'Посолите и поперчите массу перед жаркой; сырую массу не пробуйте.',
            },
          ],
        },
      ],
    },
  );
}
