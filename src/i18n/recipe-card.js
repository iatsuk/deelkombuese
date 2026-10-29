import { cookingAction } from '../cooking-visuals.js';
// Localize the display snapshot only. Never translate IDs, package quantities or selection keys.
export function localizeRecipeCard(card, translate = (value) => value, language = 'ru') {
  const localized = {
    ...card,
    language,
    title: translate(card.title),
    description: translate(card.description),
    variants: card.variants.map((value) => translate(value)),
    utensils: card.utensils.map((value) => translate(value)),
    ingredients: card.ingredients.map((item) => ({
      ...item,
      name: translate(item.name),
      amount: translate(item.amount),
      package: item.package ? translate(item.package) : null,
      note: item.note ? translate(item.note) : null,
    })),
    basics: card.basics.map((value) => translate(value)),
    steps: card.steps.map((value) => translate(value)),
    notes: card.notes.map((value) => translate(value)),
    footer: translate(card.footer),
    actions: card.steps.map((step) => {
      const action = cookingAction(step);
      return { ...action, label: translate(action.label) };
    }),
  };
  localized.labels = {
    brand: translate('ДЕЛЬНЫЙ КАМБУЗ / DEELSTUFF'),
    summary: translate(
      `${card.time} мин всего · ${card.active} мин активной работы · выход ≈ ${card.yieldGrams} г`,
    ),
    crew:
      card.crew > 1
        ? translate('Экипаж: {0}').replace('{0}', card.crew) +
          ' · ' +
          translate('≈ {0} г на человека').replace('{0}', card.perPerson)
        : null,
    selected: translate('Выбрано:') + ' ' + localized.variants.join(' · '),
    utensils: translate('ЧТО ПОНАДОБИТСЯ'),
    ingredients: translate('ПРОДУКТЫ ДЛЯ ЭТОЙ ГОТОВКИ'),
    water: translate('Питьевая вода на приготовление — около {0} мл').replace('{0}', card.water),
    prepWater: translate('Отдельно на подготовку / промывание — около {0} мл').replace(
      '{0}',
      card.prepWater,
    ),
    basics: translate('ПЕРЕД НАЧАЛОМ'),
    steps: translate('КАК ПРИГОТОВИТЬ'),
    notes: translate('ЗАМЕТКИ'),
  };
  return localized;
}
