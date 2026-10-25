import test from 'node:test';
import assert from 'node:assert/strict';
import {products,productById,productFamilies,recipes,recipeById} from '../src/data.js';
import {recipeMatches,choicesForSelection,prepareRecipe,sortProducts,storageDays,recipeSteps,shoppingItems} from '../src/model.js';
import {buildTrip,buildSeason,waterBudget} from '../src/planner.js';

test('Граф сужается по И, учитывая замены и необязательный картофель',()=>{
  const eggs=recipes.filter(r=>recipeMatches(r,['eggs']));
  const tomatoes=eggs.filter(r=>recipeMatches(r,['eggs','ketchup']));
  const potato=tomatoes.filter(r=>recipeMatches(r,['eggs','ketchup','potato']));
  assert.ok(eggs.length>tomatoes.length);assert.ok(tomatoes.length>=potato.length);
  assert.ok(potato.some(r=>r.id==='shakshuka'));
  const inferred=choicesForSelection(recipeById.shakshuka,['eggs','tomatoPaste','potato']);
  assert.equal(inferred.choices.passata,'tomatoPaste');assert.ok(inferred.modules.includes('potato'));
});
test('Шакшука без картофеля и с ним имеет разные состав, воду и время',()=>{
  const plain=prepareRecipe(recipeById.shakshuka);
  const potato=prepareRecipe(recipeById.shakshuka,{}, {},null,['potato']);
  assert.ok(!plain.ingredients.some(i=>i.id==='potato'));
  assert.ok(potato.ingredients.some(i=>i.id==='potato'));
  assert.ok(potato.water>plain.water);assert.ok(potato.time>plain.time);
  assert.ok(recipeSteps(recipeById.shakshuka,{},['potato']).some(s=>s.includes('12–18')));
});
test('У французских тостов меняется подача, но сохраняется обязательная основа',()=>{
  const base=prepareRecipe(recipeById['french-toast']);
  for(const id of ['bread','eggs','milk'])assert.ok(base.ingredients.some(i=>i.id===id));
  assert.ok(!base.ingredients.some(i=>i.id==='honey'||i.id==='ham'));
  const sweet=prepareRecipe(recipeById['french-toast'],{}, {},null,['honey']);
  assert.ok(sweet.ingredients.some(i=>i.id==='honey'));
  const savoury=prepareRecipe(recipeById['french-toast'],{}, {},null,['honey','ham-cheese']);
  assert.equal(savoury.shore,true);assert.ok(!savoury.ingredients.some(i=>i.id==='honey'));
  for(const id of ['ham','cheese'])assert.equal(savoury.ingredients.find(i=>i.id===id).package.count,1);
  assert.equal(recipeMatches(recipeById['french-toast'],['honey','ham']),false);
});
test('В рецептах все томатные формы связаны, но хлебцы не подменяют мягкий хлеб для тостов',()=>{
  for(const recipe of recipes){for(const i of recipe.ingredients){if(['passata','tomatoPaste','tomato','ketchup'].includes(i.id))for(const id of ['passata','tomatoPaste','tomato','ketchup'])assert.ok(i.id===id||i.alternatives.some(a=>a.id===id),`${recipe.id}:${id}`);}}
  assert.equal(recipeMatches(recipeById['french-toast'],['crispbread']),false);
  for(const p of products)assert.ok(p.role,p.id);
  for(const f of productFamilies)for(const id of f.members)assert.ok(productById[id]);
});
test('Кокосовое молоко не требуется карри и далу, но доступно как целая добавка',()=>{
  for(const id of ['curry','dal']){assert.ok(!prepareRecipe(recipeById[id]).ingredients.some(i=>i.id==='coconut'));assert.ok(prepareRecipe(recipeById[id],{}, {},null,['coconut']).ingredients.some(i=>i.id==='coconut'&&i.package.count===1));}
});
test('Сортировка сравнивает сроки численно и меняет направление',()=>{
  const items=[productById.rice,productById.milk,productById.bread];
  const sorted=sortProducts(items,'after','asc');
  assert.equal(sorted[0].id,'milk');assert.equal(sorted.at(-1).id,'rice');
  assert.deepEqual(sortProducts(items,'after','desc').map(p=>p.id),sorted.map(p=>p.id).reverse());
  assert.equal(storageDays('≤ 2 ч / 1 ч в жару'),2/24);assert.equal(storageDays('1–3 мес.'),30);
});
test('Меню на каждый срок 1–7 дней имеет четыре блюда в день и расход всех покупок',()=>{
  for(let days=1;days<=7;days++){
    const plan=buildTrip({days});assert.equal(plan.entries.length,days*4);
    for(const entry of plan.entries){const p=prepareRecipe(recipeById[entry.recipeId],entry.choices,entry.packSizes,entry.anchorId,entry.modules);assert.equal(p.shore,false);assert.ok(!p.ingredients.some(i=>['eggs','coconut'].includes(i.id)));for(const i of p.ingredients.filter(i=>i.package))assert.equal(i.amount,i.package.edible);}
    for(const item of plan.items){assert.ok(plan.uses[item.id].length,item.id);assert.ok(item.amount>0);assert.ok(item.leftover>=0);}
    assert.ok(plan.water.total>plan.water.drinking);assert.ok(plan.water.buyLitres>=plan.water.total);
  }
});
test('Питьё, рецепт, подготовка, бытовой расход и резерв не смешиваются',()=>{
  const entry={recipeId:'oatmeal',choices:{},packSizes:{},modules:[],count:1};
  const w=waterBudget([entry],{days:1,drinkLitres:3,washLitres:1,reservePct:25});
  assert.equal(w.drinking,3);assert.equal(w.washing,1);assert.equal(w.cooking,0.3);assert.equal(w.preparation,0);assert.equal(w.total,4.3*1.25);
  assert.equal(waterBudget([entry],{days:1,drinkLitres:3,washLitres:0,reservePct:0}).total,3.3);
});
test('При разрешённых яйцах сухое молоко получает воду для восстановления',()=>{
  const plan=buildTrip({days:1,includeEggs:true});
  const toast=plan.entries.find(e=>e.recipeId==='french-toast');assert.ok(toast);
  const p=prepareRecipe(recipeById[toast.recipeId],toast.choices,toast.packSizes,toast.anchorId,toast.modules);
  assert.equal(p.ingredients.find(i=>i.id==='milkPowder').amount,12.5);assert.equal(p.water,113);
});
test('Сезонный набор исключает охлаждённые и редкие добавки, все позиции имеют рецепты',()=>{
  const season=buildSeason(90);
  assert.ok(season.items.some(i=>i.id==='bouillon'));
  for(const item of season.items){assert.ok(!['coconut','ham','cheese','eggs','milk'].includes(item.id));assert.ok(season.uses[item.id].length,item.id);}
  assert.ok(buildSeason(120).items.find(i=>i.id==='rice').amount>season.items.find(i=>i.id==='rice').amount);
  assert.equal(season.items.find(i=>i.id==='peanuts').refillDays,30);
  assert.equal(season.items.find(i=>i.id==='peanuts').amount,3);
});
test('Перенос сезонного набора сохраняет число упаковок, а не одну упаковку на продукт',()=>{
  const season=buildSeason(90);
  const cart=shoppingItems([],[],season.items);
  for(const planned of season.items){const actual=cart.find(i=>i.key===planned.key);assert.ok(actual,planned.id);assert.equal(actual.amount,planned.amount,planned.id);}
  assert.ok(cart.find(i=>i.id==='rice').amount>1);
});
