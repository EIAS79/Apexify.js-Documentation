import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { loadDocumentationPages } from '../../lib/docs/content';
import { buildDocumentationNavigation, filterDocumentationNavigation, flattenDocumentationNavigation, getDocumentationBreadcrumbs, getDocumentationPager } from '../../lib/docs/navigation';

const ROOT = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('DOC-2 token and status primitives are complete for both themes', () => {
  const css = read('styles/docs-tokens.css');
  for (const token of ['--apx-surface-page', '--apx-text-primary', '--apx-border-default', '--apx-motion-fast', '--apx-z-drawer', '--apx-content-width', '--apx-sidebar-width', '--apx-header-height', '--apx-font-body', '--apx-font-code', '--apx-focus-color']) {
    assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const status of ['current', 'preview', 'experimental', 'roadmap', 'deprecated', 'removed']) {
    assert.ok(css.includes(`--apx-status-${status}-fg`));
    assert.ok(css.includes(`--apx-status-${status}-bg`));
  }
  assert.ok(css.includes('.dark'));
});

test('DOC-2 navigation remains manifest-driven and filter-capable without speculative pages', () => {
  const pages = loadDocumentationPages();
  const navigation = buildDocumentationNavigation(pages);
  const flat = flattenDocumentationNavigation(navigation);
  assert.deepEqual(flat.map((item) => item.href), [
    '/docs/getting-started',
    '/docs/node/canvas',
    '/docs/node/canvas/size-and-coordinates',
  ]);
  const filtered = filterDocumentationNavigation(navigation, { runtime: 'node', package: 'apexify.js' });
  assert.deepEqual(flattenDocumentationNavigation(filtered).map((item) => item.href), flat.map((item) => item.href));
  assert.equal(flat.some((item) => item.href.includes('@apexify/web')), false);
});

test('DOC-2 breadcrumbs and pager preserve canonical DOC-1 ordering', () => {
  const pages = loadDocumentationPages();
  const navigation = buildDocumentationNavigation(pages);
  const canvas = pages.find((page) => page.slug === 'node/canvas');
  assert.ok(canvas);
  const breadcrumbs = getDocumentationBreadcrumbs(navigation, canvas);
  assert.equal(breadcrumbs[1].href, '/docs/getting-started');
  assert.equal(breadcrumbs.at(-1)?.label, canvas.title);
  const pager = getDocumentationPager(navigation, canvas.canonicalPath);
  assert.equal(pager.previous?.href, '/docs/getting-started');
  assert.equal(pager.next?.href, '/docs/node/canvas/size-and-coordinates');
});

test('DOC-2 shell keeps server boundaries and accessible drawer behavior', () => {
  for (const file of ['app/docs/layout.tsx', 'app/docs/[...slug]/page.tsx', 'components/docs/shell/DocsShell.tsx', 'components/docs/shell/DocsHeader.tsx']) {
    assert.doesNotMatch(read(file), /^['"]use client['"];?/m);
  }
  const drawer = read('components/docs/shell/AccessibleDrawer.tsx');
  assert.ok(drawer.includes('role="dialog"'));
  assert.ok(drawer.includes('aria-modal="true"'));
  assert.ok(drawer.includes("event.key === 'Escape'"));
  assert.ok(drawer.includes('triggerRef.current?.focus()'));
  assert.ok(drawer.includes("event.key !== 'Tab'"));
});

test('DOC-2 focus, reduced-motion and custom-cursor policies are explicit', () => {
  const css = read('styles/docs-shell.css');
  const cursor = read('components/docs/shell/CustomCursorGate.tsx');
  assert.ok(css.includes(':focus-visible'));
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(css.includes('transition-duration:0s !important'));
  assert.ok(css.includes('animation-duration:0s !important'));
  assert.ok(cursor.includes("!pathname?.startsWith('/docs')"));
  assert.ok(cursor.includes('prefers-reduced-motion: reduce'));
});

test('DOC-2 desktop/mobile search and TOC instances use unique identities', () => {
  const shell = read('components/docs/shell/DocsShell.tsx');
  const sidebarSearch = read('components/docs/DocsSidebarSearch.tsx');
  const globalSearch = read('components/docs/search/GlobalDocsSearch.tsx');
  assert.ok(shell.includes('docs-sidebar-search-input'));
  assert.ok(shell.includes('docs-drawer-search-input'));
  assert.ok(shell.includes('docs-toc-rail'));
  assert.ok(shell.includes('docs-toc-drawer'));
  assert.ok(sidebarSearch.includes('inputId'));
  assert.ok(sidebarSearch.includes('GlobalDocsSearch') || sidebarSearch.includes('InlineSearch'));
  assert.ok(globalSearch.includes('data-docs-search-input'));
  assert.ok(globalSearch.includes('id={inputId}'));
});
