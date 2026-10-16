import assert from 'node:assert/strict';
import test from 'node:test';
import { fieldTemplates, filterFieldEntries, type FieldEntry } from '../../../lib/gallery/motion-field/catalog';
const film: FieldEntry = { id: 'film', title: 'Showcase', description: 'Finished film', thumbnail: '/film.mp4', media: 'video', lenses: ['motion'], primary: 'motion', kind: 'showcase', sourceLabel: 'Showcase' };
const recipe: FieldEntry = { ...film, id: 'recipe', title: 'Peak Lab', kind: 'example' };
const entries = [...fieldTemplates, film, recipe];
test('templates exclude showcases and legacy examples; examples exclude films without code', () => {
  assert.equal(filterFieldEntries(entries, 'templates', 'all', '').length, 5);
  assert.equal(filterFieldEntries(entries, 'examples', 'motion', '').length, 3);
  assert.equal(filterFieldEntries(entries, 'explore', 'motion', '').length, 4);
});
test('search combines words and respects category, with a useful empty result', () => {
  assert.deepEqual(filterFieldEntries(entries, 'templates', 'image', 'LAUNCH reusable').map(x => x.id), ['launch-card']);
  assert.equal(filterFieldEntries(entries, 'templates', 'data', 'launch').length, 0);
});
test('every new template exposes its exact standalone source, original output and walkthrough', () => {
  assert.equal(new Set(fieldTemplates.map(item => item.id)).size, 5);
  for (const item of fieldTemplates) {
    assert.equal(item.source, `/gallery/motion-field/source/${item.id}.mjs`);
    assert.equal(item.output, `/gallery/motion-field/${item.id}.png`);
    assert.equal(item.steps?.length, 4);
  }
});
