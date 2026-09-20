import assert from 'node:assert/strict';
import test from 'node:test';
import {
  galleryItems,
  itemMatchesEvidence,
  itemMatchesFilter,
  itemMatchesQuery,
  itemMatchesRuntime,
  type GalleryItem,
} from '../../app/gallery/components/galleryHelpers';

test('Gallery catalog is intentionally empty after the output reset', () => {
  assert.deepEqual(galleryItems, []);
});

test('empty Gallery filters remain stable and reset cleanly', () => {
  const all = galleryItems.filter((item) => itemMatchesRuntime(item, 'all') && itemMatchesEvidence(item, 'all'));
  const node = galleryItems.filter((item) => itemMatchesRuntime(item, 'node'));
  const verified = galleryItems.filter((item) => itemMatchesEvidence(item, 'verified'));
  const legacy = galleryItems.filter((item) => itemMatchesEvidence(item, 'legacy'));

  assert.equal(all.length, 0);
  assert.equal(node.length, 0);
  assert.equal(verified.length, 0);
  assert.equal(legacy.length, 0);
});

test('Gallery matching helpers stay ready for the next curated output set', () => {
  const sample: GalleryItem = {
    id: 'future-sample',
    title: 'Future chart sample',
    description: 'Synthetic chart output for helper-contract coverage.',
    category: 'advance',
    primaryLens: 'data',
    lenses: ['data', 'advanced'],
    thumbnail: '/future-output.png',
    code: { ts: 'return painter.createChart();' },
  };

  assert.equal(itemMatchesRuntime(sample, 'node'), true);
  assert.equal(itemMatchesEvidence(sample, 'legacy'), true);
  assert.equal(itemMatchesFilter(sample, 'data'), true);
  assert.equal(itemMatchesFilter(sample, 'motion'), false);
  assert.equal(itemMatchesQuery(sample, 'chart'), true);
  assert.equal(itemMatchesQuery(sample, 'future-sample'), true);
});
