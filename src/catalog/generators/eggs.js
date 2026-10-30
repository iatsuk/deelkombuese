// Two eggs and one technique; a sauce and a side turn them into a named dish. Without a
// fridge the eggs are broken just before cooking and white and yolk are cooked through.
const hasSide = (c, id) => c.moduleIds.has(id);
// Where the eggs go when a side is already in the pan.
const breakInto = (c) =>
  hasSide(c, 'potato')
    ? 'Сделайте в картофеле углубления и разбейте в них яйца'
    : hasSide(c, 'rice')
      ? 'Сдвиньте рис к краям и разбейте яйца в середину'
      : 'Разбейте яйца';
const pourInto = (c) =>
  c.moduleIds.has('tomato')
    ? 'Влейте их прямо в загустевшие томаты'
    : hasSide(c, 'rice')
      ? 'Влейте их к рису'
      : hasSide(c, 'potato')
        ? 'Влейте их к картофелю'
        : 'Вылейте на сковороду с маслом';
// The tomato sauce follows the form of tomatoes chosen in the ingredients.
const tomatoSauce = (c) =>
  c.ids.has('passata')
    ? 'Влейте всю пассату из упаковки и томите 5–7 минут, помешивая, пока соус не загустеет.'
    : c.ids.has('tomato')
      ? 'Нарежьте томаты и томите на сковороде 5–7 минут, пока они не размягчатся и не дадут сок.'
      : `Разведите ${c.ids.has('ketchup') ? 'весь кетчуп' : 'всю томатную пасту'} водой из состава и томите 5–7 минут, помешивая, пока соус не загустеет.`;

const EGG_STEPS = [
  {
    phase: 'prepare',
    text: 'Проверьте режим хранения яиц и целостность скорлупы. Разбейте яйца непосредственно перед готовкой; руки и поверхности после контакта со скорлупой вымойте.',
  },
  {
    phase: 'serve',
    text: 'Съешьте сразу. Разбитые яйца и готовое блюдо без холодильника на потом не оставляют.',
  },
];

