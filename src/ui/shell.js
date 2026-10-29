import { icon } from './icons.js';

export const navigation = [
  ['map', 'Карта вкусов'],
  ['generators', 'Главы'],
  ['pantry', 'Продукты'],
  ['recipes', 'Рецепты'],
  ['planner', 'План похода'],
  ['shopping', 'Закупка'],
];

// Header, main and footer shared by the app and the prerendered pages. Hash links lead to
// the app's views; on a prerendered page the document base points them at the app root.
export function renderShell({ main = '', languageLinks = '', legalUrl, active = null }) {
  return `<header class="site-header">
    <a class="brand" href="#map" aria-label="Дельный камбуз — главная"><span class="brand-mark">${icon('pot')}</span><span class="brand-name">Дельный камбуз</span></a>
    <nav class="site-nav" aria-label="Основная навигация">${navigation
      .map(
        ([view, label]) =>
          `<a href="#${view}" data-nav="${view}"${view === active ? ' class="active" aria-current="page"' : ''}><span>${label}</span>${view === 'shopping' ? '<span id="cart-count" class="nav-count">0</span>' : ''}</a>`,
      )
      .join('')}</nav>
    <div class="header-tools"><span class="offline-state" id="offline-status"><i></i> Подготовка к работе без сети…</span><div class="mode-switch" role="group" aria-label="Условия закупки"><button data-action="mode" data-mode="sea">${icon('wave')} В море</button><button data-action="mode" data-mode="shore">${icon('anchor')} У берега</button></div><button class="theme-toggle" type="button" data-theme-toggle>${icon('moon', 'theme-moon')}${icon('sun', 'theme-sun')}</button>${languageLinks}</div>
  </header>
  <main id="main" tabindex="-1">${main}</main>
  <footer class="page-footer"><a class="footer-brand" href="https://deelstuff.com" target="_blank" rel="noopener noreferrer">Дельный камбуз / deelstuff<small>жизнь под парусом</small></a><nav class="footer-links" aria-label="Информация о сайте"><button data-action="sources">О хранении и источниках</button><a href="${legalUrl('impressum')}">Impressum</a><a href="${legalUrl('datenschutz')}">Datenschutz</a></nav></footer>`;
}
