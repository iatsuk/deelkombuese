import { generators } from '../../data.js';
import { optionBlocked } from '../../model.js';
import { generatorProfile } from '../../generator-engine.js';
import { routeHash } from '../../state/session.js';
import { renderRecipeDialog } from '../recipe-dialog.js';
import { icon, esc } from '../icons.js';
import { t, plural } from '../../i18n/runtime.js';

const knownDishes = (recipe) => recipe.generator.dishes || recipe.generator.presets || [];
// Each chapter has a gouache named after its slug (provenance in docs/visual-assets.md).
const chapterImage = (recipe, loading) =>
  `<img src="./assets/chapters/${recipe.generator.slug}.jpg" width="1200" height="800" alt="${esc(recipe.generator.chapter.alt)}" loading="${loading}" decoding="async"/>`;

// Contents of the cookbook: one row per generator chapter.
function renderContents() {
  return `<section class="page-intro chapters-intro"><div class="eyebrow">Книга кока</div><h1>Главы</h1><p>Каждая глава — способ готовки, в котором основу и наполнение можно менять. Выберите, что есть на борту, — получится блюдо с расчётом воды, времени и закупки.</p></section>
    <ol class="chapter-list">${generators
      .map((recipe, index) => {
        const { chapter, slug } = recipe.generator;
        const dishes = knownDishes(recipe);
        return `<li><a href="#generators/${slug}">${chapterImage(recipe, 'lazy')}<span class="chapter-number">Глава ${index + 1}</span><strong>${chapter.title}</strong><span class="chapter-formula">${chapter.formula}</span><span class="chapter-dishes">${dishes
          .slice(0, 5)
          .map((d) => d.name || d.label)
          .join(
            ', ',
          )}</span><span class="chapter-count">${dishes.length} ${plural(dishes.length, 'сочетание', 'сочетания', 'сочетаний')} ${icon('arrow')}</span></a></li>`;
      })
      .join('')}</ol>`;
}

function sentenceSelect(recipe, selection, part, state) {
  if (part.axis === 'base') {
    const current = generatorProfile(recipe, selection.choices);
    return `<span class="sentence-slot"><select class="sentence-choice" data-generator-axis="base" aria-label="Основа">${recipe.generator.bases
      .map(
        (base) =>
          `<option value="${base.id}" ${base.id === current.id ? 'selected' : ''}>${base.phrase || base.label}</option>`,
      )
      .join('')}</select></span>`;
  }
  const modules = recipe.modules.filter((m) => m.group === part.group);
  const selected = selection.modules.find((m) => m.group === part.group);
  const options = modules.map((module) => {
    const unavailable =
      (module.shore && state.mode !== 'shore') ||
      optionBlocked(recipe, selection.choices, selection.moduleIds, module.id);
    return `<option value="${module.id}" ${module.id === selected?.id ? 'selected' : ''} ${unavailable ? 'disabled' : ''}>${module.phrase || module.label}</option>`;
  });
  if (part.empty) options.unshift(`<option value="">${part.empty}</option>`);
  return `<span class="sentence-slot"><select class="sentence-choice" data-generator-axis="${part.group}" aria-label="${modules[0]?.label || part.group}">${options.join('')}</select></span>`;
}

// Options outside the sentence (vegetables, spices) stay as toggles.
function renderAdditions(recipe, selection, state) {
  const inSentence = new Set(recipe.generator.sentence.map((part) => part.group).filter(Boolean));
  const groups = [
    ['vegetables', 'Овощи'],
    [null, 'Специи и добавки'],
  ];
  return groups
    .map(([group, label]) => {
      if (inSentence.has(group)) return '';
      const modules = recipe.modules.filter(
        (m) => (m.group || null) === group && !recipe.generator.defaultModules?.includes(m.id),
      );
      if (!modules.length) return '';
      return `<div class="chapter-additions"><span>${label}</span><div class="module-buttons" role="group" aria-label="${label}">${modules
        .map((module) => {
          const active = selection.moduleIds.includes(module.id);
          const reason = optionBlocked(recipe, selection.choices, selection.moduleIds, module.id);
          return `<button data-action="module" data-id="${module.id}" class="${active ? 'active' : ''}" aria-pressed="${active}" ${module.shore && state.mode !== 'shore' ? 'disabled' : ''} ${reason ? `data-blocked-reason="${esc(reason)}" aria-disabled="true" title="${esc(reason)}"` : ''}>${icon(active ? 'check' : 'plus')} ${module.label}</button>`;
        })
        .join('')}</div></div>`;
    })
    .join('');
}

function renderKnown(recipe, selection, state, prepared) {
  const base = generatorProfile(recipe, selection.choices).id;
  return `<div class="chapter-known"><span>Известные сочетания</span><div>${knownDishes(recipe)
    .map((dish) => {
      const href = routeHash({
        view: 'generators',
        slug: recipe.generator.slug,
        base: dish.base || base,
        modules: dish.modules,
      });
      // A named dish is active when it is the current title; a preset when its modules are on.
      const active = dish.name
        ? prepared.title === dish.name
        : dish.modules.every((id) => selection.moduleIds.includes(id));
      return dish.shore && state.mode !== 'shore'
        ? `<span class="known-dish unavailable">${dish.name || dish.label}</span>`
        : `<a class="known-dish ${active ? 'active' : ''}" href="${href}">${dish.name || dish.label}</a>`;
    })
    .join('')}</div></div>`;
}

export function renderGenerators({ state, chapter }) {
  if (!chapter) return renderContents();
  const { recipe, prepared, selection } = chapter;
  const number = generators.indexOf(recipe) + 1;
  const { title, principle } = recipe.generator.chapter;
  const parts = recipe.generator.sentence.map((part) =>
    typeof part === 'string'
      ? `<span>${part}</span>`
      : sentenceSelect(recipe, selection, part, state),
  );
  // The full stop stays on the line of the last choice.
  const sentence = `${parts.slice(0, -1).join(' ')} <span class="sentence-tail">${parts.at(-1)}.</span>`;
  return `<article class="chapter-page" data-generator="${recipe.id}"><nav class="chapter-crumb" aria-label="${t('Главы')}"><a href="#generators">Главы</a><span aria-hidden="true">/</span><span>Глава ${number}</span></nav>
    <header class="chapter-head"><div><h1>${title}</h1><p>${principle}</p></div><figure>${chapterImage(recipe, 'eager')}</figure></header>
    <section class="chapter-builder" aria-label="Собрать блюдо"><p class="chapter-sentence">${sentence}</p>${renderAdditions(recipe, selection, state)}${renderKnown(recipe, selection, state, prepared)}</section>
    ${renderRecipeDialog(recipe, prepared, { ...selection, state, embedded: true })}</article>`;
}