export function createEggGenerator({ r, i }) {
  return r(
    'eggs-generator',
    'Генератор · яйца',
    'eggs',
    8,
    5,
    'Пять способов, соус и гарнир: от глазуньи с хлебом до шакшуки и яиц в карри.',
    [
      i('eggs', 2, 'шт.', [
        {
          id: 'eggsCold',
          amount: 2,
          unit: 'шт.',
          note: 'Охлаждённые яйца готовить сразу после покупки; соблюдать холодовую цепь.',
        },
      ]),
      i('oil', 10, 'мл'),
    ],
    0,
    [],
    {
      kind: 'generator',
      // Dish kinds the chapter covers in the recipe filter.
      kinds: ['eggs'],
      vessel: 'pan',
      meal: 'breakfast',
      mealTags: ['breakfast', 'main'],
      satiety: '2–3 ч',
      tone: 'gold',
      eggConditional: true,
      template: {
        core: ['eggs'],
        text: 'Способ задаёт технику и время, соус и гарнир — название блюда. Яйца всегда готовятся до полностью плотных белка и желтка.',
      },
      generator: {
        choiceKey: 'technique',
        slug: 'eggs',
        chapter: {
          order: 1,
          title: 'Яйца: от глазуньи до шакшуки',
          formula: 'способ + соус + гарнир',
          alt: 'Гуашь: шакшука с тремя яйцами в синей сковороде на шафрановом фоне',
          principle:
            'Два яйца и один способ: пожарить, взболтать, запечь омлетом под крышкой, потомить в соусе или обмакнуть в них хлеб. Соус и гарнир меняют блюдо, а правило без холодильника одно: разбить яйца прямо перед готовкой и довести белок и желток до полной плотности.',
        },
        // «Два яйца [пожарить глазуньей] [без соуса] [с хлебом]».
        sentence: [
          'Два яйца',
          { axis: 'base' },
          { group: 'sauce', empty: 'без соуса' },
          { group: 'side', empty: 'без гарнира' },
        ],
        bases: [
          {
            id: 'fry',
            label: 'Глазунья',
            phrase: 'пожарить глазуньей',
            time: 8,
            active: 5,
            water: 0,
            steps: [
              {
                phase: 'eggs',
                text: (c) =>
                  `Разогрейте масло на сковороде. ${breakInto(c)}. Готовьте до полностью плотных белка и желтка, при необходимости под крышкой.`,
              },
            ],
          },
          {
            id: 'poach',
            label: 'Яйца в соусе',
            phrase: 'потомить',
            time: 10,
            active: 5,
            water: 20,
            minWater: 20,
            requires: ['tomato', 'curry'],
            reason: 'Томить яйца можно только в соусе: выберите томаты или карри.',
            steps: [
              {
                phase: 'eggs',
                text: 'Сделайте в соусе углубления и разбейте в них яйца. Накройте крышкой и готовьте на слабом огне 6–8 минут до полностью плотных белка и желтка.',
              },
            ],
          },
          {
            id: 'scramble',
            label: 'Болтунья',
            phrase: 'взболтать на сковороде',
            time: 7,
            active: 5,
            water: 0,
            utensils: ['миска для смешивания'],
            steps: [
              {
                phase: 'eggs',
                text: (c) =>
                  `Взбейте яйца вилкой${c.moduleIds.has('milk') ? ' вместе с разведённым сухим молоком' : ''}. ${pourInto(c)} и помешивайте на среднем огне 3–4 минуты, пока не останется жидких участков.`,
              },
            ],
          },
          {
            id: 'omelette',
            label: 'Омлет',
            phrase: 'запечь омлетом под крышкой',
            time: 13,
            active: 4,
            water: 0,
            utensils: ['миска для смешивания'],
            steps: [
              {
                phase: 'eggs',
                text: (c) =>
                  `Взбейте яйца вилкой${c.moduleIds.has('milk') ? ' с сухим молоком, разведённым водой из состава' : ''}. Вылейте ${hasSide(c, 'potato') ? 'на подрумяненный картофель' : 'на сковороду с маслом'}, накройте крышкой и готовьте на самом слабом огне 8–10 минут, пока центр не станет плотным.`,
              },
            ],
          },
          {
            id: 'dip',
            label: 'Гренки',
            phrase: 'взбить для гренок',
            time: 12,
            active: 8,
            water: 30,
            minWater: 30,
            utensils: ['миска для смешивания'],
            noSubstitutes: ['crispbread'],
            requires: ['bread'],
            reason: 'Гренки делают из хлеба: выберите «с хлебом».',
            steps: [
              {
                phase: 'eggs',
                text: (c) =>
                  `Взбейте яйца с водой из состава${c.moduleIds.has('milk') ? ' и сухим молоком' : ''}. Обмакните ломтики хлеба с двух сторон и жарьте на масле по 2–3 минуты с каждой стороны; яйцо внутри должно полностью схватиться. Остаток смеси вылейте на сковороду и прожарьте.`,
              },
            ],
          },
        ],
        dishes: [
          { name: 'Глазунья', base: 'fry', modules: [] },
          { name: 'Яичница с хлебом', base: 'fry', modules: ['bread'], legacyId: 'eggs-bread' },
          { name: 'Картофель с яйцами', base: 'fry', modules: ['potato'] },
          { name: 'Рис с глазуньей', base: 'fry', modules: ['rice'] },
          { name: 'Болтунья', base: 'scramble', modules: [] },
          { name: 'Болтунья с хлебом', base: 'scramble', modules: ['bread'] },
          { name: 'Жареный рис с яйцом', base: 'scramble', modules: ['rice'] },
          { name: 'Менемен · болтунья с томатами', base: 'scramble', modules: ['tomato'] },
          { name: 'Омлет под крышкой', base: 'omelette', modules: [] },
          { name: 'Тортилья · картофельный омлет', base: 'omelette', modules: ['potato'] },
          { name: 'Шакшука', base: 'poach', modules: ['tomato'], legacyId: 'shakshuka' },
          { name: 'Шакшука с картофелем', base: 'poach', modules: ['tomato', 'potato'] },
          { name: 'Шакшука с хлебом', base: 'poach', modules: ['tomato', 'bread'] },
          { name: 'Яйца в карри', base: 'poach', modules: ['curry'] },
          { name: 'Яйца в карри с рисом', base: 'poach', modules: ['curry', 'rice'] },
          { name: 'Гренки', base: 'dip', modules: ['bread'] },
          {
            name: 'Французские тосты',
            base: 'dip',
            modules: ['bread', 'milk'],
            legacyId: 'french-toast',
          },
        ],
        phases: ['prepare', 'side', 'aromatics', 'sauce', 'eggs', 'finish', 'serve'],
        steps: EGG_STEPS,
        substitutesKeepLiquid: true,
        // On a passage, eggs at breakfast are sweet French toast, otherwise shakshuka.
        tripProfiles: {
          breakfast: { choices: { technique: 'dip' }, modules: ['bread', 'milk', 'honey'] },
          default: { choices: { technique: 'poach' }, modules: ['tomato', 'aromatics'] },
        },
      },
      modules: [
        {
          id: 'tomato',
          label: 'Томаты · вся пассата',
          phrase: 'в томатах',
          group: 'sauce',
          ingredients: [i('passata', 200)],
          extraMinutes: 5,
          excludes: ['fry', 'omelette', 'dip'],
          reason: 'Яйца с томатами томят в соусе или взбалтывают прямо в нём.',
          steps: [{ phase: 'sauce', text: tomatoSauce }],
        },
        {
          id: 'curry',
          label: 'Соус карри',
          phrase: 'в соусе карри',
          group: 'sauce',
          ingredients: [i('curry', 1, 'ч. л.'), i('tomatoPaste', 30)],
          waterDelta: 150,
          extraMinutes: 6,
          extraActive: 1,
          requires: ['poach'],
          reason: 'Карри — это соус: яйца в нём томят.',
          steps: [
            {
              phase: 'sauce',
              text: (c) =>
                `Прогрейте карри и ${c.ids.has('tomatoPaste') ? 'всю томатную пасту' : 'все томаты'} в масле 20 секунд, влейте воду из состава и томите 5 минут до лёгкой густоты.`,
            },
          ],
        },
        {
          id: 'bread',
          label: 'Хлеб',
          phrase: 'с хлебом',
          group: 'side',
          ingredients: [i('bread', 100)],
          steps: [
            {
              phase: 'finish',
              when: (c) => c.base !== 'dip',
              text: 'Подайте с хлебом: им удобно собрать соус и желток.',
            },
          ],
        },
        {
          id: 'potato',
          label: 'Картофель',
          phrase: 'с картофелем',
          group: 'side',
          ingredients: [i('potato', 150)],
          waterDelta: 80,
          extraMinutes: 15,
          extraActive: 4,
          steps: [
            {
              phase: 'side',
              text: (c) =>
                c.moduleIds.has('tomato')
                  ? 'Картофель нарежьте кубиками до 1 см и томите под крышкой с водой из состава 12–15 минут до мягкости. Томаты добавляйте только после этого.'
                  : 'Картофель нарежьте кубиками до 1 см. Положите в сковороду с водой из состава, накройте и тушите 12–15 минут до мягкости, затем дайте воде выпариться и подрумяньте на масле 3–5 минут.',
            },
          ],
        },
        {
          id: 'rice',
          label: 'Рис',
          phrase: 'с рисом',
          group: 'side',
          ingredients: [i('rice', 70)],
          waterDelta: 175,
          extraMinutes: 20,
          extraActive: 2,
          excludes: ['omelette', 'dip'],
          reason: 'Рис подают с глазуньей, болтуньей или яйцами в соусе.',
          steps: [
            {
              phase: 'side',
              text: 'Сначала сварите рис: отмерьте его сухой кружкой, залейте двумя такими же мерками воды из состава и готовьте под крышкой на самом слабом огне 15–18 минут, пока вода не впитается.',
            },
          ],
        },
        {
          id: 'aromatics',
          label: 'Лук и чеснок',
          ingredients: [i('driedOnion', 5), i('driedGarlic', 0.25, 'ч. л.')],
          steps: [
            {
              phase: 'aromatics',
              text: 'Коротко прогрейте в масле сухой лук и чеснок, 20–30 секунд; свежий лук обжарьте 3–5 минут.',
            },
          ],
        },
        {
          id: 'paprika',
          label: 'Паприка',
          ingredients: [i('paprika', 0.5, 'ч. л.')],
          steps: [
            {
              phase: 'aromatics',
              text: 'Добавьте паприку к маслу на несколько секунд, не давая ей потемнеть.',
            },
          ],
        },
        {
          id: 'peas',
          label: 'Горошек',
          group: 'vegetables',
          ingredients: [i('peas', 1, 'уп.')],
          extraMinutes: 2,
          steps: [
            {
              phase: 'sauce',
              text: 'Слейте жидкость из банки горошка и прогрейте всё содержимое на сковороде перед яйцами.',
            },
          ],
        },
        {
          id: 'corn',
          label: 'Кукуруза',
          group: 'vegetables',
          ingredients: [i('corn', 1, 'уп.')],
          extraMinutes: 2,
          steps: [
            {
              phase: 'sauce',
              text: 'Слейте жидкость из банки кукурузы и прогрейте всё содержимое на сковороде перед яйцами.',
            },
          ],
        },
        {
          id: 'milk',
          label: 'Сухое молоко',
          // Powder is measured by the portion; an opened carton of UHT milk would not keep.
          ingredients: [{ ...i('milkPowder', 15), noSubstitutes: ['milk'] }],
          waterDelta: 45,
          requires: ['scramble', 'omelette', 'dip'],
          reason: 'Сухое молоко добавляют во взбитые яйца.',
        },
        {
          id: 'ham',
          label: 'Ветчина · с берега',
          shore: true,
          ingredients: [i('ham', 100)],
          extraMinutes: 2,
          extraActive: 2,
          excludes: ['poach', 'honey', 'jam'],
          reason:
            'Ветчину жарят с яйцами или кладут на несладкие тосты; в соус и к мёду её не добавляют.',
          steps: [
            {
              phase: 'aromatics',
              when: (c) => c.base !== 'dip',
              text: 'Нарежьте всю упаковку ветчины и обжарьте в масле 1–2 минуты. Охлаждённую ветчину готовить в день покупки.',
            },
            {
              phase: 'finish',
              when: (c) => c.base === 'dip',
              text: 'Разложите всю упаковку ветчины по готовым тостам, накройте крышкой и прогрейте 2 минуты до горячего состояния. Охлаждённую ветчину готовить в день покупки.',
            },
          ],
        },
        {
          id: 'cheese',
          label: 'Сыр · с берега',
          shore: true,
          ingredients: [i('cheese', 100)],
          extraMinutes: 1,
          steps: [
            {
              phase: 'finish',
              text: 'Разложите всю упаковку сыра сверху в последнюю минуту под крышкой. Охлаждённый сыр готовить в день покупки.',
            },
          ],
        },
        {
          id: 'honey',
          label: 'Мёд',
          group: 'finish',
          ingredients: [i('honey', 20)],
          requires: ['dip'],
          reason: 'Мёд и варенье подают к гренкам и французским тостам.',
          steps: [{ phase: 'finish', text: 'Полейте готовые тосты мёдом перед едой.' }],
        },
        {
          id: 'jam',
          label: 'Варенье',
          group: 'finish',
          ingredients: [i('jam', 25)],
          requires: ['dip'],
          reason: 'Мёд и варенье подают к гренкам и французским тостам.',
          steps: [
            { phase: 'finish', text: 'Подайте к готовым тостам всю порционную баночку варенья.' },
          ],
        },
        {
          id: 'seasoning',
          label: 'Соль и перец по вкусу',
          ingredients: [i('salt', 0.125, 'ч. л.'), i('pepper', 0.125, 'ч. л.')],
          excludes: ['honey', 'jam'],
          reason: 'Сладкие гренки и тосты с мёдом или вареньем не солят.',
          steps: [{ phase: 'finish', text: 'Посолите и поперчите по вкусу перед подачей.' }],
        },
      ],
    },
  );
}
