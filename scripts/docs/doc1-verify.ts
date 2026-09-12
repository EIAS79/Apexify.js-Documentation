import fs from 'node:fs';
import path from 'node:path';
import {
  discoverDocumentationSources,
  getDocumentationPageByLegacyIdentity,
  getDocumentationPageBySlug,
  loadDocumentationPages,
} from '../../lib/docs/content';
import { buildDocumentationNavigation } from '../../lib/docs/navigation';

const ROOT = process.cwd();

function requireFile(relativePath: string): string {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`[doc1-verify] required file missing: ${relativePath}`);
  }
  return fs.readFileSync(absolute, 'utf8');
}

const pages = loadDocumentationPages();
const sources = discoverDocumentationSources();

if (pages.length < 3) {
  throw new Error('[doc1-verify] representative migration must contain at least three routed pages');
}
if (pages.length > 5) {
  throw new Error(
    '[doc1-verify] DOC-1 migration exceeded the representative slice; broad migration belongs to DOC-9',
  );
}
if (sources.length - pages.length < 100) {
  throw new Error(
    '[doc1-verify] legacy corpus fallback unexpectedly disappeared; broad migration is out of scope',
  );
}

for (const slug of [
  'getting-started',
  'node/canvas',
  'node/canvas/size-and-coordinates',
]) {
  if (!getDocumentationPageBySlug(slug)) {
    throw new Error(`[doc1-verify] required routed page missing: ${slug}`);
  }
}

const start = getDocumentationPageByLegacyIdentity('00-start-here');
const canvas = getDocumentationPageByLegacyIdentity('00-create-canvas-overview');
if (start?.canonicalPath !== '/docs/getting-started') {
  throw new Error('[doc1-verify] Start Here legacy identity is not canonicalized');
}
if (canvas?.canonicalPath !== '/docs/node/canvas') {
  throw new Error('[doc1-verify] Canvas legacy identity is not canonicalized');
}

buildDocumentationNavigation(pages);

const catchAll = requireFile('app/docs/[...slug]/page.tsx');
for (const token of ['generateStaticParams', 'generateMetadata', 'dynamicParams = false', 'notFound()']) {
  if (!catchAll.includes(token)) {
    throw new Error(`[doc1-verify] catch-all route is missing ${token}`);
  }
}
if (/^['"]use client['"];?/m.test(catchAll)) {
  throw new Error('[doc1-verify] catch-all routed page must remain a server component');
}

if (fs.existsSync(path.join(ROOT, 'app/docs/getting-started/page.tsx'))) {
  throw new Error(
    '[doc1-verify] old hand-authored /docs/getting-started route still shadows the normalized catch-all',
  );
}

const layout = requireFile('app/docs/layout.tsx');
const legacyIsland = requireFile('components/docs/shell/LegacyDocsRedirectIsland.tsx');
if (!layout.includes('LegacyDocsRedirectIsland') || !legacyIsland.includes('resolveLegacyDocumentationFragment')) {
  throw new Error('[doc1-verify] /docs compatibility layer does not canonicalize migrated hash links');
}

const searchRoute = requireFile('app/api/docs/search/route.ts');
const doc6RecordsPath = path.join(ROOT, 'generated/docs-doc6/search-records.json');
if (fs.existsSync(doc6RecordsPath)) {
  const usesGeneratedSearchData = searchRoute.includes('generated/docs-doc6/search-records.json') || searchRoute.includes('lib/search/server-data');
  if (!searchRoute.includes('canonicalHref') || !usesGeneratedSearchData) {
    throw new Error('[doc1-verify] DOC-6 search endpoint does not return generated canonical route hrefs');
  }
  const artifact = JSON.parse(fs.readFileSync(doc6RecordsPath, 'utf8')) as {
    records?: Array<{ kind?: string; canonicalHref?: string }>;
  };
  const canonicalDocHrefs = new Set(
    (artifact.records ?? [])
      .filter((record) => record.kind === 'doc' && typeof record.canonicalHref === 'string')
      .map((record) => record.canonicalHref as string),
  );
  for (const page of pages) {
    if (!canonicalDocHrefs.has(page.canonicalPath)) {
      throw new Error(`[doc1-verify] DOC-6 search index is missing canonical DOC-1 route: ${page.canonicalPath}`);
    }
  }
  const globalSearch = requireFile('components/docs/search/GlobalDocsSearch.tsx');
  if (!globalSearch.includes('router.push(result.canonicalHref)')) {
    throw new Error('[doc1-verify] shared DOC-6 search UI does not navigate using canonical result href');
  }
} else {
  if (!searchRoute.includes('canonicalPath') || !searchRoute.includes('href')) {
    throw new Error('[doc1-verify] search results are not route-aware');
  }
  const sidebarSearch = requireFile('components/docs/DocsSidebarSearch.tsx');
  if (!sidebarSearch.includes('router.push(result.href)')) {
    throw new Error('[doc1-verify] sidebar search does not navigate using result canonical href');
  }
}

const routedSidebar = fs.existsSync(path.join(ROOT, 'components/docs/navigation/DocsSidebarV2.tsx'))
  ? requireFile('components/docs/navigation/DocsSidebarV2.tsx')
  : requireFile('components/docs/route/RouteDocSidebar.tsx');
if (!routedSidebar.includes('DocumentationNavigationGroup')) {
  throw new Error('[doc1-verify] routed sidebar is not driven by the navigation manifest');
}

const routeRenderer = requireFile('components/docs/route/RouteDocsMarkdown.tsx');
if (!routeRenderer.includes('canonicalizeLegacyDocumentationHref')) {
  throw new Error('[doc1-verify] routed content does not canonicalize migrated internal doc links');
}

const generatedRequired = [
  'identity.json',
  'schema.json',
  'docs-manifest.json',
  'navigation-manifest.json',
  'redirect-manifest.json',
  'migrated-pages.json',
  'route-verification.json',
  'redirect-verification.json',
  'metadata-verification.json',
  'rendering-verification.json',
  'search-verification.json',
  'link-verification.json',
];
for (const name of generatedRequired) {
  requireFile(`generated/docs-doc1/${name}`);
}

console.log(
  `[doc1-verify] PASS: ${pages.length} routed pages, ${sources.length - pages.length} legacy fallbacks, normalized navigation/search/metadata/redirect controls present.`,
);
