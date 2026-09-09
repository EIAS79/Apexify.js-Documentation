import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDocumentationPageBySlug,
  loadDocumentationPages,
} from '../../lib/docs/content';
import {
  validateDocumentationFrontmatter,
  validateDocumentationPageSet,
} from '../../lib/docs/schema';
import {
  buildDocumentationNavigation,
  getDocumentationPager,
} from '../../lib/docs/navigation';
import {
  canonicalizeLegacyDocumentationHref,
  resolveLegacyDocumentationFragment,
} from '../../lib/docs/legacy-routing';

const validFrontmatter = {
  title: 'Test page',
  description: 'A deterministic metadata validation fixture.',
  slug: 'node/test',
  kind: 'guide',
  category: 'Node',
  order: 100,
  package: 'apexify.js',
  runtime: ['node'],
  stability: 'CURRENT',
  canonical: '/docs/node/test',
};

test('DOC-1 schema rejects invalid page kinds', () => {
  assert.throws(
    () =>
      validateDocumentationFrontmatter(
        { ...validFrontmatter, kind: 'whatever' },
        'fixture.mdx',
      ),
    /kind must be one of/,
  );
});

test('DOC-1 schema rejects invalid stability, runtime, order, and canonical values', () => {
  assert.throws(
    () =>
      validateDocumentationFrontmatter(
        { ...validFrontmatter, stability: 'stable' },
        'fixture.mdx',
      ),
    /stability must be one of/,
  );
  assert.throws(
    () =>
      validateDocumentationFrontmatter(
        { ...validFrontmatter, runtime: ['browser-ish'] },
        'fixture.mdx',
      ),
    /unsupported runtime/,
  );
  assert.throws(
    () =>
      validateDocumentationFrontmatter(
        { ...validFrontmatter, order: 1.25 },
        'fixture.mdx',
      ),
    /non-negative integer/,
  );
  assert.throws(
    () =>
      validateDocumentationFrontmatter(
        { ...validFrontmatter, canonical: '/docs/Node/Test' },
        'fixture.mdx',
      ),
    /canonical/,
  );
});

test('normalized document set rejects duplicate canonical and legacy identities', () => {
  const page = getDocumentationPageBySlug('node/canvas');
  assert.ok(page);

  assert.throws(
    () =>
      validateDocumentationPageSet([
        page,
        {
          ...page,
          id: 'different-id',
          sourcePath: 'content/docs/test-duplicate.mdx',
          slug: 'node/canvas-copy',
          canonical: page.canonicalPath,
          canonicalPath: page.canonicalPath,
          aliases: [],
          legacyHashes: ['different-hash'],
        },
      ]),
    /duplicate canonical/,
  );

  assert.throws(
    () =>
      validateDocumentationPageSet([
        page,
        {
          ...page,
          id: 'different-id',
          sourcePath: 'content/docs/test-alias.mdx',
          slug: 'node/canvas-copy',
          canonical: '/docs/node/canvas-copy',
          canonicalPath: '/docs/node/canvas-copy',
          aliases: [page.legacyHashes[0]],
          legacyHashes: ['different-hash'],
        },
      ]),
    /duplicate legacy identity/,
  );
});

test('legacy document hashes map to canonical routes while headings stay fragments', () => {
  assert.equal(
    resolveLegacyDocumentationFragment('00-start-here'),
    '/docs/getting-started',
  );
  assert.equal(
    resolveLegacyDocumentationFragment('start-here'),
    '/docs/getting-started',
  );
  assert.equal(
    resolveLegacyDocumentationFragment(
      '00-create-canvas-overview?h=signature-types',
    ),
    '/docs/node/canvas#signature-types',
  );
  assert.equal(
    canonicalizeLegacyDocumentationHref(
      '/docs#01-canvas-size-and-coordinates',
    ),
    '/docs/node/canvas/size-and-coordinates',
  );
  assert.equal(
    canonicalizeLegacyDocumentationHref('/docs#02-backgrounds-primary'),
    '/docs#02-backgrounds-primary',
  );
});

test('navigation manifest deterministically drives pager order', () => {
  const navigation = buildDocumentationNavigation(loadDocumentationPages());
  assert.deepEqual(
    navigation.flatMap((group) => group.items.map((item) => item.href)),
    [
      '/docs/getting-started',
      '/docs/node/canvas',
      '/docs/node/canvas/size-and-coordinates',
    ],
  );

  const pager = getDocumentationPager(navigation, '/docs/node/canvas');
  assert.equal(pager.previous?.href, '/docs/getting-started');
  assert.equal(pager.next?.href, '/docs/node/canvas/size-and-coordinates');
});
