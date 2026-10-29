import { visualPaths } from '../cooking-visuals.js';
const paths = {
  ...visualPaths,
  pause: 'M9 5v14M15 5v14',
  star: 'm12 2 3.1 6.3 7 .9-5 4.9 1.2 6.9-6.3-3.3L5.7 21l1.2-6.9-5-4.9 7-.9L12 2Z',
  bread: 'M5 10c-5-1-5-7 0-8 3-2 11-2 14 0 5 1 5 7 0 8v12H5V10Zm3 3v5m4-5v5m4-5v5',
  egg: 'M20 15c0 11-16 11-16 0C4 9 9 1 12 1s8 8 8 14Z',
  pot: 'M5 10h14l-1.5 10h-11L5 10ZM3 10h18M9 6c-3-3 3-3 0-6m6 6c-3-3 3-3 0-6M3 13H1m22 0h-2',
  map: 'm9 18 6-12M3 4l6 2 6-2 6 2v14l-6-2-6 2-6-2V4Zm6 2v14m6-16v14',
  box: 'm3 7 9-4 9 4-9 4-9-4Zm0 0v11l9 4 9-4V7M12 11v11m-5-17 10 4',
  book: 'M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z',
  bag: 'M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  arrowDown: 'M12 4v16m-6-6 6 6 6-6',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  swap: 'M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4',
  anchor:
    'M12 7v15M9 4a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM2 13v3c0 3 4 6 10 6s10-3 10-6v-3M1 16l1-3 3 1m18 2-1-3-3 1',
  wave: 'M2 8c3-5 7 5 10 0s7 5 10 0M2 16c3-5 7 5 10 0s7 5 10 0',
  info: 'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
  person: 'M8 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
  fridge: 'M5 2h14v20H5V2Zm0 8h14M9 5v1m0 7v3M2 2l20 20',
  drop: 'M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14ZM8 15a4 4 0 0 0 4 4',
  download: 'M12 2v13m-5-5 5 5 5-5M3 16v6h18v-6',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 16h10l1-16M10 10v7m4-7v7',
  leaf: 'M20 3C8 2 1 7 5 16c8 5 16-1 15-13ZM4 21 17 7',
  grain:
    'M12 22V3m0 6C5 10 3 6 4 3c5-1 8 2 8 6Zm0 6C5 16 3 12 4 9c5-1 8 2 8 6Zm0 3c7 1 9-3 8-6-5-1-8 2-8 6Zm0-6c7 1 9-3 8-6-5-1-8 2-8 6Z',
  pasta: 'M5 3v7m4-7v7m4-7v7M3 10h12M9 10v12M19 3c-3 5-3 11 0 14v5m0-19v14h3V3',
  beans: 'M7 4C0 5 1 16 7 18c4 1 7-5 4-8-2-2-3-1-4-6ZM17 8c-1 5-7 3-6 8 1 7 10 5 11-1 1-4-2-7-5-7Z',
  can: 'M5 5v14c0 4 14 4 14 0V5M19 5C19 1 5 1 5 5s14 4 14 0ZM5 16c3 3 11 3 14 0m-7-5v3',
  fish: 'M18 12c-5-9-13-5-16 0 3 5 11 9 16 0Zm0 0 5-5v10l-5-5ZM7 10v.1',
  potato: 'M4 9c2-6 7-7 12-6 5 2 8 7 5 12-2 3-4 7-10 6C4 20 1 15 4 9Zm4 0v.1m7-2v.1M9 16v.1m9-3v.1',
  carrot: 'm14 7 3 3-13 12L14 7Zm0 0c-3-5 2-7 3-2 1-6 6-4 3 0 6-1 5 4 0 3m-10 4 2 2m-5 1 2 2',
  onion:
    'M12 3C10 8 4 9 4 15a8 8 0 0 0 16 0c0-6-6-7-8-12Zm0 0c-5 10-5 18 0 20 5-2 5-10 0-20ZM9 1l3 2 3-2',
  root: 'm6 4 4 1 2 5 5-2 3 3-3 4-4-1-2 6-4-1 1-7-4-3 2-5Z',
  tomato: 'M12 7C2 1-1 21 9 21h6C25 21 22 1 12 7Zm0 0V2m-4 2 4 3 4-3',
  bottle: 'M9 2h6v5l3 4v11H6V11l3-4V2Zm-3 12h12M9 5h6',
  spice: 'M7 2h10v4H7V2Zm0 4-2 4v12h14V10l-2-4M8 14h8m-8 4h8',
  meat: 'M4 6C0 9 3 21 9 21c3 0 3-5 6-6s7 2 8-4C25 1 11 0 4 6Zm5 3c-3 1-2 5 0 5s4-6 0-5Z',
};
export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.pot}"/></svg>`;
export const esc = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
