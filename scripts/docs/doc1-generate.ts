import fs from 'node:fs';
import path from 'node:path';
import {
  discoverDocumentationSources,
  loadDocumentationPages,
} from '../../lib/docs/content';
import {
  DOCUMENTATION_PACKAGES,
  DOCUMENTATION_PAGE_KINDS,
  DOCUMENTATION_RUNTIMES,
  DOCUMENTATION_STABILITIES,
} from '../../lib/docs/schema';
import { buildDocumentationNavigation } from '../../lib/docs/navigation';
import {
  DEFAULT_DOC_FILENAME,
  DOC_FILENAME_ALIASES,
} from '../../lib/doc-filename-aliases';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'generated', 'docs-doc1');
const CHECK = process.argv.includes('--check');
const SITE_ORIGIN = 'https://apexifyjs.vercel.app';

function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeOrCheck(name: string, value: unknown): void {
  const target = path.join(OUTPUT_DIR, name);
  const expected = stable(value);
  if (CHECK) {
    if (!fs.existsSync(target)) {
      throw new Error(`[doc1-generate] missing generated artifact ${name}`);
    }
    const actual = fs.readFileSync(target, 'utf8');
    if (actual !== expected) {
      throw new Error(
        `[doc1-generate] ${name} is stale; run npm run docs:generate:doc1`,
      );
    }
    return;
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(target, expected);
}

const pages = loadDocumentationPages();
const sources = discoverDocumentationSources();
const navigation = buildDocumentationNavigation(pages);
const legacyMap = new Map<string, string>();
for (const page of pages) {
  for (const identity of [page.id, ...page.legacyHashes, ...page.aliases]) {
    legacyMap.set(identity, page.canonicalPath);
  }
}

const redirectRoutes = pages.map((page) => ({
  slug: page.slug,
  canonicalPath: page.canonicalPath,
  legacyHashes: page.legacyHashes,
  aliases: page.aliases,
}));

const legacyDocuments = sources.map((source) => {
  const canonicalPath = legacyMap.get(source.filename) ?? null;
  return {
    identity: source.filename,
    sourcePath: source.sourcePath,
    state: canonicalPath ? 'MIGRATED' : 'LEGACY_FALLBACK',
    target: canonicalPath ?? `/docs#${source.filename}`,
  };
});

const legacyAliases = Object.entries(DOC_FILENAME_ALIASES)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([alias, targetIdentity]) => ({
    alias,
    targetIdentity,
    state: legacyMap.has(alias) || legacyMap.has(targetIdentity) ? 'MIGRATED' : 'LEGACY_FALLBACK',
    target:
      legacyMap.get(alias) ??
      legacyMap.get(targetIdentity) ??
      `/docs#${targetIdentity}`,
  }));

