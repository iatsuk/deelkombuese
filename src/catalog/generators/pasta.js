import {
  grainMeasuringStep,
  grainSimmerStep,
  grainDonenessStep,
  grainRestStep,
} from '../../cooking-guide.js';

const tomatoSauce = (c) => c.sauce?.id === 'sauce-tomato';
// Phase-ordered method shared by all bases; acidic tomatoes join potatoes only after they soften.
const PASTA_STEPS = [
  {
    phase: 'prepare',
    when: (c) => c.hydrationWater,
    text: (c) =>
      `До начала готовки восстановите быстрый соевый текстурат по пачке. На это в расчёте отведено ${c.hydrationWater} мл из общего объёма воды, а не сверх него. При другом соотношении на пачке скорректируйте воду и время.`,
  },
  {
    phase: 'prepare',
    when: (c) => c.base === 'potato',
    text: 'Картофель нарежьте кубиками до 1 см. Кислые томаты пока отставьте: их добавляют после размягчения картофеля.',
  },
  {
    phase: 'prepare',
    when: (c) => c.base === 'risottoRice',
    text: 'Арборио или карнароли не промывайте: поверхностный крахмал нужен для текстуры. Отмерьте воду, часть оставьте для постепенного доливания.',
  },
  {
    phase: 'fry',
    when: (c) => c.ids.has('beef'),
    text: 'В этой же кастрюле сначала обжарьте фарш на части масла, разбивая комки. В конце приготовления проверьте пищевым термометром: не менее 71 °C в центре фарша.',
  },
  {
    phase: 'fry',
    when: (c) => c.moduleIds.has('onion'),
    text: 'Свежий лук нарежьте и обжарьте на части масла 3–5 минут. Сухой лук отправьте с водой, без длительного обжаривания.',
  },
  {
    phase: 'sauce',
    when: (c) => tomatoSauce(c) && c.base !== 'potato',
    text: (c) =>
      c.ids.has('tomatoPaste')
        ? 'Томатную пасту прогрейте в части масла 20 секунд.'
        : 'Всю пассату или кетчуп добавьте с жидкостью; свежие нарезанные томаты предварительно размягчите. Не обжаривайте пассату как концентрат.',
  },
  {
    phase: 'cook',
    when: (c) => c.base === 'pasta',
    text: (c) =>
      `Положите короткую пасту в ту же кастрюлю. Начальный объём воды для её приготовления — около ${c.cookingWater} мл; добавьте выбранный бульон. Варите по пачке, часто помешивая и доливая понемногу при необходимости. Отдельная варка и слив не нужны.`,
  },
  {
    phase: 'cook',
    when: (c) => c.base === 'potato',
    text: (c) =>
      `Положите картофель в кастрюлю с частью масла и примерно ${c.cookingWater} мл воды. Если выбран бульон, добавьте его сейчас. Готовьте под крышкой 15–20 минут до полной мягкости; проверяйте дно и доливайте при высыхании.`,
  },
  {
    phase: 'cook',
    when: (c) => c.base === 'rice',
    text: (c) => [
      grainMeasuringStep({ ...c.prepared, water: c.cookingWater }),
      c.ids.has('bouillon') ? 'Растворите выбранный бульон в воде блюда.' : null,
      grainSimmerStep,
      grainDonenessStep(c.prepared),
    ],
  },
  {
    phase: 'cook',
    when: (c) => c.base === 'risottoRice',
    text: (c) =>
      `Коротко прогрейте рис в части масла около минуты. Добавьте примерно половину из ${c.cookingWater} мл воды и выбранный бульон, затем доливайте оставшуюся воду частями. Готовьте примерно 18–22 минуты, регулярно перемешивая, до мягкого риса и кремовой жидкости. При необходимости потребуется немного дополнительной воды.`,
  },
  {
    phase: 'after',
    when: (c) => tomatoSauce(c) && c.base === 'potato',
    text: 'Только когда картофель полностью мягкий, добавьте все выбранные томаты, перемешайте и томите ещё несколько минут. Вода для предварительной варки не уменьшена на томатную жидкость.',
  },
  {
    phase: 'add',
    text: (c) => {
      const fillings = c.modules.filter(
        (m) =>
          m.group === 'vegetables' || (m.group === 'protein' && !['soy', 'mince'].includes(m.id)),
      );
      return fillings.length
        ? 'Выбранные добавки: ' +
            fillings.map((m) => m.label).join(', ') +
            '. Слейте жидкость из всех открываемых консервов и используйте содержимое целиком. Добавьте к мягкой основе и полностью прогрейте; сыр вмешайте в конце.'
        : null;
    },
  },
  {
    phase: 'add',
    when: (c) => c.ids.has('soy'),
    text: 'Добавьте весь подготовленный текстурат и полностью прогрейте вместе с основой.',
  },
  {
    phase: 'finish',
    when: (c) =>
      ['sauce-cream', 'sauce-peanut', 'sauce-garlic', 'sauce-pesto'].includes(c.sauce?.id),
    text: (c) => c.sauce.instruction,
  },
  {
    phase: 'accents',
    text: (c) =>
      c.modules
        .filter((m) => !m.group && !['onion', 'bouillon'].includes(m.id))
        .map((m) => m.instruction)
        .join(' ') || null,
  },
  { phase: 'rest', when: (c) => c.base === 'rice', text: grainRestStep },
  {
    phase: 'serve',
    text: 'Отрегулируйте густоту и соль перед подачей. Съешьте весь выход сейчас; открытые упаковки и готовое блюдо без холодильника на следующую вахту не оставлять.',
  },
];

