import { recipeById } from '../data.js';
import { recipeProductIds } from '../model.js';
export function drawGraph(state) {
  const root = document.querySelector('.ingredient-network');
  if (!root) return;
  const svg = root.querySelector('.network-lines');
  const rect = root.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${root.clientWidth} ${root.clientHeight}`);
  svg.setAttribute('width', String(root.clientWidth));
  svg.setAttribute('height', String(root.scrollHeight));
  const cards = [...root.querySelectorAll('[data-graph-recipe]')];
  let focus = cards.find((c) => c.dataset.graphRecipe === state.graphFocus) || null;
  const edges = [];
  const connected = new Set();
  const targets = state.graphSelected.length ? cards : focus ? [focus] : [];
  for (const target of targets) {
    const recipe = recipeById[target.dataset.graphRecipe];
    const tr = target.getBoundingClientRect();
    const required = new Set(
      recipe.ingredients.flatMap((i) => [i.id, ...i.alternatives.map((a) => a.id)]),
    );
    const ids = state.graphSelected.length
      ? state.graphSelected
      : [
          ...recipe.ingredients.map((i) => i.id),
          ...(recipe.modules || []).flatMap((m) => m.ingredients.map((i) => i.id)),
        ];
    for (const id of ids) {
      if (!recipeProductIds(recipe).includes(id)) continue;
      const node = root.querySelector(`[data-product-node="${id}"]`);
      if (!node || !node.getClientRects().length) continue;
      const nr = node.getBoundingClientRect();
      const x1 = nr.left + nr.width / 2 - rect.left,
        y1 = nr.bottom - rect.top,
        x2 = tr.left + tr.width / 2 - rect.left,
        y2 = tr.top - rect.top;
      const optional = !required.has(id);
      connected.add(id);
      edges.push(
        `<path class="${optional ? 'optional' : ''}" d="M${x1},${y1} C${x1},${y1 + 40} ${x2},${y2 - 45} ${x2},${y2}"/>`,
      );
    }
  }
  svg.innerHTML = edges.join('');
  root
    .querySelectorAll('[data-product-node]')
    .forEach((n) => n.classList.toggle('connected', connected.has(n.dataset.productNode)));
  cards.forEach((c) => {
    const active = c === focus;
    c.classList.toggle('focused', active);
    c.querySelector('.graph-focus').setAttribute('aria-pressed', String(active));
  });
}
