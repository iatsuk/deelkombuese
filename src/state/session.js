export const views = ['map', 'generators', 'pantry', 'recipes', 'planner', 'shopping'];

// '#generators/pasta?base=risottoRice&with=sauce-cream,peas&swap=cream:milk' → a view, an
// optional chapter slug and a generator selection. Ids are never translated, so links survive
// a language switch (?lang= stays in the query string before the hash). Ids are ASCII, so the
// hash needs no encoding.
export function parseRoute(hash = '') {
  const [path, query = ''] = String(hash).replace(/^#/, '').split('?');
  const [view, slug = null] = path.split('/');
  const known = views.includes(view);
  const params = new URLSearchParams(query);
  const list = (name) => (params.get(name) || '').split(',').filter(Boolean);
  return {
    view: known ? view : 'map',
    slug: known ? slug : null,
    base: params.get('base'),
    modules: list('with'),
    choices: Object.fromEntries(
      list('swap')
        .map((pair) => pair.split(':'))
        .filter((pair) => pair.length === 2 && pair[0] && pair[1]),
    ),
  };
}
export function routeHash({ view, slug = null, base = null, modules = [], choices = {} }) {
  const parts = [];
  if (base) parts.push('base=' + base);
  if (modules.length) parts.push('with=' + modules.join(','));
  const swaps = Object.entries(choices).map(([from, to]) => `${from}:${to}`);
  if (swaps.length) parts.push('swap=' + swaps.join(','));
  return '#' + [view, slug].filter(Boolean).join('/') + (parts.length ? '?' + parts.join('&') : '');
}
export function createAppState(saved, hash = '') {
  const route = parseRoute(hash);
  return {
    ...saved,
    view: route.view,
    route,
    base: 'all',
    query: '',
    category: 'all',
    quick: false,
    pantryOnly: false,
    ownedOnly: false,
    favoritesOnly: false,
    meal: 'all',
    kind: 'all',
    variants: {},
    sortKey: 'name',
    sortDirection: 'asc',
    graphSelected: [],
    graphQuery: '',
    graphFocus: null,
    showUnavailable: false,
    plannerMode: saved.builderMeta?.kind || 'trip',
    tripDays: saved.builderMeta?.kind === 'trip' ? saved.builderMeta.days : 3,
    includeEggs: !!saved.builderMeta?.includeEggs,
    drinkLitres: saved.builderMeta?.drinkLitres ?? 3,
    washLitres: saved.builderMeta?.washLitres ?? 1.5,
    reservePct: saved.builderMeta?.reservePct ?? 25,
    seasonDays: saved.builderMeta?.kind === 'season' ? saved.builderMeta.days : 90,
    tripOverrides: saved.builderMeta?.overrides || {},
  };
}
