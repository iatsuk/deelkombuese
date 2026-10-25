import { grainMeasuringStep, grainSimmerStep, grainDonenessStep, grainRestStep } from './cooking-guide.js';
// Одни вкусовые сочетания работают с разными основами, но техника и вода различаются.
export function createDishGenerator({r,i,oil,tomato,fish}) {
  return r('dish-generator','Генератор · паста, ризотто, картофель','pasta',16,5,
    'Основа → соус → наполнитель. Знакомые сочетания можно перенести с пасты на рис или картофель.',[
      i('pasta',100,'г',[
        {id:'risottoRice',amount:100,unit:'г',note:'Арборио или карнароли: не промывать, чтобы сохранить поверхностный крахмал. Жидкость добавлять частями; техника и время меняются.'},
        {id:'rice',amount:100,unit:'г',note:'Обычный белый рис допустим, но кремовость будет другой. Готовьте по времени на пачке; это рис с соусом по мотивам ризотто.'},
        {id:'potato',amount:300,unit:'г',note:'Кубики до 1 см. Сначала размягчить картофель под крышкой, затем вводить кислые томатные продукты.'},
      ]),i('oil',15,'мл')
    ],300,[],{kind:'generator',tone:'green',template:{core:['pasta'],text:'Вкус и наполнение можно перенести на другую основу. Время, вода и порядок приготовления пересчитываются; это походные версии знакомых сочетаний.'},
      generator:{
        bases:[
          {id:'pasta',label:'Паста',water:300,minWater:220,time:16,active:5,method:'Варить короткую пасту вместе с соусом, часто помешивая.'},
          {id:'risottoRice',label:'Ризотто',water:400,minWater:320,time:27,active:10,method:'Коротко прогреть рис в масле, затем добавлять воду частями и перемешивать.'},
          {id:'rice',label:'Рис с соусом',water:250,minWater:125,time:26,active:5,method:'Обычный белый рис впитывает воду на слабом огне под крышкой. У арборио другая техника.'},
          {id:'potato',label:'Картофель',water:180,minWater:180,time:27,active:7,method:'Нарезать кубиками, тушить под крышкой до мягкости. Томаты добавлять после этого.'},
        ],
        presets:[
          {id:'pomodoro',label:'Помодоро',modules:['sauce-tomato','herbs']},
          {id:'arrabbiata',label:'Аррабьята',modules:['sauce-tomato','chili']},
          {id:'aglio-olio',label:'Альо-олио',modules:['sauce-garlic','chili']},
          {id:'funghi',label:'Сливки и грибы',modules:['sauce-cream','mushrooms']},
          {id:'tonno',label:'Томаты и тунец',modules:['sauce-tomato','fish']},
          {id:'olive',label:'Томаты и оливки',modules:['sauce-tomato','olives','herbs']},
          {id:'piselli',label:'Горошек на бульоне',modules:['sauce-broth','bouillon','peas']},
          {id:'pesto',label:'Песто',modules:['sauce-pesto']},
          {id:'bolognese',label:'Болоньезе · с берега',shore:true,modules:['sauce-tomato','mince']},
          {id:'peanut',label:'Арахис и имбирь',modules:['sauce-peanut','ginger']},
        ],
      },
      modules:[
        {id:'sauce-broth',label:'Вода / бульон',shortLabel:'на воде или бульоне',group:'sauce',ingredients:[],instruction:'Бульон необязателен: добавьте его отдельно в разделе приправ.'},
        {id:'sauce-tomato',label:'Томатная',shortLabel:'томатный соус',group:'sauce',ingredients:[tomato()],extraMinutes:2,instruction:'Используйте всю выбранную упаковку томатов. Кетчуп слаще и кислее; паста концентрированнее пассаты.'},
        {id:'sauce-garlic',label:'Масло и чеснок',shortLabel:'масло и чеснок',group:'sauce',ingredients:[i('driedGarlic',0.25,'ч. л.')],instruction:'Чеснок прогреть с частью масла в конце, не давая подгореть.'},
        {id:'sauce-cream',label:'Сливочная / молочная',shortLabel:'сливочный или молочный соус',group:'sauce',ingredients:[i('cream',125,'мл',[
          {id:'milkPowder',amount:20,unit:'г',note:'20 г сухого молока вместо 125 мл сливок: соус менее жирный и густой. Развести частью воды из состава.'},
          {id:'milk',amount:200,unit:'мл',note:'UHT-молоко — более жидкая и менее жирная замена. Открытый пакет используется целиком.'},
        ])],extraMinutes:2,extraActive:1,instruction:'Сливки или молоко вмешать ближе к концу на слабом огне. Сухое молоко сначала развести частью рассчитанной воды.'},
        {id:'sauce-pesto',label:'Песто из маленькой банки',shortLabel:'песто',group:'sauce',ingredients:[i('pesto',90)],instruction:'Всю маленькую банку песто вмешать после снятия с огня. Открытое песто требует холода; остаток не планируется.'},
        {id:'sauce-peanut',label:'Арахисовая',shortLabel:'арахисовый соус',group:'sauce',ingredients:[i('peanutButter',35)],instruction:'Развести арахисовую пасту несколькими ложками воды из блюда и вмешать на слабом огне. Арахис — аллерген.'},
        {id:'fish',label:'Тунец / сардины',group:'protein',ingredients:[fish()],instruction:'Добавить всю банку рыбы без жидкости в конце и полностью прогреть.'},
        {id:'beans',label:'Фасоль / нут',group:'protein',ingredients:[i('beans',1,'уп.')],instruction:'Всю банку готовых бобовых без жидкости добавить в конце и прогреть.'},
        {id:'meat',label:'Мясные консервы',group:'protein',ingredients:[i('stew',1,'уп.')],instruction:'Всю мясную банку добавить в конце и полностью прогреть.'},
        {id:'soy',label:'Соевый фарш',group:'protein',ingredients:[i('soy',40)],extraMinutes:5,extraActive:2,instruction:'Текстурат восстановить по пачке, отобрав воду для этого из общего расчёта.'},
        {id:'mince',label:'Свежий фарш · с берега',group:'protein',shore:true,ingredients:[i('beef',180)],extraMinutes:7,extraActive:4,instruction:'Фарш обжарить первым. В готовом блюде проверить не менее 71 °C в центре; сохранить холодовую цепь до готовки.'},
        {id:'cheese',label:'Сыр · с берега',group:'protein',shore:true,ingredients:[i('cheese',100)],instruction:'Всю маленькую упаковку сыра вмешать в конце. До приготовления хранить в холоде.'},
        {id:'mushrooms',label:'Грибы из банки',group:'vegetables',ingredients:[i('mushrooms',1,'уп.')],instruction:'Готовые грибы из всей банки тщательно слить и полностью прогреть.'},
        {id:'peas',label:'Горошек',group:'vegetables',ingredients:[i('peas',1,'уп.')],instruction:'Весь горошек без жидкости добавить в конце и прогреть.'},
        {id:'corn',label:'Кукуруза',group:'vegetables',ingredients:[i('corn',1,'уп.')],instruction:'Всю кукурузу без жидкости добавить в конце и прогреть.'},
        {id:'olives',label:'Оливки',group:'vegetables',ingredients:[i('olives',1,'уп.')],instruction:'Всю маленькую упаковку оливок без косточек слить и добавить в конце. Учитывайте соль.'},
        {id:'onion',label:'Лук',ingredients:[i('driedOnion',5)],extraMinutes:3,extraActive:2,instruction:'Сухой лук добавить с водой; свежий нарезать и обжарить в начале 3–5 минут.'},
        {id:'herbs',label:'Итальянские травы',ingredients:[i('herbs',0.5,'ч. л.')],instruction:'Травы добавить к соусу ближе к концу.'},
        {id:'chili',label:'Чили',ingredients:[i('chili',0.125,'ч. л.')],instruction:'Чили добавлять понемногу; остроту проверить перед подачей.'},
        {id:'ginger',label:'Имбирь',ingredients:[i('driedGinger',0.25,'ч. л.')],instruction:'Выбранный имбирь добавить к соусу и прогреть.'},
        {id:'curry',label:'Карри',ingredients:[i('curry',0.5,'ч. л.')],instruction:'Карри добавить к соусу и прогреть.'},
      ]
    });
}