// Pasta, risotto, rice or potatoes with one sauce and filling. Each base keeps its own
// technique and water; flavour combinations move between bases.
export function createPastaGenerator({ r, i, tomato, fish }) {
  return r(
    'dish-generator',
    'Генератор · паста, ризотто, картофель',
    'pasta',
    16,
    5,
    'Основа → соус → наполнитель. Знакомые сочетания можно перенести с пасты на рис или картофель.',
    [
      i('pasta', 100, 'г', [
        {
          id: 'risottoRice',
          amount: 100,
          unit: 'г',
          note: 'Арборио или карнароли: не промывать, чтобы сохранить поверхностный крахмал. Жидкость добавлять частями; техника и время меняются.',
        },
        {
          id: 'rice',
          amount: 100,
          unit: 'г',
          note: 'Обычный белый рис допустим, но кремовость будет другой. Готовьте по времени на пачке; это рис с соусом по мотивам ризотто.',
        },
        {
          id: 'potato',
          amount: 300,
          unit: 'г',
          note: 'Кубики до 1 см. Сначала размягчить картофель под крышкой, затем вводить кислые томатные продукты.',
        },
      ]),
      i('oil', 15, 'мл'),
    ],
    300,
    [],
    {
      kind: 'generator',
      // Dish kinds the chapter covers in the recipe filter.
      kinds: ['pasta'],
      tone: 'green',
      template: {
        core: ['pasta'],
        text: 'Вкус и наполнение можно перенести на другую основу. Время, вода и порядок приготовления пересчитываются; это походные версии знакомых сочетаний.',
      },
      generator: {
        choiceKey: 'pasta',
        slug: 'pasta',
        chapter: {
          order: 3,
          title: 'Паста, ризотто, картофель',
          formula: 'основа + соус + наполнитель',
          alt: 'Гуашь: паста в томатном соусе с тунцом в синей кастрюле, банка тунца и банка с пастой на камбузе',
          principle:
            'Соус и наполнитель переходят с одной основы на другую, а техника остаётся у основы. Короткая паста варится прямо в соусе, ризотто получает воду частями, рис впитывает её под крышкой, а картофель сначала размягчается — томаты идут в него только потом.',
        },
        // The sentence reads «Приготовить [пасту] [в томатном соусе] [с тунцом]».
        sentence: [
          'Приготовить',
          { axis: 'base' },
          { group: 'sauce' },
          { group: 'protein', empty: 'без наполнителя' },
        ],
        defaultModules: ['sauce-broth'],
        bases: [
          {
            id: 'pasta',
            phrase: 'пасту',
            label: 'Паста',
            water: 300,
            minWater: 220,
            time: 16,
            active: 5,
            method: 'Варить короткую пасту вместе с соусом, часто помешивая.',
          },
          {
            id: 'risottoRice',
            phrase: 'ризотто',
            label: 'Ризотто',
            water: 400,
            minWater: 320,
            time: 27,
            active: 10,
            method: 'Коротко прогреть рис в масле, затем добавлять воду частями и перемешивать.',
          },
          {
            id: 'rice',
            phrase: 'рис',
            label: 'Рис с соусом',
            absorption: true,
            water: 250,
            minWater: 125,
            time: 26,
            active: 5,
            // The rice rests 5 minutes off the heat.
            burner: 21,
            method:
              'Обычный белый рис впитывает воду на слабом огне под крышкой. У арборио другая техника.',
          },
          {
            id: 'potato',
            phrase: 'картофель',
            label: 'Картофель',
            sauceCredit: false,
            water: 180,
            minWater: 180,
            time: 27,
            active: 7,
            method:
              'Нарезать кубиками, тушить под крышкой до мягкости. Томаты добавлять после этого.',
          },
        ],
        presets: [
          { id: 'pomodoro', label: 'Помодоро', modules: ['sauce-tomato', 'herbs'] },
          { id: 'arrabbiata', label: 'Аррабьята', modules: ['sauce-tomato', 'chili'] },
          { id: 'aglio-olio', label: 'Альо-олио', modules: ['sauce-garlic', 'chili'] },
          { id: 'funghi', label: 'Сливки и грибы', modules: ['sauce-cream', 'mushrooms'] },
          { id: 'tonno', label: 'Томаты и тунец', modules: ['sauce-tomato', 'fish'] },
          { id: 'olive', label: 'Томаты и оливки', modules: ['sauce-tomato', 'olives', 'herbs'] },
          {
            id: 'piselli',
            label: 'Горошек на бульоне',
            modules: ['sauce-broth', 'bouillon', 'peas'],
          },
          { id: 'pesto', label: 'Песто', modules: ['sauce-pesto'] },
          {
            id: 'bolognese',
            label: 'Болоньезе · с берега',
            shore: true,
            modules: ['sauce-tomato', 'mince'],
          },
          { id: 'peanut', label: 'Арахис и имбирь', modules: ['sauce-peanut', 'ginger'] },
        ],
        // Passage dinners rotate familiar flavours; day 7 uses risotto rice.
        tripProfiles: {
          1: { modules: ['sauce-tomato', 'fish'] },
          3: { modules: ['sauce-garlic', 'beans'] },
          5: { modules: ['sauce-peanut', 'ginger'] },
          7: {
            modules: ['sauce-cream', 'peas'],
            choices: { cream: 'milkPowder', pasta: 'risottoRice' },
          },
          default: { modules: ['sauce-broth', 'mushrooms'] },
        },
        phases: [
          'prepare',
          'fry',
          'sauce',
          'cook',
          'after',
          'add',
          'finish',
          'accents',
          'rest',
          'serve',
        ],
        steps: PASTA_STEPS,
      },
      modules: [
        {
          id: 'sauce-broth',
          phrase: 'на воде или бульоне',
          label: 'Вода / бульон',
          shortLabel: 'на воде или бульоне',
          group: 'sauce',
          ingredients: [],
          instruction: 'Бульон необязателен: добавьте его отдельно в разделе приправ.',
        },
        {
          id: 'sauce-tomato',
          phrase: 'в томатном соусе',
          label: 'Томатная',
          shortLabel: 'томатный соус',
          group: 'sauce',
          ingredients: [tomato()],
          extraMinutes: 2,
          instruction:
            'Используйте всю выбранную упаковку томатов. Кетчуп слаще и кислее; паста концентрированнее пассаты.',
        },
        {
          id: 'sauce-garlic',
          phrase: 'с маслом и чесноком',
          label: 'Масло и чеснок',
          shortLabel: 'масло и чеснок',
          group: 'sauce',
          ingredients: [i('driedGarlic', 0.25, 'ч. л.')],
          instruction: 'Чеснок прогреть с частью масла в конце, не давая подгореть.',
        },
        {
          id: 'sauce-cream',
          phrase: 'в сливочном или молочном соусе',
          label: 'Сливочная / молочная',
          shortLabel: 'сливочный или молочный соус',
          titleLabel: 'сливочный соус',
          titleByChoice: { cream: { milkPowder: 'молочный соус', milk: 'молочный соус' } },
          group: 'sauce',
          ingredients: [
            i('cream', 125, 'мл', [
              {
                id: 'milkPowder',
                amount: 20,
                unit: 'г',
                note: '20 г сухого молока вместо 125 мл сливок: соус менее жирный и густой. Развести частью воды из состава.',
              },
              {
                id: 'milk',
                amount: 200,
                unit: 'мл',
                note: 'UHT-молоко — более жидкая и менее жирная замена. Открытый пакет используется целиком.',
              },
            ]),
          ],
          extraMinutes: 2,
          extraActive: 1,
          instruction:
            'Сливки или молоко вмешать ближе к концу на слабом огне. Сухое молоко сначала развести частью рассчитанной воды.',
        },
        {
          id: 'sauce-pesto',
          phrase: 'с песто',
          label: 'Песто из маленькой банки',
          shortLabel: 'песто',
          group: 'sauce',
          ingredients: [i('pesto', 90)],
          instruction:
            'Всю маленькую банку песто вмешать после снятия с огня. Открытое песто требует холода; остаток не планируется.',
        },
        {
          id: 'sauce-peanut',
          phrase: 'в арахисовом соусе',
          label: 'Арахисовая',
          shortLabel: 'арахисовый соус',
          group: 'sauce',
          ingredients: [i('peanutButter', 35)],
          instruction:
            'Развести арахисовую пасту несколькими ложками воды из блюда и вмешать на слабом огне. Арахис — аллерген.',
        },
        {
          id: 'fish',
          phrase: 'с тунцом или сардинами',
          label: 'Тунец / сардины',
          group: 'protein',
          ingredients: [fish()],
          instruction: 'Добавить всю банку рыбы без жидкости в конце и полностью прогреть.',
        },
        {
          id: 'beans',
          phrase: 'с фасолью или нутом',
          label: 'Фасоль / нут',
          group: 'protein',
          ingredients: [i('beans', 1, 'уп.')],
          instruction: 'Всю банку готовых бобовых без жидкости добавить в конце и прогреть.',
        },
        {
          id: 'meat',
          phrase: 'с мясными консервами',
          label: 'Мясные консервы',
          group: 'protein',
          ingredients: [i('stew', 1, 'уп.')],
          instruction: 'Всю мясную банку добавить в конце и полностью прогреть.',
        },
        {
          id: 'soy',
          phrase: 'с соевым фаршем',
          label: 'Соевый фарш',
          group: 'protein',
          ingredients: [i('soy', 40)],
          extraMinutes: 5,
          extraActive: 2,
          instruction: 'Текстурат восстановить по пачке, отобрав воду для этого из общего расчёта.',
        },
        {
          id: 'mince',
          phrase: 'с фаршем · с берега',
          label: 'Свежий фарш · с берега',
          group: 'protein',
          shore: true,
          ingredients: [i('beef', 180)],
          extraMinutes: 7,
          extraActive: 4,
          instruction:
            'Фарш обжарить первым. В готовом блюде проверить не менее 71 °C в центре; сохранить холодовую цепь до готовки.',
        },
        {
          id: 'cheese',
          phrase: 'с сыром · с берега',
          label: 'Сыр · с берега',
          group: 'protein',
          shore: true,
          ingredients: [i('cheese', 100)],
          instruction:
            'Всю маленькую упаковку сыра вмешать в конце. До приготовления хранить в холоде.',
        },
        {
          id: 'mushrooms',
          label: 'Грибы из банки',
          group: 'vegetables',
          ingredients: [i('mushrooms', 1, 'уп.')],
          instruction: 'Готовые грибы из всей банки тщательно слить и полностью прогреть.',
        },
        {
          id: 'peas',
          label: 'Горошек',
          group: 'vegetables',
          ingredients: [i('peas', 1, 'уп.')],
          instruction: 'Весь горошек без жидкости добавить в конце и прогреть.',
        },
        {
          id: 'corn',
          label: 'Кукуруза',
          group: 'vegetables',
          ingredients: [i('corn', 1, 'уп.')],
          instruction: 'Всю кукурузу без жидкости добавить в конце и прогреть.',
        },
        {
          id: 'olives',
          label: 'Оливки',
          group: 'vegetables',
          ingredients: [i('olives', 1, 'уп.')],
          instruction:
            'Всю маленькую упаковку оливок без косточек слить и добавить в конце. Учитывайте соль.',
        },
        {
          id: 'onion',
          label: 'Лук',
          ingredients: [i('driedOnion', 5)],
          extraMinutes: 3,
          extraActive: 2,
          instruction: 'Сухой лук добавить с водой; свежий нарезать и обжарить в начале 3–5 минут.',
        },
        {
          id: 'herbs',
          label: 'Итальянские травы',
          ingredients: [i('herbs', 0.5, 'ч. л.')],
          instruction: 'Травы добавить к соусу ближе к концу.',
        },
        {
          id: 'chili',
          label: 'Чили',
          ingredients: [i('chili', 0.125, 'ч. л.')],
          instruction: 'Чили добавлять понемногу; остроту проверить перед подачей.',
        },
        {
          id: 'ginger',
          label: 'Имбирь',
          ingredients: [i('driedGinger', 0.25, 'ч. л.')],
          instruction: 'Выбранный имбирь добавить к соусу и прогреть.',
        },
        {
          id: 'curry',
          label: 'Карри',
          ingredients: [i('curry', 0.5, 'ч. л.')],
          instruction: 'Карри добавить к соусу и прогреть.',
        },
      ],
    },
  );
}
