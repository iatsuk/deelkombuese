// The crew size (1–4) scales recipes, the trip menu, water and the shopping list. The same
// control appears beside the recipe facts, in the planner and in the shopping list.
export const crewSizes = [1, 2, 3, 4];

export function renderCrew(crew) {
  return `<div class="crew-buttons" role="group" aria-label="Экипаж">${crewSizes
    .map(
      (n) =>
        `<button data-action="crew" data-id="${n}" class="${crew === n ? 'active' : ''}" aria-pressed="${crew === n}">${n}</button>`,
    )
    .join('')}</div>`;
}
