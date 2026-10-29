import { selectionSnapshot, sameSelection, favoriteKey } from '../preferences.js';
import { cookingBasics, recipeUtensils } from '../cooking-guide.js';
import { cookingAction, grainDiagram } from '../cooking-visuals.js';
import { productById } from '../data.js';
import { formatAmount, recipeSteps, effectiveIngredients } from '../model.js';
import { icon } from './icons.js';
import { renderCrew } from './crew.js';
export function renderRecipeDialog(
  r,
  prepared,
  { state, choices, packSizes, anchorId, moduleIds, embedded = false },
) {
  // Embedded in a generator chapter, the sentence builder replaces the variants block.
  function renderGeneratorChoices(recipe, prepared) {
    const presets = recipe.generator?.presets || recipe.presets || [];
    const profiles = presets.length
      ? `<details class="generator-presets" ${recipe.generator ? '' : 'open'}><summary>${recipe.generator ? 'Готовые сочетания · ' + presets.length : 'Быстрый выбор'}</summary><div>${presets.map((p) => `<button data-action="recipe-preset" data-id="${p.id}" ${p.shore && state.mode !== 'shore' ? 'disabled' : ''}>${p.label}</button>`).join('')}</div>${recipe.generator ? '<p>Сочетание меняет соус и добавки, сохраняя выбранную основу. Названия — ориентиры вкуса для походной адаптации.</p>' : ''}</details>`
      : '';
    if (!recipe.generator) return profiles;
    return `<div class="generator-bases"><div class="module-group-label">1. Основа</div><div role="group" aria-label="Основа блюда">${recipe.generator.bases.map((base) => `<button data-action="generator-base" data-id="${base.id}" aria-pressed="${prepared.generator.profile.id === base.id}" class="${prepared.generator.profile.id === base.id ? 'active' : ''}">${base.label}</button>`).join('')}</div><p>${prepared.generator.profile.method}</p></div>${profiles}`;
  }

  function renderRecipeModules(recipe, prepared) {
    if (!recipe.modules?.length && !recipe.template) return '';
    // A generator base is a product (pasta) or a technique (fried eggs); only products are shown.
    const base = prepared.generator?.profile.id;
    const core = productById[base] ? [base] : recipe.template?.core;
    const groups = [
      ['sauce', '2. Соус', 'одна основа'],
      ['style', 'Вид супа', 'можно включить или убрать'],
      ['protein', recipe.generator ? '3. Наполнитель' : 'Наполнитель', 'один вариант или без него'],
      ['vegetables', recipe.generator ? '4. Овощи' : 'Овощи', 'можно сочетать'],
      ['finish', 'Подача', 'один вариант или без неё'],
      [null, 'Специи и добавки', 'можно сочетать'],
    ];
    const controls = groups
      .map(([group, label, note]) => {
        const modules = recipe.modules.filter((m) => (m.group || null) === group);
        if (!modules.length) return '';
        return `<div class="module-group-label">${label} <small>· ${note}</small></div><div class="module-buttons" role="group" aria-label="${label}">${modules.map((module) => `<button data-action="module" data-id="${module.id}" class="${moduleIds.includes(module.id) ? 'active' : ''}" aria-pressed="${moduleIds.includes(module.id)}" ${module.shore && state.mode !== 'shore' ? 'disabled' : ''}>${icon(moduleIds.includes(module.id) ? 'check' : 'plus')} ${module.label}${module.extraMinutes ? ` · +${module.extraMinutes} мин` : ''}</button>`).join('')}</div>`;
      })
      .join('');
    return `<section class="flexible-recipe"><div class="eyebrow small">${recipe.template ? 'Универсальное блюдо' : 'Варианты и добавки'}</div>${recipe.template ? `<div class="core-products">${core.map((id) => `<button data-action="product" data-id="${id}">${icon(productById[id].icon)} ${['tomatoPaste', 'tomato', 'passata', 'ketchup'].includes(id) ? 'Томаты' : id === 'eggs' ? 'Яйца' : id === 'milk' ? 'Молоко' : id === 'bread' ? 'Хлеб' : productById[id].name}</button>`).join('<b>+</b>')}</div><p>${recipe.template.text}</p>` : '<h3>Добавки к общей основе</h3>'}${renderGeneratorChoices(recipe, prepared)}${controls}<small>Выбор меняет состав, выход, воду и закупку. Нажмите повторно, чтобы убрать.${recipe.modules?.some((m) => m.shore) ? ' Для охлаждённых продуктов включите режим «У берега».' : ''}</small></section>`;
  }

  function recipeTools(recipe, prepared) {
    const snapshot = selectionSnapshot(recipe, choices, packSizes, anchorId, moduleIds),
      saved = state.favorites.find((f) => favoriteKey(f) === favoriteKey(snapshot)),
      same = saved && sameSelection(saved, snapshot);
    return `<div class="recipe-tools"><button class="button primary" data-action="stove">${icon('pot')} У плиты</button><button class="button secondary ${same ? 'is-favorite' : ''}" data-action="favorite-current" aria-pressed="${Boolean(same)}">${icon('star')} ${same ? 'Убрать из избранного' : saved ? 'Обновить избранное' : 'В избранное'}</button><button class="button secondary" data-action="recipe-png">${icon('download')} Скачать PNG</button><p>Звёздочка хранит один ваш вариант этого рецепта: замены, добавки и размеры упаковок. PNG сохраняет состав и шаги, которые выбраны сейчас. «У плиты» показывает по шагу на экран с таймером.</p></div>`;
  }

  function renderGrainDiagram(recipe, prepared) {
    const diagram = grainDiagram(recipe, prepared);
    if (!diagram) return '';
    return `<section class="grain-visual" aria-label="Схема приготовления крупы"><div class="eyebrow small">Мерка → вода → тихое кипение → отдых</div><div class="grain-visual-flow"><div>${icon('measure')}<strong>1 мерка крупы</strong><small>Запомнить уровень</small></div><span class="flow-symbol" aria-hidden="true">+</span><div>${icon('pour')}<strong>${diagram.waterLabel}</strong><small>≈ ${diagram.water} мл на всю готовку</small></div><span class="flow-symbol" aria-hidden="true">→</span><div>${icon('lid')}<strong>Слабый огонь</strong><small>Под закрытой крышкой</small></div><span class="flow-symbol" aria-hidden="true">→</span><div>${icon('wait')}<strong>Отдых 5 минут</strong><small>Горелка выключена</small></div></div><p>${diagram.note}</p></section>`;
  }

  function renderCookingBasics(recipe, prepared) {
    const tips = cookingBasics(recipe, prepared);
    return tips.length
      ? `<section class="cooking-basics"><h3>Перед началом</h3><ul>${tips.map((t) => `<li>${t}</li>`).join('')}</ul></section>`
      : '';
  }

  // The margin column of a cookbook page: what to expect before reading the method.
  function renderFacts(recipe, prepared) {
    const water = prepared.water || prepared.prepWater;
    const waterNote = !prepared.water
      ? 'на подготовку'
      : prepared.prepWater
        ? `и ≈ ${prepared.prepWater} мл на подготовку`
        : 'на готовку';
    const crew = prepared.crew;
    return `<dl class="recipe-facts"><div class="fact-crew"><dt>Экипаж</dt><dd>${renderCrew(crew)}<small>${crew > 1 ? 'упаковки на всех' : 'один едок'}</small></dd></div><div><dt>Время</dt><dd>${prepared.time} мин<small>с выбранными добавками</small></dd></div><div><dt>${recipe.vessel === 'cold' ? 'Подготовка' : 'У плиты'}</dt><dd>${prepared.active} мин<small>${recipe.vessel === 'cold' ? 'подготовки' : 'активной готовки'}</small></dd></div><div><dt>Выход</dt><dd>≈ ${prepared.yieldGrams} г<small>${crew > 1 ? `≈ ${Math.round(prepared.yieldGrams / crew)} г на человека` : 'выход из упаковок'}</small></dd></div>${water ? `<div><dt>Вода</dt><dd>≈ ${water} мл<small>${waterNote}</small></dd></div>` : ''}<div><dt>Посуда</dt><dd class="recipe-utensils">${recipeUtensils(
      recipe,
      prepared,
    )
      .map((item) => `<span>${item}</span>`)
      .join('')}</dd></div><div><dt>Сытость</dt><dd>≈ ${prepared.satiety}*</dd></div></dl>`;
  }
  const misses = prepared.ingredients.filter((i) => !state.pantry.includes(i.id));
  // A large yield is judged per person: a crew of two shares a bigger pot.
  const perPerson = Math.round(prepared.yieldGrams / prepared.crew);
  const isLarge = perPerson > 750 && !r.drySnack;
  const packageControls = prepared.packaged.length
    ? `<section class="package-planner"><div class="eyebrow small">Сначала упаковка — потом граммовки</div><h3>Вскрываем и расходуем целиком</h3><p>У всех скоропортящихся упаковок ниже используется всё содержимое. Сухая основа, масло и специи считаются от выбранной опорной упаковки.</p>${prepared.packaged.length > 1 ? `<label for="pack-anchor">Считать основу от</label><select id="pack-anchor">${prepared.packaged.map((i) => `<option value="${i.id}" ${i.id === prepared.anchorId ? 'selected' : ''}>${productById[i.id].name}</option>`).join('')}</select>` : ''}<div class="package-summary">${prepared.ingredients
        .filter((i) => i.package)
        .map(
          // Several packs: the name, the count and the size are separate nodes to translate.
          (i) =>
            i.package.count > 1
              ? `<span>${icon('check')} <span><span>${productById[i.id].name}</span>: <b>${i.package.count} ×</b> <span>${formatAmount(i.package.size, i.package.unit)}</span>${i.package.edible !== i.package.size ? ' <span>без жидкости</span>' : ''}</span></span>`
              : `<span>${icon('check')} ${productById[i.id].name}: ${i.package.edible !== i.package.size ? 'вся банка ' : 'все '}${formatAmount(i.package.size, i.package.unit)}${i.package.edible !== i.package.size ? ' · без жидкости' : ''}</span>`,
        )
        .join(
          '',
        )}</div><small>Масса без жидкости у консервов типовая. Выход — расчётный ориентир, а не измеренная готовая порция.</small></section>`
    : '';

  const kicker = embedded
    ? 'Получится'
    : prepared.shore
      ? 'С берега · ' + (prepared.meal === 'main' ? 'основное блюдо' : 'готовить сразу')
      : r.vessel === 'cold'
        ? 'Без плиты'
        : r.meal === 'breakfast'
          ? 'Завтрак'
          : r.vessel === 'pan'
            ? 'Сковорода'
            : 'Одна кастрюля';
  const ingredientRows = prepared.ingredients
    .map((chosen) => {
      const original = effectiveIngredients(r, moduleIds, choices).find(
        (i) => i.id === chosen.originalId,
      );
      const owned = state.pantry.includes(chosen.id);
      const name = original.alternatives.length
        ? `<label class="sr-only" for="swap-${original.id}">Заменить ${productById[original.id].name}</label><select class="ingredient-swap" id="swap-${original.id}" data-swap="${original.id}"><option value="${original.id}" ${chosen.id === original.id ? 'selected' : ''}>${productById[original.id].name}</option>${original.alternatives.map((a) => `<option value="${a.id}" ${chosen.id === a.id ? 'selected' : ''}>↔ ${productById[a.id].name}</option>`).join('')}</select>`
        : `<button class="ingredient-product" data-action="product" data-id="${chosen.id}">${productById[chosen.id].name}</button>`;
      const pack = chosen.package
        ? `<label class="pack-size-label" for="pack-${chosen.id}">Размер целой упаковки</label><select class="pack-size" id="pack-${chosen.id}" data-pack="${chosen.id}">${productById[chosen.id].packages.map((size) => `<option value="${size.size}" ${size.size === chosen.package.size ? 'selected' : ''}>${formatAmount(size.size, size.unit)}${size.edible !== size.size ? ` · ≈ ${size.edible} г без жидкости` : ''}</option>`).join('')}</select>`
        : '';
      return `<div class="ingredient-row ${owned ? 'owned' : ''}"><div class="ingredient-line">${name}<i class="leader" aria-hidden="true"></i><strong class="ingredient-amount">${formatAmount(chosen.amount, chosen.unit)}</strong></div><div class="ingredient-meta"><small>${owned ? icon('check') + ' Есть в рундуке' : 'Проверить остаток / купить'}${chosen.package ? (chosen.package.count > 1 ? ` · целых упаковок: ${chosen.package.count}` : ' · упаковка целиком') : ''}</small>${pack}</div>${chosen.note ? `<p class="substitution-note">${icon('swap')} ${chosen.note}</p>` : ''}</div>`;
    })
    .join('');
  const waterRows = `${prepared.water ? `<div class="ingredient-row water"><div class="ingredient-line"><span>${icon('drop')} ${r.generator ? 'Вода на готовку и восстановление' : 'Питьевая вода, начальный объём'}</span><i class="leader" aria-hidden="true"></i><strong class="ingredient-amount">≈ ${prepared.water} мл</strong></div></div>` : ''}${prepared.prepWater ? `<div class="ingredient-row water"><div class="ingredient-line"><span>${icon('drop')} Отдельно на подготовку / промывание</span><i class="leader" aria-hidden="true"></i><strong class="ingredient-amount">≈ ${prepared.prepWater} мл</strong></div></div>` : ''}`;
  // A generator dish or base may carry its own galley note (a flatbread is not a full meal).
  const tip = prepared.tip;
  // A generator base is a choice too, but only a real substitution needs the note.
  const substituted = Object.keys(choices).some((key) => key !== r.generator?.choiceKey);
  const steps = recipeSteps(r, choices, moduleIds, prepared)
    .map((step, n) => {
      const action = cookingAction(step);
      return `<li class="visual-cooking-step"><span class="step-number">${n + 1}</span><div class="step-copy"><span class="step-action">${icon(action.icon)} ${action.label}</span><p>${step}</p></div></li>`;
    })
    .join('');

  return `<article class="recipe-page"><header class="recipe-head ${r.tone}"><p class="recipe-kicker">${kicker}</p><h2>${prepared.title}</h2>${embedded ? '' : `<p class="recipe-lead">${r.desc}</p>`}</header>
    <div class="recipe-layout"><aside class="recipe-margin" aria-label="Коротко о блюде">${renderFacts(r, prepared)}${recipeTools(r, prepared)}</aside><div class="recipe-main">
    ${prepared.shore ? `<div class="detail-notice warning">${icon('sun')}<p>Охлаждённые продукты готовить сразу после покупки. Без холода максимум 2 часа суммарно, выше 32 °C — 1 час.</p></div>` : ''}
    ${prepared.eggConditional ? `<div class="detail-notice">${icon('egg')}<p>Для яиц проверьте возраст от кладки и историю охлаждения. Немытые неохлаждённые яйца требуют стабильной прохлады; ориентир до 18 дней от кладки не действует для жаркого рундука. Охлаждённые яйца сохранять в холоде до готовки. Белок и желток готовить полностью.</p></div>` : ''}
    ${embedded ? '' : renderRecipeModules(r, prepared)}${packageControls}${isLarge ? `<div class="detail-notice warning">${icon('person')}<p><strong>${prepared.crew > 1 ? `Выход большой: ≈ ${perPerson} г на человека.` : `Выход большой для одного приёма: примерно ${prepared.yieldGrams} г.`}</strong> Выберите меньшую упаковку или разделите готовую еду с попутчиком сейчас. Без холодильника выход этой готовки нельзя распределять на следующие вахты. Для увеличенного объёма нужны подходящая посуда и дополнительное время.${prepared.ingredients.some((i) => i.id === 'passata') && prepared.generator?.profile.id !== 'tomato' ? '<br><a class="pack-recipe-link" href="#generators/soup?base=tomato">Использовать 500 г пассаты в компактном томатном супе →</a>' : ''}</p></div>` : ''}
    <section class="detail-section ingredients-section"><h3>Состав под вашу упаковку</h3><div class="ingredient-list">${ingredientRows}${waterRows}</div>
    <p class="footnote">${r.vessel === 'cold' ? 'Только чистые руки, посуда и питьевая вода для мытья продуктов.' : 'Вода — ориентир: учитывайте испарение и добавляйте по необходимости. Соль и перец по вкусу, если не указаны в составе.'} На экипаж рецепт берёт упаковку побольше или несколько, остальное пересчитывается от неё.</p></section>
    ${renderCookingBasics(r, prepared)}${renderGrainDiagram(r, prepared)}<section class="detail-section"><h3>Как приготовить</h3><ol class="cooking-steps">${steps}</ol>${substituted ? `<div class="detail-notice">${icon('swap')}<p>Используйте выбранные ингредиенты и количества из состава выше. Свежий лук обжарьте 3–5 минут, сухие специи прогревайте несколько секунд. Пассата идёт с жидкостью, а не обжаривается как паста. Подготовку обычных сушёных овощей сверяйте с пачкой; для быстрого текстурата в генераторе заложены отдельные вода и время.</p></div>` : ''}</section>
    ${tip ? `<aside class="skipper-tip"><span>${icon('anchor')} Заметка из камбуза</span><p>${tip}</p></aside>` : ''}
    ${!r.drySnack ? `<div class="detail-notice">${icon('info')}<p>Вскрытое скоропортящееся содержимое используйте всё в текущую готовку. Готовое блюдо без холодильника — максимум 2 часа, выше 32 °C — 1 час; остатки на следующую вахту не планировать. Хлеб и сухие специи живут по своим срокам после открытия.</p></div>` : ''}<p class="footnote">Сытость ≈ ${prepared.satiety}* для обычной порции блюда, не для всего увеличенного выхода. Ориентир условный.</p>
    </div></div>
    <div class="recipe-sticky"><div><strong>${misses.length ? 'Проверить / купить: ' + misses.length : 'Всё есть в рундуке'}</strong><small>${prepared.packaged.length ? 'Размеры упаковок сохранятся в закупке' : 'Количество продуктов — в составе выше'}</small></div><button class="button primary" data-action="add-plan" data-id="${r.id}">${icon('bag')} ${state.view === 'planner' ? 'В закупку отдельно' : 'В закупку'}</button></div></article>`;
}