const linkPattern = /\]\((\/docs#[^)]+)\)/g;
const migratedLinkSamples: Array<{
  sourcePath: string;
  authoredHref: string;
  resolvedHref: string;
  migrated: boolean;
}> = [];

for (const page of pages) {
  for (const match of page.body.matchAll(linkPattern)) {
    const authoredHref = match[1];
    const fragment = authoredHref.slice('/docs#'.length);
    const queryIndex = fragment.indexOf('?');
    const identity = queryIndex >= 0 ? fragment.slice(0, queryIndex) : fragment;
    const canonicalPath = legacyMap.get(identity);
    let resolvedHref = authoredHref;
    if (canonicalPath) {
      const params =
        queryIndex >= 0 ? new URLSearchParams(fragment.slice(queryIndex + 1)) : null;
      const heading = params?.get('h');
      resolvedHref = heading
        ? `${canonicalPath}#${encodeURIComponent(heading)}`
        : canonicalPath;
    }
    migratedLinkSamples.push({
      sourcePath: page.sourcePath,
      authoredHref,
      resolvedHref,
      migrated: resolvedHref !== authoredHref,
    });
  }
}

writeOrCheck('identity.json', {
  schemaVersion: 1,
  phase: 'DOC-1',
  docsRepository: 'EIAS79/Apexify.js-Documentation',
  docsBaseSha: '573b592942327d451661cd55d50fd237630eb5cf',
  packageRepository: 'EIAS79/Apexify.js',
  packageMainSha: 'dbed9743353593eafae9a7b1c25312d7170a233b',
  packageVersion: '6.0.0',
  phase14PFrozenSha: '5d9b71f185140d6c3477286b8fb111f293e52b48',
  branch: 'doc1-information-architecture',
});

writeOrCheck('schema.json', {
  schemaVersion: 1,
  pageKinds: DOCUMENTATION_PAGE_KINDS,
  stabilities: DOCUMENTATION_STABILITIES,
  runtimes: DOCUMENTATION_RUNTIMES,
  packages: DOCUMENTATION_PACKAGES,
  requiredFields: [
    'title',
    'description',
    'slug',
    'kind',
    'category',
    'order',
    'package',
    'runtime',
    'stability',
    'canonical',
  ],
  optionalFields: [
    'frameworks',
    'since',
    'deprecatedSince',
    'removedIn',
    'replacedBy',
    'feature',
    'apiSymbols',
    'keywords',
    'prerequisites',
    'related',
    'examples',
    'toc',
    'search',
    'aliases',
    'legacyHashes',
  ],
  frontmatterParser:
    'first-party deterministic key:value subset with JSON-compatible scalar/array values',
});

writeOrCheck('docs-manifest.json', {
  schemaVersion: 1,
  managedPageCount: pages.length,
  legacyFallbackPageCount: sources.length - pages.length,
  pages: pages.map((page) => ({
    id: page.id,
    sourcePath: page.sourcePath,
    slug: page.slug,
    canonicalPath: page.canonicalPath,
    title: page.title,
    description: page.description,
    kind: page.kind,
    category: page.category,
    order: page.order,
    package: page.package,
    runtime: page.runtime,
    frameworks: page.frameworks,
    stability: page.stability,
    since: page.since ?? null,
    feature: page.feature ?? null,
    apiSymbols: page.apiSymbols,
    keywords: page.keywords,
    related: page.related,
    toc: page.toc,
    search: page.search,
    aliases: page.aliases,
    legacyHashes: page.legacyHashes,
    headings: page.headings,
  })),
});

writeOrCheck('navigation-manifest.json', {
  schemaVersion: 1,
  groups: navigation,
  source: 'lib/docs/navigation.ts::DOCUMENTATION_NAVIGATION_MANIFEST',
});

writeOrCheck('redirect-manifest.json', {
  schemaVersion: 1,
  canonicalEntry: '/docs/getting-started',
  deepHeadingConvention: '/docs#legacy-document?h=heading-id -> /docs/canonical#heading-id',
  routes: redirectRoutes,
  legacyDocuments,
  legacyAliases,
  defaultLegacyIdentity: DEFAULT_DOC_FILENAME,
});

writeOrCheck('migrated-pages.json', {
  schemaVersion: 1,
  strategy: 'representative vertical slice only; broad migration is deferred to DOC-9',
  pages: pages.map((page) => ({
    sourcePath: page.sourcePath,
    legacyHashes: page.legacyHashes,
    canonicalPath: page.canonicalPath,
    kind: page.kind,
  })),
});

writeOrCheck('route-verification.json', {
  schemaVersion: 1,
  routeImplementation: 'app/docs/[...slug]/page.tsx',
  staticParams: pages.map((page) => page.slug.split('/')),
  canonicalRoutes: pages.map((page) => page.canonicalPath),
  dynamicParams: false,
  unknownRoutePolicy: '404',
  rootDocsPolicy:
    '/docs remains the compatibility entry because URL fragments are client-only; no-hash and migrated hashes replace to canonical routes',
});

writeOrCheck('redirect-verification.json', {
  schemaVersion: 1,
  cases: [
    { from: '/docs#00-start-here', to: '/docs/getting-started' },
    { from: '/docs#start-here', to: '/docs/getting-started' },
    { from: '/docs#Getting-Started', to: '/docs/getting-started' },
    {
      from: '/docs#00-create-canvas-overview?h=signature-types',
      to: '/docs/node/canvas#signature-types',
    },
    {
      from: '/docs#01-canvas-size-and-coordinates',
      to: '/docs/node/canvas/size-and-coordinates',
    },
  ],
  unmigratedPolicy: 'retain legacy /docs#document-id behavior until DOC-9',
});

writeOrCheck('metadata-verification.json', {
  schemaVersion: 1,
  siteOrigin: SITE_ORIGIN,
  pages: pages.map((page) => ({
    canonicalPath: page.canonicalPath,
    canonicalUrl: `${SITE_ORIGIN}${page.canonicalPath}`,
    title: `${page.title} | Apexify.js Docs`,
    description: page.description,
    openGraphUrl: `${SITE_ORIGIN}${page.canonicalPath}`,
    indexable: !['ROADMAP', 'REMOVED'].includes(page.stability),
  })),
});

writeOrCheck('rendering-verification.json', {
  schemaVersion: 1,
  serverStaticRoute: 'app/docs/[...slug]/page.tsx',
  serverContentLoader: 'lib/docs/content.ts',
  serverMarkdownRenderer: 'components/docs/route/RouteDocsMarkdown.tsx',
  clientIslands: [
    'app/docs/layout.tsx (legacy fragment compatibility + existing shell)',
    'components/docs/route/RouteDocsFrame.tsx (sidebar state)',
    'components/docs/route/RouteDocSidebar.tsx (mobile navigation/search)',
    'components/DocLayout.tsx (existing reading progress/TOC shell)',
    'components/mdx/CodeBlock.tsx (copy/Studio affordance)',
  ],
  forbiddenPattern:
    'routed pages do not fetch raw documentation content after hydration and do not identify documents from location.hash',
});

writeOrCheck('search-verification.json', {
  schemaVersion: 1,
  scope: 'DOC-1 route-awareness only; DOC-6 owns the future build-time search replacement',
  endpoint: '/api/docs/search',
  migratedResults: 'canonical route href',
  unmigratedResults: 'legacy /docs#document-id href',
  searchImplementationRetained: 'request-time filesystem scan',
});

writeOrCheck('link-verification.json', {
  schemaVersion: 1,
  migratedDocumentReferences: migratedLinkSamples,
  mappedReferenceCount: migratedLinkSamples.filter((entry) => entry.migrated).length,
  fallbackReferenceCount: migratedLinkSamples.filter((entry) => !entry.migrated).length,
});

if (CHECK) {
  console.log(`[doc1-generate] ${pages.length} routed pages and ${sources.length - pages.length} legacy fallbacks are current.`);
} else {
  console.log(`[doc1-generate] wrote DOC-1 static evidence for ${pages.length} routed pages.`);
}
