import { volumeMeasures, MUG_ML } from '../catalog/measures.js';
import { productById, sources } from '../data.js';
import { formatAmount } from '../model.js';
import { icon, esc } from './icons.js';

const sourceById = Object.fromEntries(sources.map((source) => [source.id, source]));
// Grams in a 250 ml mug for the goods measured by the cup, and in level spoons for all of them.
function measuresTable() {
  const grams = (value) =>
    formatAmount(value >= 10 ? Math.round(value) : Math.round(value * 2) / 2, 'г');
  const rows = Object.entries(volumeMeasures)
    .map(
      ([id, m]) =>
        `<tr><th scope="row">${productById[id].name}</th><td>${m.per === 'cup' ? grams(m.mugGrams) : '—'}</td><td>${grams(m.density * 15)}</td><td>${grams(m.density * 5)}</td></tr>`,
    )
    .join('');
  return `<table class="guide-table"><caption>Сколько граммов в мерке</caption><thead><tr><th scope="col">Продукт</th><th scope="col">Кружка ${MUG_ML} мл</th><th scope="col">Ст. л. 15 мл</th><th scope="col">Ч. л. 5 мл</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// A cheat sheet as a page: plate, lead, numbered practices with pictograms, a table and sources.
export function renderGuide(guide) {
  const sourceList = guide.sourceIds
    .map((id) => sourceById[id])
    .filter(Boolean)
    .map(
      (source) =>
        `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}</a><p>${source.text}</p></li>`,
    )
    .join('');
  return `<article class="guide-sheet"><img class="guide-plate" src="./assets/guides/${guide.id}.jpg" width="1200" height="800" alt="${esc(guide.alt)}" decoding="async"/><div class="eyebrow">Шпаргалка шкипера</div><h2 class="guide-title">${guide.title}</h2><p class="guide-lead">${guide.lead}</p><ol class="guide-steps">${guide.sections
    .map(
      (section) =>
        `<li>${icon(section.icon)}<div><h3>${section.title}</h3><p>${section.text}</p></div></li>`,
    )
    .join(
      '',
    )}</ol>${guide.table === 'measures' ? measuresTable() : ''}<section class="guide-sources"><h3>Источники</h3><ul>${sourceList}</ul></section></article>`;
}
