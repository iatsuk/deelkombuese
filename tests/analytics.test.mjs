import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../site-analytics.js', import.meta.url), 'utf8');
function observe(overrides = {}) {
  const requests = [],
    window = {};
  window.top = window;
  const context = {
    window,
    URL,
    URLSearchParams,
    location: {
      hostname: 'kombuese.deelstuff.com',
      protocol: 'https:',
      pathname: '/',
      href: 'https://kombuese.deelstuff.com/?lang=de&private=secret#recipes',
      hash: '',
    },
    navigator: {},
    localStorage: { getItem: () => null },
    document: {
      visibilityState: 'visible',
      title: 'Smart Galley',
      referrer: 'https://example.com/private?secret=yes',
      querySelector: () => null,
      addEventListener() {},
      removeEventListener() {},
    },
    Image: class {
      set src(url) {
        requests.push(url);
      }
    },
  };
  for (const [key, value] of Object.entries(overrides)) Object.assign(context[key], value);
  if (overrides.location?.pathname)
    context.location.href = 'https://' + context.location.hostname + context.location.pathname;
  vm.runInNewContext(source, context);
  return requests;
}
test('Production collection retains the new domain prefix without private URL or application state', () => {
  const request = new URL(observe()[0]);
  assert.equal(request.origin, 'https://stats.deelstuff.com');
  assert.equal(request.searchParams.get('p'), '/kombuese.deelstuff.com/');
  assert.equal(request.searchParams.get('r'), 'https://example.com');
  assert.ok(!request.href.includes('secret'));
  assert.ok(!request.href.includes('lang='));
});
test('Privacy signals, local development, legal pages and automated browsers do not collect', () => {
  for (const overrides of [
    { navigator: { doNotTrack: '1' } },
    { navigator: { globalPrivacyControl: true } },
    { navigator: { webdriver: true } },
    { location: { hostname: 'localhost' } },
    { location: { protocol: 'http:' } },
    { location: { pathname: '/datenschutz/' } },
    { location: { pathname: '/datenschutz/de/' } },
    { location: { pathname: '/impressum/en/' } },
    { localStorage: { getItem: () => 'true' } },
  ])
    assert.equal(observe(overrides).length, 0);
});