export function generatorProfile(recipe,choices={}) {
  return recipe.generator.bases.find(base=>base.id===(choices.pasta||'pasta'))||recipe.generator.bases[0];
}

export function generatorWater(recipe,choices,ingredients,modules,scale){
  const profile=generatorProfile(recipe,choices);
  const sauce=modules.find(m=>m.group==='sauce');
  const fractions={tomatoPaste:0.7,passata:0.9,tomato:0.9,ketchup:0.7,cream:0.6,milk:0.9};
  const sauceWater=ingredients.filter(i=>i.moduleId===sauce?.id).reduce((sum,i)=>sum+i.amount*(fractions[i.id]||0),0);
  const hydration=ingredients.filter(i=>i.id==='soy').reduce((sum,i)=>sum+i.amount*2.5,0);
  const cooking=Math.max(profile.minWater*scale,profile.water*scale-(profile.id==='potato'?0:sauceWater));
  return {water:Math.round(cooking+hydration),hydrationWater:Math.round(hydration),profile};
}

export function generatedSteps(recipe,prepared){
  const {profile,hydrationWater}=prepared.generator;
  const modules=prepared.modules;
  const sauce=modules.find(m=>m.group==='sauce');
  const ids=new Set(prepared.ingredients.map(i=>i.id));
  const cookingWater=prepared.water-hydrationWater;
  const steps=[];
  if(hydrationWater)steps.push(`До начала готовки восстановите быстрый соевый текстурат по пачке. На это в расчёте отведено ${hydrationWater} мл из общего объёма воды, а не сверх него. При другом соотношении на пачке скорректируйте воду и время.`);
  if(profile.id==='potato')steps.push('Картофель нарежьте кубиками до 1 см. Кислые томаты пока отставьте: их добавляют после размягчения картофеля.');
  if(profile.id==='risottoRice')steps.push('Арборио или карнароли не промывайте: поверхностный крахмал нужен для текстуры. Отмерьте воду, часть оставьте для постепенного доливания.');
  if(ids.has('beef'))steps.push('В этой же кастрюле сначала обжарьте фарш на части масла, разбивая комки. В конце приготовления проверьте пищевым термометром: не менее 71 °C в центре фарша.');
  if(modules.some(m=>m.id==='onion'))steps.push('Свежий лук нарежьте и обжарьте на части масла 3–5 минут. Сухой лук отправьте с водой, без длительного обжаривания.');
  if(sauce?.id==='sauce-tomato'&&profile.id!=='potato')steps.push(ids.has('tomatoPaste')?'Томатную пасту прогрейте в части масла 20 секунд.':'Всю пассату или кетчуп добавьте с жидкостью; свежие нарезанные томаты предварительно размягчите. Не обжаривайте пассату как концентрат.');
  if(profile.id==='pasta')steps.push(`Положите короткую пасту в ту же кастрюлю. Начальный объём воды для её приготовления — около ${cookingWater} мл; добавьте выбранный бульон. Варите по пачке, часто помешивая и доливая понемногу при необходимости. Отдельная варка и слив не нужны.`);
  else if(profile.id==='potato')steps.push(`Положите картофель в кастрюлю с частью масла и примерно ${cookingWater} мл воды. Если выбран бульон, добавьте его сейчас. Готовьте под крышкой 15–20 минут до полной мягкости; проверяйте дно и доливайте при высыхании.`);
  else if(profile.id==='rice'){steps.push(grainMeasuringStep({...prepared,water:cookingWater}));if(ids.has('bouillon'))steps.push('Растворите выбранный бульон в воде блюда.');steps.push(grainSimmerStep,grainDonenessStep(prepared));}
  else steps.push(`Коротко прогрейте рис в части масла около минуты. Добавьте примерно половину из ${cookingWater} мл воды и выбранный бульон, затем доливайте оставшуюся воду частями. ${profile.id==='risottoRice'?'Готовьте примерно 18–22 минуты, регулярно перемешивая, до мягкого риса и кремовой жидкости.':'Готовьте по времени на пачке до мягкости.'} При необходимости потребуется немного дополнительной воды.`);
  if(sauce?.id==='sauce-tomato'&&profile.id==='potato')steps.push('Только когда картофель полностью мягкий, добавьте все выбранные томаты, перемешайте и томите ещё несколько минут. Вода для предварительной варки не уменьшена на томатную жидкость.');
  const fillings=modules.filter(m=>m.group==='vegetables'||m.group==='protein'&&!['soy','mince'].includes(m.id));
  if(fillings.length)steps.push('Выбранные добавки: '+fillings.map(m=>m.label).join(', ')+'. Слейте жидкость из всех открываемых консервов и используйте содержимое целиком. Добавьте к мягкой основе и полностью прогрейте; сыр вмешайте в конце.');
  if(ids.has('soy'))steps.push('Добавьте весь подготовленный текстурат и полностью прогрейте вместе с основой.');
  if(sauce&&['sauce-cream','sauce-peanut','sauce-garlic','sauce-pesto'].includes(sauce.id))steps.push(sauce.instruction);
  const accents=modules.filter(m=>!m.group&&!['onion','bouillon'].includes(m.id));
  if(accents.length)steps.push(accents.map(m=>m.instruction).join(' '));
  if(profile.id==='rice')steps.push(grainRestStep);
  steps.push('Отрегулируйте густоту и соль перед подачей. Съешьте весь выход сейчас; открытые упаковки и готовое блюдо без холодильника на следующую вахту не оставлять.');
  return steps;
}
