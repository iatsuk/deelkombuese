// Volume hints for cooks without scales. Grams per household measure come from USDA FoodData
// Central, SR Legacy (food_portion.csv, April 2018); a US cup is 236.588 ml, a tablespoon 14.787 ml
// and a teaspoon 4.929 ml. The galley mug is 250 ml and its spoons 15 and 5 ml, filled level. The
// grams stay the measure every recipe is calculated in; a hint only stands next to them.
//
// Left out on purpose: milk powder (instant 68 g and regular 120 g a cup are too far apart), short
// pasta (64–122 g a cup by shape), dried carrot and soy mince (no USDA measure), whole packs and
// fresh produce.
const ml = { cup: 236.588, tbsp: 14.787, tsp: 4.929 };
export const MUG_ML = 250;
// Said wherever a hint appears: the recipe page, the stove and the PNG card.
export const MEASURE_LEGEND = 'Мерки: кружка 250 мл, ложки 15 и 5 мл без горки; граммы точнее.';

// [grams, per measure, FoodData Central id, note]
const usda = {
  oats: [81, 'cup', 173904],
  rice: [185, 'cup', 168877],
  risottoRice: [195, 'cup', 168879, 'medium-grain'],
  buckwheat: [164, 'cup', 170685],
  couscous: [173, 'cup', 169699],
  lentils: [192, 'cup', 172420, 'lentils in general, not red lentils alone'],
  flour: [125, 'cup', 168894, 'scooped straight from the bag, flour packs denser and weighs more'],
  peanuts: [146, 'cup', 173806],
  raisins: [145, 'cup', 168165, 'not packed'],
  honey: [21, 'tbsp', 169640],
  peanutButter: [16, 'tbsp', 172470],
  bakingPowder: [4.6, 'tsp', 172803],
  driedOnion: [5, 'tbsp', 170002],
};
export const volumeMeasures = Object.fromEntries(
  Object.entries(usda).map(([id, [grams, per, fdcId, note = null]]) => [
    id,
    { grams, per, fdcId, note, density: grams / ml[per], mugGrams: (grams / ml[per]) * MUG_ML },
  ]),
);

// An unmarked mug and a level spoon carry about ten per cent of error, so a hint keeps to
// quarters of a mug, half tablespoons and teaspoons in quarters up to one, then in halves, and
// says nothing below ¼ tsp. A tablespoon starts at 14 ml, so a US tablespoon reads as one.
const glyphs = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
const fraction = (value) => {
  const whole = Math.floor(value);
  const part = glyphs[Math.round((value - whole) * 4) / 4] || '';
  return whole ? `${whole}${part}` : part;
};
// «½ кружки», «1 кружка», «1½ кружки», «2 кружки», «5 кружек».
const mugs = (value) =>
  !Number.isInteger(value) || (value % 10 >= 2 && value % 10 <= 4 && (value < 12 || value > 14))
    ? 'кружки'
    : value % 10 === 1 && value !== 11
      ? 'кружка'
      : 'кружек';

// The Russian source text of a hint for an amount in grams, or null; views translate it.
export function volumeHint(productId, amount, unit) {
  const measure = volumeMeasures[productId];
  if (!measure || unit !== 'г' || !(amount > 0)) return null;
  const volume = amount / measure.density;
  if (volume >= 60) {
    const count = Math.round((volume / MUG_ML) * 4) / 4;
    return `≈ ${fraction(count)} ${mugs(count)}`;
  }
  if (volume >= 14) return `≈ ${fraction(Math.max(1, Math.round((volume / 15) * 2) / 2))} ст. л.`;
  const exact = volume / 5;
  const teaspoons = exact > 1 ? Math.round(exact * 2) / 2 : Math.round(exact * 4) / 4;
  return teaspoons >= 0.25 ? `≈ ${fraction(teaspoons)} ч. л.` : null;
}
