import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { guides, guideById } from '../src/catalog/guides.js';
import { sources } from '../src/data.js';
import { visualPaths } from '../src/cooking-visuals.js';
import { icon } from '../src/ui/icons.js';
import { renderGuide } from '../src/ui/guide.js';
import { parsePagePath, pagePath } from '../src/state/session.js';
import { volumeMeasures } from '../src/catalog/measures.js';

test('Each cheat sheet has a plate, sourced practices and its own page address', () => {
  const sourceIds = new Set(sources.map((source) => source.id));
  assert.deepEqual(
    guides.map((g) => g.id),
    ['dry-stores', 'stowage', 'mug-rule', 'seawater', 'thermos-gas'],
  );
  for (const guide of guides) {
    assert.ok(existsSync(`assets/guides/${guide.id}.jpg`), guide.id);
    assert.ok(guide.title && guide.lead && guide.summary && guide.alt, guide.id);
    assert.ok(guide.sections.length >= 3, guide.id);
    for (const section of guide.sections)
      // An unknown name would fall back to the pot pictogram.
      assert.notEqual(icon(section.icon), icon('__unknown__'), `${guide.id} ${section.icon}`);
    assert.ok(guide.sourceIds.length >= 2, guide.id);
    for (const id of guide.sourceIds) assert.ok(sourceIds.has(id), `${guide.id} ${id}`);
    assert.equal(guideById[guide.id], guide);
    for (const language of ['ru', 'en', 'de'])
      assert.deepEqual(parsePagePath(pagePath(language, 'guides', guide.id)), {
        language,
        kind: 'guide',
        id: guide.id,
      });
  }
  assert.ok(visualPaths.zip && visualPaths.drain);
});

test('A cheat sheet page carries its plate, steps, sources and, for the mug rule, the table', () => {
  const mug = renderGuide(guideById['mug-rule']);
  assert.match(mug, /assets\/guides\/mug-rule\.jpg/);
  assert.equal(mug.match(/<li>/g).length, guideById['mug-rule'].sections.length + 3);
  assert.equal(mug.match(/<tr><th scope="row">/g).length, Object.keys(volumeMeasures).length);
  assert.match(mug, /<td>195 г<\/td>/);
  assert.match(mug, /href="https:\/\/fdc\.nal\.usda\.gov\/"/);
  const sea = renderGuide(guideById.seawater);
  assert.doesNotMatch(sea, /guide-table/);
  assert.match(sea, /Ни одна служба пищевой безопасности/);
  assert.match(sea, /oceanservice\.noaa\.gov/);
});
