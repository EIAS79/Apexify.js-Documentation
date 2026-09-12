import fs from 'node:fs';
import path from 'node:path';
import { loadDocumentationPages } from '../../lib/docs/content';
import { buildDocumentationNavigation, filterDocumentationNavigation, flattenDocumentationNavigation } from '../../lib/docs/navigation';

const ROOT = process.cwd();
const requireFile = (file: string) => {
  const target = path.join(ROOT, file);
  if (!fs.existsSync(target)) throw new Error(`[doc2-verify] missing required file: ${file}`);
  return fs.readFileSync(target, 'utf8');
};
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[doc2-verify] ${message}`);
}

const tokenCss = requireFile('styles/docs-tokens.css');
const shellCss = requireFile('styles/docs-shell.css');
const docsLayout = requireFile('app/docs/layout.tsx');
const routePage = requireFile('app/docs/[...slug]/page.tsx');
const docsShell = requireFile('components/docs/shell/DocsShell.tsx');
const docsHeader = requireFile('components/docs/shell/DocsHeader.tsx');
const drawer = requireFile('components/docs/shell/AccessibleDrawer.tsx');
const sidebar = requireFile('components/docs/navigation/DocsSidebarV2.tsx');
const breadcrumbsPager = requireFile('components/docs/navigation/DocsNavigationChrome.tsx');
const toc = requireFile('components/docs/navigation/OnThisPageV2.tsx');
const hero = requireFile('components/docs/content/DocsPageHero.tsx');
const badges = requireFile('components/docs/status/DocsBadges.tsx');
const cursorGate = requireFile('components/docs/shell/CustomCursorGate.tsx');
const rootLayout = requireFile('app/layout.tsx');
const searchTrigger = requireFile('components/docs/shell/DocsSearchTrigger.tsx');
const search = requireFile('components/docs/DocsSidebarSearch.tsx');
const globalSearch = requireFile('components/docs/search/GlobalDocsSearch.tsx');

const requiredTokens = [
  '--apx-color-accent', '--apx-surface-page', '--apx-surface-raised', '--apx-surface-code',
  '--apx-border-subtle', '--apx-border-strong', '--apx-text-primary', '--apx-text-secondary',
  '--apx-space-1', '--apx-space-16', '--apx-radius-sm', '--apx-radius-xl', '--apx-shadow-sm',
  '--apx-motion-fast', '--apx-motion-standard', '--apx-z-header', '--apx-z-drawer',
  '--apx-content-width', '--apx-sidebar-width', '--apx-header-height', '--apx-font-body', '--apx-font-code',
  '--apx-focus-color', '--apx-focus-ring',
];
for (const token of requiredTokens) assert(tokenCss.includes(token), `semantic token missing: ${token}`);
for (const status of ['current', 'preview', 'experimental', 'roadmap', 'deprecated', 'removed']) {
  assert(tokenCss.includes(`--apx-status-${status}-fg`), `status foreground token missing: ${status}`);
  assert(tokenCss.includes(`--apx-status-${status}-bg`), `status background token missing: ${status}`);
}
assert(tokenCss.includes('.dark'), 'dark-theme semantic token overrides are missing');
assert(rootLayout.includes('THEME_BOOTSTRAP') && rootLayout.includes("prefers-color-scheme: dark"), 'pre-paint light/dark/system theme bootstrap is missing');

for (const file of ['app/docs/layout.tsx', 'app/docs/[...slug]/page.tsx', 'components/docs/shell/DocsShell.tsx', 'components/docs/shell/DocsHeader.tsx']) {
  assert(!/^['"]use client['"];?/m.test(requireFile(file)), `${file} must remain server-rendered`);
}
assert(docsLayout.includes('Skip to content') && docsLayout.includes('href="#docs-content"'), 'skip-to-content link is missing');
assert(docsShell.includes('<main id="docs-content"'), 'canonical docs main landmark/skip target is missing');
assert(docsShell.includes('DocsSidebarV2') && docsShell.includes('OnThisPageV2'), 'docs shell is not composed from reusable navigation primitives');
assert(docsHeader.includes('DocsSearchTrigger') && docsHeader.includes('ThemeToggle'), 'top navigation is missing search/theme controls');

assert(drawer.includes('role="dialog"') && drawer.includes('aria-modal="true"'), 'drawer is not an accessible modal dialog');
assert(drawer.includes("event.key === 'Escape'"), 'drawer Escape-close behavior is missing');
assert(drawer.includes("event.key !== 'Tab'"), 'drawer focus trap is missing');
assert(drawer.includes('triggerRef.current?.focus()'), 'drawer focus return is missing');
assert(drawer.includes('document.body.style.overflow'), 'drawer background scroll containment is missing');

assert(sidebar.includes('DocumentationNavigationGroup'), 'sidebar is not manifest-driven');
assert(sidebar.includes('item.children') && sidebar.includes('NavigationItems'), 'sidebar arbitrary-depth recursion is missing');
assert(sidebar.includes('aria-current={active ?'), 'sidebar active-route semantics are missing');
assert(breadcrumbsPager.includes('aria-label="Breadcrumb"') && breadcrumbsPager.includes("rel={direction === 'previous' ? 'prev' : 'next'}"), 'breadcrumbs/pager canonical semantics are missing');
assert(toc.includes('buildTree') && toc.includes('aria-current={activeId ==='), 'nested/active TOC behavior is missing');
assert(hero.includes('<h1') && hero.includes('Page metadata'), 'page hero hierarchy/metadata is missing');
for (const name of ['StabilityBadge', 'RuntimeBadge', 'PackageBadge', 'SinceBadge']) assert(badges.includes(`function ${name}`), `${name} is missing`);

assert(shellCss.includes(':focus-visible'), 'coherent focus-visible system is missing');
assert(shellCss.includes('outline: 2px solid var(--apx-focus-color)'), 'visible focus outline is missing');
assert(shellCss.includes('@media (min-width: 48rem)') && shellCss.includes('@media (min-width: 64rem)'), 'tablet/desktop responsive architecture is missing');
assert(shellCss.includes('@media (max-width: 22rem)'), 'narrow-mobile architecture is missing');
assert(shellCss.includes('100dvh') && shellCss.includes('safe-area-inset'), 'safe viewport/safe-area handling is missing');
assert(shellCss.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion media contract is missing');
assert(shellCss.includes('transition-duration:0s !important') && shellCss.includes('animation-duration:0s !important'), 'reduced-motion does not eliminate nonessential shell motion');
assert(cursorGate.includes("!pathname?.startsWith('/docs')") && cursorGate.includes('prefers-reduced-motion: reduce'), 'custom cursor is not disabled for docs/reduced motion');

assert(search.includes('inputId') && (search.includes('GlobalDocsSearch') || search.includes('InlineSearch')), 'sidebar search no longer delegates unique input identity');
assert(globalSearch.includes('data-docs-search-input') && globalSearch.includes('id={inputId}'), 'search instances cannot be uniquely identified in desktop/mobile shells');
assert(searchTrigger.includes('querySelectorAll<HTMLInputElement>') && searchTrigger.includes("event.key.toLowerCase() === 'k'"), 'search trigger does not resolve visible search / keyboard shortcut');

assert(routePage.includes('generateStaticParams') && routePage.includes('dynamicParams = false') && routePage.includes('notFound()'), 'DOC-1 route/static 404 contract regressed');
assert(routePage.includes('alternates: { canonical }'), 'DOC-1 canonical metadata regressed');

const pages = loadDocumentationPages();
const navigation = buildDocumentationNavigation(pages);
const flat = flattenDocumentationNavigation(navigation);
assert(flat.map((item) => item.href).join('|') === '/docs/getting-started|/docs/node/canvas|/docs/node/canvas/size-and-coordinates', 'navigation/pager order regressed');
const nodeFiltered = filterDocumentationNavigation(navigation, { runtime: 'node', package: 'apexify.js' });
assert(flattenDocumentationNavigation(nodeFiltered).length === flat.length, 'current node/package filter architecture drops valid current pages');

const generated = [
  'identity.json', 'baseline.json', 'token-audit.json', 'theme-audit.json', 'component-inventory.json',
  'client-boundaries.json', 'responsive-audit.json', 'keyboard-audit.json', 'focus-audit.json',
  'reduced-motion-audit.json', 'accessibility-audit.json', 'route-regression.json', 'dependency-audit.json', 'index.json',
];
for (const name of generated) {
  const content = requireFile(`generated/docs-doc2/${name}`);
  assert(!content.includes('/home/runner/') && !content.includes('C:\\'), `${name} contains a machine-specific checkout path`);
  assert(!/(ghp_|github_pat_|BEGIN PRIVATE KEY)/.test(content), `${name} appears to contain a secret`);
}

console.log(`[doc2-verify] PASS: ${generated.length} evidence files, ${flat.length} routed nav items, server-first shell + responsive/theme/focus/drawer contracts verified.`);
