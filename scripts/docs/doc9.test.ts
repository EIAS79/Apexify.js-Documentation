import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { discoverDocumentationSources, loadDocumentationPages } from '../../lib/docs/content';
import { doc9Disposition } from '../../lib/docs/doc9-migration';
import { resolveDoc9LegacyIdentity } from '../../lib/docs/doc9-legacy-client';
import { buildDocumentationNavigation, flattenDocumentationNavigation } from '../../lib/docs/navigation';
import { CURRENT_CAPABILITIES } from '../../lib/product/catalog-data';

function records() {
  const pages = loadDocumentationPages();
  const bySource = new Map(pages.map((page) => [page.sourcePath, page]));
  return discoverDocumentationSources().map((source) => {
    const raw = fs.readFileSync(source.absolutePath, 'utf8');
    const page = source.hasFrontmatter ? bySource.get(source.sourcePath) : undefined;
    return doc9Disposition(
      source.sourcePath,
      source.hasFrontmatter,
      raw,
      page ? { canonicalPath: page.canonicalPath, title: page.title, category: page.category, feature: page.feature } : undefined,
    );
  });
}

test('every live MDX source has exactly one explicit DOC-9 disposition', () => {
  const sources = discoverDocumentationSources();
  const migration = records();
  assert.equal(migration.length, sources.length);
  assert.equal(new Set(migration.map((record) => record.legacyPath)).size, sources.length);
  for (const record of migration) {
    assert.ok(['keep', 'rewrite', 'split', 'merge', 'move', 'archive', 'delete'].includes(record.classification));
    assert.ok(record.rationale.length > 20);
    assert.ok(record.targetRoutes.length > 0);
  }
});

test('all active migrated sources resolve to their canonical routed page', () => {
  const pages = loadDocumentationPages();
  const bySource = new Map(pages.map((page) => [page.sourcePath, page]));
  for (const record of records()) {
    if (['merge', 'archive', 'delete'].includes(record.classification)) continue;
    const page = bySource.get(record.legacyPath);
    assert.ok(page, `missing routed page for ${record.legacyPath}`);
    assert.ok(record.targetRoutes.includes(page.canonicalPath), `${record.legacyPath} target does not match ${page.canonicalPath}`);
  }
});

test('legacy client compatibility covers every redirect-required source', () => {
  for (const record of records()) {
    if (!record.redirectRequired) continue;
    assert.equal(resolveDoc9LegacyIdentity(record.legacyId), record.targetRoutes[0], record.legacyId);
  }
});

test('active routed bodies no longer emit legacy hash-only Markdown links', () => {
  for (const page of loadDocumentationPages()) {
    assert.doesNotMatch(page.body, /\]\(\/docs#[^)]+\)/, page.sourcePath);
    assert.doesNotMatch(page.body, /href=(['"])\/docs#[^'"]+\1/, page.sourcePath);
  }
});

test('all DOC-7 current package capabilities have a modern canonical docs surface', () => {
  const pages = loadDocumentationPages();
  for (const capability of CURRENT_CAPABILITIES) {
    assert.ok(pages.some((page) => page.feature === capability.id), `current capability ${capability.id} has no canonical docs page`);
  }
});

test('handwritten API sources and archived release detail are not active routed truth', () => {
  const pages = loadDocumentationPages();
  const routedSources = new Set(pages.map((page) => page.sourcePath));
  for (const record of records()) {
    if (record.classification === 'merge' || record.classification === 'archive') {
      assert.equal(routedSources.has(record.legacyPath), false, `${record.legacyPath} must not be routed as current truth`);
    }
  }
});

test('navigation covers every active canonical page exactly once', () => {
  const pages = loadDocumentationPages();
  const navigation = buildDocumentationNavigation(pages);
  const items = flattenDocumentationNavigation(navigation);
  assert.equal(items.length, pages.length);
  assert.equal(new Set(items.map((item) => item.href)).size, pages.length);
  assert.deepEqual(new Set(items.map((item) => item.href)), new Set(pages.map((page) => page.canonicalPath)));
});

test('DOC-9 current content does not synthesize future package/runtime claims', () => {
  for (const page of loadDocumentationPages()) {
    assert.equal(page.package, 'apexify.js', page.sourcePath);
    assert.deepEqual(page.runtime, ['node'], page.sourcePath);
    assert.notEqual(page.stability, 'ROADMAP', page.sourcePath);
  }
});
