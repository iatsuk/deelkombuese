// Breakfast and the watch: oats, peanuts and raisins from the dry stock become hot porridge in a
// pot, crisp muesli on a pan or a mix measured into a bag; ready rolls warm on a dry pan. Each
// base cooks in its own vessel. The numbers are those of the four former recipes.
export function createBreakfastGenerator({ r, i }) {
  return r(
    'breakfast-generator',
    'Генератор · завтрак',
    'oats',
    10,
    3,
    'Овсяная каша, мюсли на сковороде, тёплые булочки и сухая смесь на вахту — из хлопьев, орехов и изюма.',
    [],
    0,
    [],
    {
      kind: 'generator',
      // Dish kinds the chapter covers in the recipe filter.
      kinds: ['porridge', 'bread', 'snack'],
      // The chapter's own vessel stands in only where a base names none.
      vessel: 'pot',
      meal: 'breakfast',
      mealTags: ['breakfast', 'snack'],
      satiety: '2–4 ч',
      tone: 'brown',
      template: {
        core: ['oats'],
        text: 'Основа задаёт посуду и способ, сладкая добавка — вкус каши.',
      },
      generator: {
        choiceKey: 'technique',
        slug: 'breakfast',
        chapter: {
          order: 1,
          title: 'Завтрак и вахта: каша, мюсли, булочки',
          formula: 'основа + сладкое',
          alt: 'Гуашь: синяя кастрюлька с длинной ручкой и горкой овсянки с изюмом и арахисом на лавандовом фоне',
          principle:
            'Утро перед выходом и ночная вахта просят простой еды из сухого запаса. Хлопья, арахис и изюм становятся горячей кашей в кастрюле, хрустящими мюсли на сковороде или смесью, отмеренной в пакет, а готовые булочки греются на сухой сковороде. Мёд, варенье и сухое молоко меняют вкус каши. Учитывайте аллергию на арахис.',
        },
        // «На завтрак и вахту: [овсяная каша] [с мёдом]».
        sentence: [
          'На завтрак и вахту:',
          { axis: 'base' },
          { group: 'sweet', empty: 'без сладкого' },
        ],
        bases: [
          {
            id: 'porridge',
            label: 'Овсяная каша',
            phrase: 'овсяная каша',
            ingredients: [i('oats', 80), i('peanuts', 30), i('raisins', 25)],
            water: 300,
            time: 10,
            active: 3,
            burner: 8,
            satiety: '2–4 ч',
            vessel: 'pot',
            steps: [
              { phase: 'cook', text: 'Вскипятите питьевую воду, всыпьте хлопья и изюм.' },
              {
                phase: 'cook',
                text: 'Варите по инструкции хлопьев, обычно 3–7 минут, помешивая. Для плотных хлопьев может понадобиться больше времени и воды.',
              },
              {
                phase: 'finish',
                text: 'Выключите огонь. Добавьте арахис и щепотку соли. Дайте постоять 1–2 минуты.',
              },
            ],
          },
          {
            id: 'muesli',
            label: 'Мюсли на сковороде',
            phrase: 'мюсли на сковороде',
            ingredients: [
              i('oats', 60),
              i('peanuts', 25),
              i('raisins', 20),
              i('honey', 15),
              i('oil', 5, 'мл'),
            ],
            water: 0,
            time: 10,
            active: 6,
            satiety: '2–3 ч',
            vessel: 'pan',
            steps: [
              {
                phase: 'cook',
                text: 'Используйте хлопья, которые производитель разрешает есть без варки. На слабом огне прогрейте их с маслом 4–5 минут, часто перемешивая; не давайте подгореть.',
              },
              {
                phase: 'finish',
                text: 'Добавьте арахис, прогрейте ещё минуту. Снимите с огня и вмешайте изюм и мёд.',
              },
              {
                phase: 'serve',
                text: 'Дайте немного остыть и съешьте. Это порция для текущего завтрака, а не проверенная технология заготовки гранолы на сезон.',
              },
            ],
          },
          {
            id: 'mix',
            label: 'Смесь на вахту',
            phrase: 'смесь на вахту',
            ingredients: [i('peanuts', 40), i('raisins', 30)],
            water: 0,
            time: 1,
            active: 1,
            satiety: '1–2 ч',
            vessel: 'cold',
            meal: 'snack',
            drySnack: true,
            steps: [
              {
                phase: 'prepare',
                text: 'Отмерьте сухие арахис и изюм в чистый сухой zip-lock. Смешайте.',
              },
              {
                phase: 'prepare',
                text: 'Закройте и держите вдали от солёных брызг; не брать мокрыми руками.',
              },
              {
                phase: 'serve',
                text: 'Это перекус, а не замена обеду. Учитывайте аллергию на арахис.',
              },
            ],
          },
          {
            id: 'rolls',
            label: 'Тёплые булочки',
            phrase: 'тёплые булочки',
            ingredients: [
              i('rolls', 100),
              i('oil', 15, 'мл'),
              i('driedGarlic', 0.125, 'ч. л.'),
              i('salt', 0.125, 'ч. л.'),
              i('pepper', 0.125, 'ч. л.'),
            ],
            water: 0,
            time: 7,
            active: 3,
            satiety: '1–2 ч',
            vessel: 'pan',
            steps: [
              {
                phase: 'prepare',
                text: 'Откройте пакет полностью выпеченных булок. Все булочки разрежьте вдоль.',
              },
              {
                phase: 'cook',
                text: 'Прогрейте срезом вниз на сухой сковороде 2–3 минуты, затем ещё 1–2 минуты на слабом огне под крышкой. Это разогрев готового хлеба, не выпечка сырого теста.',
              },
              {
                phase: 'serve',
                text: 'Смешайте масло с сухим чесноком, солью и перцем непосредственно перед едой. Смажьте тёплые булки и съешьте.',
              },
            ],
          },
        ],
        dishes: [
          { name: 'Овсянка с арахисом', base: 'porridge', modules: [], legacyId: 'oatmeal' },
          { name: 'Овсянка с арахисом и мёдом', base: 'porridge', modules: ['honey'] },
          { name: 'Овсянка с арахисом и вареньем', base: 'porridge', modules: ['jam'] },
          {
            name: 'Молочная овсянка с арахисом',
            base: 'porridge',
            modules: ['milkPowder'],
            // The module id keeps the former oatmeal's camel case; addresses stay lower case.
            slug: 'porridge-milk',
          },
          {
            name: 'Хлопья на сковороде · быстрые мюсли',
            base: 'muesli',
            modules: [],
            legacyId: 'pan-muesli',
          },
          { name: 'Арахис и изюм на вахту', base: 'mix', modules: [], legacyId: 'nuts-raisins' },
          {
            name: 'Тёплые булочки на сковороде',
            base: 'rolls',
            modules: [],
            legacyId: 'warm-rolls',
          },
        ],
        phases: ['prepare', 'cook', 'finish', 'top', 'serve'],
        steps: [],
        // Whole UHT milk instead of milk powder keeps its own liquid, as in the former oatmeal.
        substitutesKeepLiquid: true,
        // Passage breakfasts: porridge, muesli on day six; the snack is the watch mix.
        tripProfiles: {
          '6-breakfast': { choices: { technique: 'muesli' }, modules: [] },
          snack: { choices: { technique: 'mix' }, modules: [] },
          default: { choices: { technique: 'porridge' }, modules: [] },
        },
      },
      modules: [
        {
          id: 'honey',
          label: 'Мёд',
          phrase: 'с мёдом',
          group: 'sweet',
          ingredients: [i('honey', 15)],
          requires: ['porridge'],
          reason: 'Мёд, варенье и сухое молоко добавляют в кашу.',
          steps: [{ phase: 'top', text: 'Добавьте мёд в готовую кашу.' }],
        },
        {
          id: 'jam',
          label: 'Варенье',
          phrase: 'с вареньем',
          group: 'sweet',
          ingredients: [i('jam', 25)],
          requires: ['porridge'],
          reason: 'Мёд, варенье и сухое молоко добавляют в кашу.',
          steps: [
            { phase: 'top', text: 'Вмешайте в готовую кашу всю порционную баночку варенья.' },
          ],
        },
        {
          id: 'milkPowder',
          label: 'Сухое молоко',
          phrase: 'на молоке',
          ingredients: [i('milkPowder', 20)],
          requires: ['porridge'],
          reason: 'Мёд, варенье и сухое молоко добавляют в кашу.',
          steps: [
            {
              phase: 'prepare',
              text: (c) =>
                c.ids.has('milkPowder')
                  ? 'Размешайте сухое молоко в воде для каши без комочков. Используйте тот же объём воды, что указан в составе.'
                  : 'Смешайте всю упаковку UHT-молока с водой из состава: на этой смеси и варите кашу.',
            },
          ],
        },
      ],
    },
  );
}
