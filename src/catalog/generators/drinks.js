// A mug for the watch: tea, a ginger drink, cocoa on milk powder, a mug of broth and compote from
// dried fruit, all from the dry stock. The water comes from the drinking stock and the passage
// planner already counts it and the kettle's gas, so the chapter stays out of the planner and its
// budgets (`drink`, `meal: 'drink'`).
const sweet = {
  requires: ['tea', 'ginger', 'compote'],
  reason: 'Мёд и сахар кладут в чай, имбирный напиток и компот; какао уже с сахаром.',
};

export function createDrinksGenerator({ r, i }) {
  return r(
    'drinks-generator',
    'Генератор · напитки',
    'tea',
    5,
    1,
    'Чай, имбирный напиток, какао, бульон в кружке и компот из сухофруктов — горячее на ночную вахту из сухого запаса.',
    [],
    0,
    [],
    {
      kind: 'generator',
      kinds: ['drink'],
      vessel: 'pot',
      meal: 'drink',
      mealTags: [],
      drink: true,
      satiety: 'до 1 ч',
      tone: 'brown',
      template: {
        core: ['tea'],
        text: 'Основа задаёт напиток, мёд или сахар — сладость. Вода — из питьевого запаса.',
      },
      generator: {
        choiceKey: 'technique',
        slug: 'drinks',
        chapter: {
          order: 9,
          title: 'Кружка на вахту: чай, какао, бульон',
          formula: 'основа + сладкое',
          alt: 'Гуашь: синий эмалированный чайник с паром на тёплом коричневом фоне',
          principle:
            'Ночная вахта длинная, и горячая кружка помогает не замёрзнуть и не заснуть. Чай, имбирный напиток, какао на сухом молоке, бульон с сухарями и компот из сухофруктов готовятся из сухого запаса за несколько минут. Вода берётся из питьевого запаса: план похода уже учитывает её и газ на чайник. В качку наливайте кружку не доверху.',
        },
        // «Кружка на вахту: [чай] [с мёдом]».
        sentence: ['Кружка на вахту:', { axis: 'base' }, { group: 'sweet', empty: 'без сладкого' }],
        bases: [
          {
            id: 'tea',
            seaState: 'heavy',
            // Only boils water, as the planner's kettle allowance already assumes.
            kettle: true,
            label: 'Чай',
            phrase: 'чай',
            ingredients: [i('tea', 1, 'шт.')],
            water: 250,
            time: 5,
            active: 1,
            burner: 3,
            satiety: 'не насыщает',
            steps: [
              {
                phase: 'brew',
                text: 'Залейте пакетик кипятком в кружке и дайте настояться 3–5 минут, затем выньте пакетик.',
              },
            ],
          },
          {
            id: 'ginger',
            seaState: 'heavy',
            // Only boils water, as the planner's kettle allowance already assumes.
            kettle: true,
            label: 'Имбирный напиток',
            phrase: 'имбирный напиток',
            ingredients: [i('driedGinger', 0.5, 'ч. л.')],
            water: 250,
            time: 8,
            active: 2,
            burner: 3,
            satiety: 'не насыщает',
            steps: [
              {
                phase: 'brew',
                text: (c) =>
                  c.ids.has('ginger')
                    ? 'Свежий имбирь натрите или нарежьте тонкими пластинками, залейте кипятком и дайте настояться 5 минут под блюдцем.'
                    : 'Залейте сухой имбирь кипятком, размешайте и дайте настояться 5 минут под блюдцем.',
              },
            ],
          },
          {
            id: 'cocoa',
            seaState: 'heavy',
            // Only boils water, as the planner's kettle allowance already assumes.
            kettle: true,
            label: 'Какао',
            phrase: 'какао',
            ingredients: [i('cocoa', 10), i('sugar', 10), i('milkPowder', 25)],
            // A swap to UHT milk takes a whole 250 ml carton: one full mug, not half of one.
            defaultPacks: { milk: 250 },
            water: 250,
            time: 6,
            active: 3,
            burner: 3,
            satiety: '1–2 ч',
            steps: [
              {
                phase: 'cook',
                when: (c) => !c.ids.has('milkPowder'),
                text: 'Подогрейте всё молоко с водой из состава в кастрюле почти до кипения.',
              },
              {
                phase: 'mix',
                text: (c) =>
                  c.ids.has('milkPowder')
                    ? 'Смешайте в кружке какао, сахар и сухое молоко и разотрите с 2–3 ложками горячей воды в гладкую пасту без комочков.'
                    : 'Смешайте в кружке какао и сахар и разотрите с 2–3 ложками горячего молока в гладкую пасту без комочков.',
              },
              {
                phase: 'mix',
                text: (c) =>
                  c.ids.has('milkPowder')
                    ? 'Долейте остальной кипяток, всё время помешивая.'
                    : 'Долейте остальное горячее молоко, всё время помешивая.',
              },
            ],
          },
          {
            id: 'broth',
            seaState: 'heavy',
            // Only boils water, as the planner's kettle allowance already assumes.
            kettle: true,
            label: 'Бульон в кружке',
            phrase: 'бульон в кружке',
            ingredients: [i('bouillon', 0.5, 'кубик'), i('crispbread', 20)],
            water: 250,
            time: 4,
            active: 1,
            burner: 3,
            satiety: '1–2 ч',
            steps: [
              {
                phase: 'brew',
                text: 'Растворите полкубика бульона в кружке кипятка и хорошо размешайте.',
              },
              {
                phase: 'serve',
                text: 'Сухари подайте отдельно и макайте в бульон. Бульон солёный: досаливать не нужно.',
              },
            ],
          },
          {
            id: 'compote',
            seaState: 'underway',
            label: 'Компот из сухофруктов',
            phrase: 'компот из сухофруктов',
            ingredients: [i('driedFruit', 30)],
            water: 300,
            prepWater: 200,
            time: 22,
            active: 3,
            burner: 12,
            satiety: 'до 1 ч',
            steps: [
              { phase: 'prepare', text: 'Промойте сухофрукты в отдельной воде.' },
              {
                phase: 'cook',
                text: 'Залейте сухофрукты водой из состава, доведите до кипения и варите под крышкой на слабом огне 10 минут.',
              },
              {
                phase: 'steep',
                text: 'Снимите с огня и дайте настояться под крышкой 10 минут.',
              },
              {
                phase: 'serve',
                text: 'Пейте тёплым; разваренные сухофрукты можно съесть.',
              },
            ],
          },
        ],
        // One dish of each base comes first, so the contents line names every base.
        dishes: [
          { name: 'Чай с мёдом', base: 'tea', modules: ['honey'] },
          { name: 'Какао', base: 'cocoa', modules: [] },
          { name: 'Бульон с сухарями', base: 'broth', modules: [] },
          { name: 'Компот из сухофруктов', base: 'compote', modules: [] },
          { name: 'Имбирный напиток с мёдом', base: 'ginger', modules: ['honey'] },
          { name: 'Сладкий чай', base: 'tea', modules: ['sugar'] },
          { name: 'Чай с имбирём', base: 'tea', modules: ['tea-ginger'], slug: 'tea-ginger' },
          {
            name: 'Чай с имбирём и мёдом',
            base: 'tea',
            modules: ['tea-ginger', 'honey'],
            slug: 'tea-ginger-honey',
          },
          {
            name: 'Сладкий чай с имбирём',
            base: 'tea',
            modules: ['tea-ginger', 'sugar'],
            slug: 'tea-ginger-sugar',
          },
          { name: 'Компот с мёдом', base: 'compote', modules: ['honey'] },
        ],
        phases: ['prepare', 'boil', 'cook', 'brew', 'mix', 'steep', 'sweeten', 'serve'],
        steps: [
          {
            phase: 'boil',
            // Compote boils with its fruit; cocoa on UHT milk heats the milk instead.
            when: (c) => c.base !== 'compote' && (c.base !== 'cocoa' || c.ids.has('milkPowder')),
            text: 'Вскипятите питьевую воду из состава в чайнике или кастрюле под крышкой.',
          },
          {
            phase: 'serve',
            text: 'Наливайте кружку не доверху и держите её в руке или в держателе: в качку кипяток выплёскивается. Чайник ставьте в ограждение плиты.',
          },
        ],
        // Whole UHT milk instead of milk powder keeps its own liquid.
        substitutesKeepLiquid: true,
      },
      modules: [
        {
          id: 'honey',
          label: 'Мёд',
          phrase: 'с мёдом',
          group: 'sweet',
          ingredients: [i('honey', 15)],
          ...sweet,
          steps: [{ phase: 'sweeten', text: 'Положите мёд в чуть остывший напиток и размешайте.' }],
        },
        {
          id: 'sugar',
          label: 'Сахар',
          phrase: 'с сахаром',
          group: 'sweet',
          ingredients: [i('sugar', 10)],
          ...sweet,
          steps: [{ phase: 'sweeten', text: 'Положите сахар и размешайте.' }],
        },
        {
          id: 'tea-ginger',
          label: 'Имбирь',
          phrase: 'с имбирём',
          ingredients: [i('driedGinger', 0.25, 'ч. л.')],
          requires: ['tea'],
          reason: 'Имбирь добавляют в чай; в имбирном напитке он уже основа.',
          steps: [{ phase: 'brew', text: 'Добавьте имбирь в кружку вместе с пакетиком чая.' }],
        },
      ],
    },
  );
}
