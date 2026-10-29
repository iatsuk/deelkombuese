import { productById } from '../data.js';
import { prepareRecipe, recipeSteps, formatAmount } from '../model.js';
import { cookingBasics, recipeUtensils } from '../cooking-guide.js';

export function buildRecipeCard(recipe, selection = {}, { crew = 1 } = {}) {
  const { choices = {}, packSizes = {}, anchorId = null, modules = [] } = selection;
  const prepared = prepareRecipe(recipe, choices, packSizes, anchorId, modules, { crew });
  const perPerson = Math.round(prepared.yieldGrams / prepared.crew);
  const notes = [];
  if (prepared.shore)
    notes.push(
      'Охлаждённые продукты: готовить сразу после покупки, сохранять холод до готовки. Не более 2 часов вне холода суммарно; выше 32 °C — 1 час.',
    );
  if (prepared.eggConditional)
    notes.push(
      'Проверьте срок и историю хранения яиц; яйца полностью приготовить. Охлаждённые яйца сохранять в холоде до этой готовки.',
    );
  if (!recipe.drySnack)
    notes.push(
      'Готовить на один раз. Открытые скоропортящиеся упаковки расходуются целиком. Без холодильника готовое блюдо — не более 2 часов, выше 32 °C — 1 час.',
    );
  if (perPerson > 750 && !recipe.drySnack)
    notes.push(
      'Выход большой для одного приёма: выберите меньшую упаковку или разделите еду с попутчиком сейчас. На следующие вахты без холодильника не оставлять.',
    );
  if (prepared.generator?.profile.thermos)
    notes.push(
      'Термос: прогреть кипятком, заполнить горячей едой почти доверху и сразу закрыть. Есть в течение 3 часов, пока еда горячая, от 60 °C.',
    );
  if (recipe.tip) notes.push(recipe.tip);
  return {
    recipeId: recipe.id,
    title: prepared.title,
    description: recipe.desc,
    time: prepared.time,
    active: prepared.active,
    yieldGrams: prepared.yieldGrams,
    crew: prepared.crew,
    burner: prepared.burner,
    perPerson,
    variants: prepared.modules.map((m) => m.label),
    utensils: recipeUtensils(recipe, prepared),
    ingredients: prepared.ingredients.map((i) => ({
      id: i.id,
      name: productById[i.id].name,
      amount: formatAmount(i.amount, i.unit),
      package: i.package
        ? `${i.package.count > 1 ? `${i.package.count} уп. ×` : 'Вся упаковка'} ${formatAmount(i.package.size, i.package.unit)}${i.package.edible !== i.package.size ? ' · количество в составе без заливки' : ''}`
        : null,
      note: i.note || null,
    })),
    water: prepared.water,
    prepWater: prepared.prepWater,
    basics: cookingBasics(recipe, prepared),
    steps: recipeSteps(recipe, choices, modules, prepared),
    notes,
    footer:
      'Вода, время и выход — ориентиры. Условия и пропорции конкретного продукта сверяйте с упаковкой. · deelstuff / Дельный камбуз',
  };
}
