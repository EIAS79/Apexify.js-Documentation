import assert from 'node:assert/strict';
import test from 'node:test';
import {
  galleryEvidence,
  galleryItems,
  isVerifiedGalleryItem,
  itemMatchesEvidence,
  itemMatchesFilter,
  itemMatchesQuery,
  itemMatchesRuntime,
} from '../../app/gallery/components/galleryHelpers';

test('Gallery stable IDs are unique and DOC-5 cards retain canonical verified provenance', () => {
  const ids = galleryItems.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  const verified = galleryItems.filter(isVerifiedGalleryItem);
  assert.ok(verified.length > 0);
  for (const item of verified) {
    assert.equal(item.verificationStatus, 'verified');
    assert.match(item.exampleRoute, /^\/examples\//);
    assert.ok(item.verifiedPackageVersion);
  }
});

test('runtime and evidence filters are data filters and reset to all items', () => {
  const all = galleryItems.filter((item) => itemMatchesRuntime(item, 'all') && itemMatchesEvidence(item, 'all'));
  const node = galleryItems.filter((item) => itemMatchesRuntime(item, 'node'));
  const verified = galleryItems.filter((item) => itemMatchesEvidence(item, 'verified'));
  const legacy = galleryItems.filter((item) => itemMatchesEvidence(item, 'legacy'));
  assert.equal(all.length, galleryItems.length);
  assert.equal(node.length, galleryItems.length);
  assert.equal(verified.length + legacy.length, galleryItems.length);
  assert.ok(verified.every((item) => galleryEvidence(item) === 'verified'));
  assert.ok(legacy.every((item) => galleryEvidence(item) === 'legacy'));
});

test('combined feature/evidence filtering has a real empty state and reset path', () => {
  const impossible = galleryItems.filter(
    (item) => itemMatchesEvidence(item, 'verified') && itemMatchesFilter(item, 'videos'),
  );
  assert.equal(impossible.length, 0);
  const reset = galleryItems.filter(
    (item) => itemMatchesEvidence(item, 'all') && itemMatchesFilter(item, 'all') && itemMatchesQuery(item, ''),
  );
  assert.equal(reset.length, galleryItems.length);
});

test('Gallery search indexes title, id, provenance and DOC-5 feature metadata', () => {
  assert.ok(galleryItems.some((item) => itemMatchesQuery(item, 'verified')));
  assert.ok(galleryItems.some((item) => itemMatchesQuery(item, 'chart')));
  assert.ok(galleryItems.some((item) => itemMatchesQuery(item, 'legacy')));
});
