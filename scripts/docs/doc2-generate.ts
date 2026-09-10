import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { discoverDocumentationSources, loadDocumentationPages } from '../../lib/docs/content';
import { buildDocumentationNavigation, flattenDocumentationNavigation } from '../../lib/docs/navigation';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc2');
const CHECK = process.argv.includes('--check');

const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const isClient = (file: string) => /^['"]use client['"];?/m.test(read(file));
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const sorted = <T>(items: T[], key: (item: T) => string) => [...items].sort((a, b) => key(a).localeCompare(key(b)));

const tokensCss = read('styles/docs-tokens.css');
const shellCss = read('styles/docs-shell.css');
const proseCss = read('styles/docs-prose.css');
const rootLayout = read('app/layout.tsx');
const docsLayout = read('app/docs/layout.tsx');
const routePage = read('app/docs/[...slug]/page.tsx');
const drawer = read('components/docs/shell/AccessibleDrawer.tsx');
const cursorGate = read('components/docs/shell/CustomCursorGate.tsx');
const sidebar = read('components/docs/navigation/DocsSidebarV2.tsx');
const toc = read('components/docs/navigation/OnThisPageV2.tsx');
const searchTrigger = read('components/docs/shell/DocsSearchTrigger.tsx');
const packageJson = JSON.parse(read('package.json')) as { dependencies: Record<string, string> };

const requiredTokens = [
  '--apx-color-accent', '--apx-surface-page', '--apx-surface-raised', '--apx-surface-code',
  '--apx-border-subtle', '--apx-border-strong', '--apx-text-primary', '--apx-text-secondary',
  '--apx-space-1', '--apx-space-16', '--apx-radius-sm', '--apx-radius-xl', '--apx-shadow-sm',
  '--apx-motion-fast', '--apx-motion-standard', '--apx-z-header', '--apx-z-drawer',
  '--apx-content-width', '--apx-sidebar-width', '--apx-toc-width', '--apx-header-height',
  '--apx-font-body', '--apx-font-code', '--apx-focus-color', '--apx-focus-ring',
];
const statuses = ['current', 'preview', 'experimental', 'roadmap', 'deprecated', 'removed'] as const;
const statusTokens = statuses.flatMap((status) => [`--apx-status-${status}-fg`, `--apx-status-${status}-bg`]);
const missingTokens = [...requiredTokens, ...statusTokens].filter((token) => !tokensCss.includes(token));

const componentFiles = [
  'app/docs/layout.tsx',
  'app/docs/[...slug]/page.tsx',
  'components/docs/shell/DocsShell.tsx',
  'components/docs/shell/DocsHeader.tsx',
  'components/docs/shell/AccessibleDrawer.tsx',
  'components/docs/shell/DocsSearchTrigger.tsx',
  'components/docs/shell/LegacyDocsRedirectIsland.tsx',
  'components/docs/shell/LegacyDocsSidebarToggle.tsx',
  'components/docs/navigation/DocsSidebarV2.tsx',
  'components/docs/navigation/DocsNavigationChrome.tsx',
  'components/docs/navigation/OnThisPageV2.tsx',
  'components/docs/content/DocsPageHero.tsx',
  'components/docs/status/DocsBadges.tsx',
  'components/docs/DocsSidebarSearch.tsx',
  'components/ThemeToggle.tsx',
  'components/docs/route/RouteDocsMarkdown.tsx',
];

const pages = loadDocumentationPages();
const navigation = buildDocumentationNavigation(pages);
const sources = discoverDocumentationSources();

const baseline = {
  schemaVersion: 1,
  phase: 'DOC-2',
  startingSha: 'c3d0799b8fb67fd7c86d48aceaa8c88e5e3d649f',
  provenance: {
    browserWorkflowRun: 34329043163,
    artifactId: 10095034582,
    artifactDigest: 'sha256:f46e90ccf3dd90779ff7cc324395c4f15713b6309b49d48109c16a04d9672278',
  },
  build: { wallMs: 37079.165, routedManifestJsBytes: 1010958, sourceCssBytes: 24878 },
  lighthouse: {
    desktop: { performance: 67, accessibility: 92, bestPractices: 96, seo: 100, lcpMs: 1067.17015, cls: 0.8891731202128843, tbtMs: 213.60995 },
    mobile: { performance: 62, accessibility: 96, bestPractices: 96, seo: 100, lcpMs: 4824.8772, cls: 0, tbtMs: 891 },
  },
  browser: {
    desktopLight: { skipLinks: 0, smallTargets: 51, motionElements: 95, seriousAxe: 2, criticalAxe: 0, cls: 0.19893223892023534 },
    desktopDark: { skipLinks: 0, smallTargets: 51, motionElements: 95, seriousAxe: 2, criticalAxe: 0, cls: 0.21028247221016588 },
    mobileLight: { skipLinks: 0, smallTargets: 31, motionElements: 90, seriousAxe: 2, criticalAxe: 0, cls: 0 },
    reducedMotion: { motionElements: 95, seriousAxe: 2, criticalAxe: 0, cls: 0.197543342496142 },
  },
};

const artifacts: Record<string, unknown> = {
  'identity.json': {
    schemaVersion: 1,
    phase: 'DOC-2',
    packageRepository: 'EIAS79/Apexify.js',
    documentationRepository: 'EIAS79/Apexify.js-Documentation',
    packageMainSha: 'dbed9743353593eafae9a7b1c25312d7170a233b',
    packageVersion: '6.0.0',
    phase14pFrozenSha: '5d9b71f185140d6c3477286b8fb111f293e52b48',
    doc0MergeSha: '573b592942327d451661cd55d50fd237630eb5cf',
    doc1MergeSha: 'c3d0799b8fb67fd7c86d48aceaa8c88e5e3d649f',
    doc2StartingSha: 'c3d0799b8fb67fd7c86d48aceaa8c88e5e3d649f',
  },
  'baseline.json': baseline,
  'token-audit.json': {
    schemaVersion: 1,
    requiredTokens,
    statusTokens,
    missingTokens,
    source: 'styles/docs-tokens.css',
  },
  'theme-audit.json': {
    schemaVersion: 1,
    modes: ['light', 'dark', 'system'],
    semanticTokenSource: 'styles/docs-tokens.css',
    darkOverridePresent: /\.dark\s*\{/.test(tokensCss),
    prePaintBootstrap: rootLayout.includes('THEME_BOOTSTRAP'),
    systemMatchMedia: rootLayout.includes("prefers-color-scheme: dark"),
    hydrationSuppressionScopedToHtml: rootLayout.includes('suppressHydrationWarning'),
  },
  'component-inventory.json': {
    schemaVersion: 1,
    components: sorted(componentFiles.map((file) => ({ file, boundary: isClient(file) ? 'client' : 'server' })), (item) => item.file),
  },
  'client-boundaries.json': {
    schemaVersion: 1,
    routePageServer: !isClient('app/docs/[...slug]/page.tsx'),
    docsLayoutServer: !isClient('app/docs/layout.tsx'),
    docsShellServer: !isClient('components/docs/shell/DocsShell.tsx'),
    docsHeaderServer: !isClient('components/docs/shell/DocsHeader.tsx'),
    clientIslands: sorted(componentFiles.filter(isClient), (file) => file),
  },
  'responsive-audit.json': {
    schemaVersion: 1,
    breakpoints: { tablet: shellCss.includes('@media (min-width: 48rem)'), desktop: shellCss.includes('@media (min-width: 64rem)'), narrowMobile: shellCss.includes('@media (max-width: 22rem)') },
    safeViewport: shellCss.includes('100dvh'),
    safeArea: shellCss.includes('safe-area-inset'),
    horizontalContainment: proseCss.includes('overflow-x:auto') || proseCss.includes('overflow-x: auto'),
    desktopThreeColumnGrid: shellCss.includes('grid-template-columns:var(--apx-sidebar-width) minmax(0,1fr) var(--apx-toc-width)'),
  },
  'keyboard-audit.json': {
    schemaVersion: 1,
    skipToContent: docsLayout.includes('href="#docs-content"'),
    drawerEscape: drawer.includes("event.key === 'Escape'"),
    drawerTabTrap: drawer.includes("event.key !== 'Tab'"),
    focusReturn: drawer.includes('triggerRef.current?.focus()'),
    searchShortcut: searchTrigger.includes("event.key.toLowerCase() === 'k'"),
    canonicalLinks: routePage.includes('DocsBreadcrumbsV2') && routePage.includes('DocsPagerV2'),
  },
  'focus-audit.json': {
    schemaVersion: 1,
    focusVisibleSelector: shellCss.includes(':focus-visible'),
    visibleOutline: shellCss.includes('outline: 2px solid var(--apx-focus-color)'),
    minimumShellTarget: shellCss.includes('min-height:2.75rem') || shellCss.includes('min-height: 2.75rem'),
    focusTokens: requiredTokens.filter((token) => token.includes('focus')).every((token) => tokensCss.includes(token)),
  },
  'reduced-motion-audit.json': {
    schemaVersion: 1,
    mediaQuery: shellCss.includes('@media (prefers-reduced-motion: reduce)'),
    disablesSmoothScroll: shellCss.includes('scroll-behavior:auto !important'),
    removesTransitions: shellCss.includes('transition-duration:0s !important'),
    removesAnimations: shellCss.includes('animation-duration:0s !important'),
    cursorDisabled: cursorGate.includes('prefers-reduced-motion: reduce') && cursorGate.includes("!pathname?.startsWith('/docs')"),
  },
  'accessibility-audit.json': {
    schemaVersion: 1,
    sourceChecks: {
      semanticMain: routePage.includes('<DocsShell'),
      skipLink: docsLayout.includes('Skip to content'),
      modalDrawer: drawer.includes('role="dialog"') && drawer.includes('aria-modal="true"'),
      namedDrawer: drawer.includes('aria-label={label}'),
      sidebarNavigation: sidebar.includes('aria-label="Documentation"'),
      tocNavigation: toc.includes('aria-label="On this page"'),
      focusSystem: shellCss.includes(':focus-visible'),
    },
    runtimeAudit: 'captured by DOC-2 CI artifact; serious/critical violations are gating',
  },
  'route-regression.json': {
    schemaVersion: 1,
    routedPages: pages.map((page) => ({ slug: page.slug, canonicalPath: page.canonicalPath })).sort((a, b) => a.slug.localeCompare(b.slug)),
    routedCount: pages.length,
    legacyFallbackCount: sources.length - pages.length,
    navigationOrder: flattenDocumentationNavigation(navigation).map((item) => item.href),
    catchAllServer: !isClient('app/docs/[...slug]/page.tsx'),
    staticParams: routePage.includes('generateStaticParams'),
    canonicalMetadata: routePage.includes('alternates: { canonical }'),
    unknownRoute404: routePage.includes('notFound()') && routePage.includes('dynamicParams = false'),
  },
  'dependency-audit.json': {
    schemaVersion: 1,
    productionDependencies: Object.fromEntries(Object.entries(packageJson.dependencies).sort(([a], [b]) => a.localeCompare(b))),
    doc2AddedProductionDependencies: [],
    browserAuditTools: 'ephemeral CI-only puppeteer-core + axe-core + lighthouse; not package dependencies',
  },
};

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const rendered = Object.fromEntries(Object.entries(artifacts).map(([name, value]) => [name, serialize(value)]));
const index = {
  schemaVersion: 1,
  phase: 'DOC-2',
  files: Object.keys(rendered).sort().map((name) => ({ name, sha256: sha256(rendered[name]) })),
};
rendered['index.json'] = serialize(index);

if (CHECK) {
  const problems: string[] = [];
  for (const [name, content] of Object.entries(rendered)) {
    const target = path.join(OUT, name);
    if (!fs.existsSync(target)) problems.push(`${name}: missing`);
    else if (fs.readFileSync(target, 'utf8') !== content) problems.push(`${name}: stale`);
  }
  if (problems.length) throw new Error(`[doc2-generate] generated evidence is not current:\n${problems.join('\n')}`);
  console.log(`[doc2-generate] ${Object.keys(rendered).length} generated evidence files are current.`);
} else {
  fs.mkdirSync(OUT, { recursive: true });
  for (const entry of fs.readdirSync(OUT)) {
    if (entry.endsWith('.json') && !rendered[entry]) fs.rmSync(path.join(OUT, entry));
  }
  for (const [name, content] of Object.entries(rendered)) fs.writeFileSync(path.join(OUT, name), content);
  console.log(`[doc2-generate] wrote ${Object.keys(rendered).length} deterministic evidence files.`);
}
