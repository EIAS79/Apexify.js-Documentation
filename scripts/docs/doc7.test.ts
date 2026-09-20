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

test('Gallery starts with the two finished Peak Showcase films', () => {
  const showcases = galleryItems.filter((item) => item.sourceKind === 'showcase');

  assert.equal(showcases.length, 2);
  assert.deepEqual(
    showcases.map((item) => item.id).sort(),
    ['showcase-apexify-spectrum', 'showcase-orbit-breaker'],
  );
  for (const item of showcases) {
    assert.equal(item.featured, true);
    assert.equal(item.thumbnailMedia, 'video');
    assert.equal(item.executionMode, 'none');
    assert.equal(Boolean(item.code?.ts || item.code?.js || item.codePages?.length), false);
  }
});

test('Gallery filters remain stable before and after Peak Lab publication', () => {
  const all = galleryItems.filter((item) => itemMatchesRuntime(item, 'all') && itemMatchesEvidence(item, 'all'));
  const node = galleryItems.filter((item) => itemMatchesRuntime(item, 'node'));
  const verified = galleryItems.filter((item) => itemMatchesEvidence(item, 'verified'));
  const legacy = galleryItems.filter((item) => itemMatchesEvidence(item, 'legacy'));
  const peak = galleryItems.filter((item) => item.sourceKind === 'peak-lab');

  assert.equal(all.length, galleryItems.length);
  assert.equal(node.length, galleryItems.length);
  assert.equal(legacy.length, 2);
  assert.equal(verified.length, peak.length);
  assert.equal(verified.length + legacy.length, galleryItems.length);
});

test('Gallery matching helpers support source-backed Peak Lab catalog entries', () => {
  const sample: GalleryItem = {
    id: 'peak-sample',
    title: 'Peak chart sample',
    description: 'Synthetic chart output for helper-contract coverage.',
    category: 'advance',
    primaryLens: 'data',
    lenses: ['data', 'advanced'],
    thumbnail: '/gallery/peak-lab/sample.png',
    codePages: [{ label: 'Recipe', language: 'ts', code: 'return painter.createChart();' }],
    sourceKind: 'peak-lab',
    recipeId: '00',
    executionMode: 'none',
  };

  assert.equal(itemMatchesRuntime(sample, 'node'), true);
  assert.equal(itemMatchesEvidence(sample, 'verified'), true);
  assert.equal(itemMatchesFilter(sample, 'data'), true);
  assert.equal(itemMatchesFilter(sample, 'motion'), false);
  assert.equal(itemMatchesQuery(sample, 'chart'), true);
  assert.equal(itemMatchesQuery(sample, 'peak-sample'), true);
});
