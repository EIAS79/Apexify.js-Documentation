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

test('DOC-2 navigation remains manifest-driven and filter-capable across the fully migrated corpus', () => {
  const pages = loadDocumentationPages();
  const navigation = buildDocumentationNavigation(pages);
  const flat = flattenDocumentationNavigation(navigation);
  const hrefs = flat.flatMap((item) => item.href ? [item.href] : []);

  assert.equal(flat.length, pages.length);
  assert.equal(new Set(hrefs).size, pages.length);
  for (const required of [
    '/docs/getting-started',
    '/docs/node/canvas',
    '/docs/node/canvas/size-and-coordinates',
    '/docs/node/canvas/backgrounds-primary',
    '/docs/migration/changelog',
  ]) {
    assert.ok(hrefs.includes(required), `missing migrated navigation route ${required}`);
  }

  const filtered = filterDocumentationNavigation(navigation, { runtime: 'node', package: 'apexify.js' });
  assert.deepEqual(flattenDocumentationNavigation(filtered).map((item) => item.href), flat.map((item) => item.href));
  assert.equal(flat.some((item) => item.href?.includes('@apexify/web')), false);
});

test('DOC-2 breadcrumbs and pager preserve canonical manifest ordering', () => {
  const pages = loadDocumentationPages();
  const navigation = buildDocumentationNavigation(pages);
  const flat = flattenDocumentationNavigation(navigation);
  const canvas = pages.find((page) => page.slug === 'node/canvas');
  assert.ok(canvas);
  const breadcrumbs = getDocumentationBreadcrumbs(navigation, canvas);
  assert.equal(breadcrumbs[1].href, '/docs/getting-started');
  assert.equal(breadcrumbs.at(-1)?.label, canvas.title);

  const index = flat.findIndex((item) => item.href === canvas.canonicalPath);
  assert.ok(index >= 0);
  const pager = getDocumentationPager(navigation, canvas.canonicalPath);
  assert.equal(pager.previous?.href ?? null, index > 0 ? flat[index - 1].href : null);
  assert.equal(pager.next?.href ?? null, index < flat.length - 1 ? flat[index + 1].href : null);
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
});

test('DOC-2 shell applies semantic main target, skip link, and route-complete mobile/desktop sidebars', () => {
  const shell = read('components/docs/shell/DocsShell.tsx');
  const layout = read('app/docs/layout.tsx');
  assert.ok(shell.includes('id="docs-content"'));
  assert.ok(layout.includes('href="#docs-content"'));
  assert.ok(shell.includes('DocsSidebarV2'));
  assert.ok(shell.includes('AccessibleDrawer'));
  assert.ok(shell.includes('OnThisPageV2'));
});

test('DOC-2 visual and accessibility styles avoid prohibited effects', () => {
  const shellCss = read('styles/docs-shell.css');
  const proseCss = read('styles/docs-prose.css');
  for (const css of [shellCss, proseCss]) {
    assert.doesNotMatch(css, /cursor\s*:\s*none/i);
    assert.doesNotMatch(css, /filter\s*:\s*drop-shadow\([^)]{0,80}(#|rgb|hsl)/i);
  }
  assert.match(shellCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(proseCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
