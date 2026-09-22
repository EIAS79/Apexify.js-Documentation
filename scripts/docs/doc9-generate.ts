import fs from 'node:fs';
import path from 'node:path';
import { discoverDocumentationSources, loadDocumentationPages } from '../../lib/docs/content';
import { buildDocumentationNavigation, flattenDocumentationNavigation } from '../../lib/docs/navigation';
import { doc9Disposition } from '../../lib/docs/doc9-migration';
import { resolveDoc9LegacyIdentity } from '../../lib/docs/doc9-legacy-client';
import { CURRENT_CAPABILITIES } from '../../lib/product/catalog-data';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'generated', 'docs-doc9');
const CHECK = process.argv.includes('--check');
const PACKAGE_VERSION = '6.0.0';
const PACKAGE_SHA = 'f57bb82743c8f71bbe7e519d060010f970b06ef9';
const PACKAGE_MAIN_SHA = '2b64087a04411982067cc624031b3de6f663c530';
const PHASE14P_FROZEN_SHA = '5d9b71f185140d6c3477286b8fb111f293e52b48';
const DOC9_BASE_SHA = 'a1e7a6ddca0b7c0e7193b4dceb56e7cd900862f3';

function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function emit(name: string, value: unknown): void {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const target = path.join(OUTPUT, name);
  const expected = stable(value);
  if (CHECK) {
    if (!fs.existsSync(target)) throw new Error(`[doc9] missing generated artifact ${name}`);
    if (fs.readFileSync(target, 'utf8') !== expected) {
      throw new Error(`[doc9] generated artifact ${name} is stale; run npm run docs:generate:doc9`);
    }
    return;
  }
  fs.writeFileSync(target, expected);
}

function readJson<T = any>(relative: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8')) as T;
}

const sources = discoverDocumentationSources();
const pages = loadDocumentationPages();
const navigation = buildDocumentationNavigation(pages);
const pageBySource = new Map(pages.map((page) => [page.sourcePath, page]));
const records = sources.map((source) => {
  const raw = fs.readFileSync(source.absolutePath, 'utf8');
  const existing = source.hasFrontmatter ? pageBySource.get(source.sourcePath) : undefined;
  return doc9Disposition(
    source.sourcePath,
    source.hasFrontmatter,
    raw,
    existing
      ? {
          canonicalPath: existing.canonicalPath,
          title: existing.title,
          category: existing.category,
          feature: existing.feature,
        }
      : undefined,
  );
});

if (records.length !== sources.length) throw new Error('[doc9] migration manifest does not cover every source');
if (new Set(records.map((record) => record.legacyPath)).size !== sources.length) throw new Error('[doc9] duplicate migration source records');

const classificationKeys = ['keep', 'rewrite', 'split', 'merge', 'move', 'archive', 'delete'] as const;
const classification = Object.fromEntries(
  classificationKeys.map((key) => [key, records.filter((record) => record.classification === key).length]),
);
const activeRecords = records.filter((record) => !['archive', 'delete', 'merge'].includes(record.classification));
const missingTargets = records.filter((record) => record.targetRoutes.length === 0);
const unroutedActive = activeRecords.filter((record) => !pageBySource.has(record.legacyPath));
const targetMismatches = activeRecords.filter((record) => {
  const page = pageBySource.get(record.legacyPath);
  return page ? !record.targetRoutes.includes(page.canonicalPath) : false;
});
const duplicateRoutes = pages
  .map((page) => page.canonicalPath)
  .filter((route, index, all) => all.indexOf(route) !== index);

const clientRedirectMismatches = records
  .filter((record) => record.redirectRequired)
  .map((record) => ({
    source: record.legacyPath,
    identity: record.legacyId,
    expected: record.targetRoutes[0] ?? null,
    actual: resolveDoc9LegacyIdentity(record.legacyId),
  }))
  .filter((entry) => entry.actual !== entry.expected);

const apiCoverage = readJson<any>('generated/docs-doc4/api-coverage.json');
const apiManifest = readJson<any>('generated/docs-doc4/api-manifest.json');
const exampleManifest = readJson<any>('generated/docs-doc5/example-manifest.json');
const apiIds = new Set<string>([
  ...apiManifest.symbols.map((symbol: any) => symbol.id),
  ...apiManifest.symbols.flatMap((symbol: any) => symbol.members.map((member: any) => member.id)),
]);
const apiComplete =
  apiCoverage.missingPublicExports.length === 0 &&
  apiCoverage.missingOptionPaths.length === 0 &&
  apiCoverage.signatureMismatches.length === 0;

const capabilityById = new Map(CURRENT_CAPABILITIES.map((capability) => [capability.id, capability]));
const activeFeatureIds = [...new Set<string>([
  ...CURRENT_CAPABILITIES.map((capability) => capability.id),
  ...records.flatMap((record) => record.featureIds),
  ...exampleManifest.examples.flatMap((example: any) => example.features ?? []),
])].sort();

function currentCapabilityApi(feature: string): string[] {
  const capability = capabilityById.get(feature);
  return capability ? [`apexify.js::ApexPainter#${capability.apiMember}`] : [];
}

const featureRows = activeFeatureIds.map((feature) => {
  const featurePages = pages.filter((page) => page.feature === feature);
  const featureExamples = exampleManifest.examples.filter((example: any) => (example.features ?? []).includes(feature));
  const apiSymbols = [...new Set<string>([
    ...featurePages.flatMap((page) => page.apiSymbols),
    ...featureExamples.flatMap((example: any) => example.apiSymbols ?? []),
    ...currentCapabilityApi(feature),
  ])].sort();
  const invalidApiSymbols = apiSymbols.filter((symbol) => {
    if (apiIds.has(symbol)) return false;
    const converted = symbol.includes('.') && !symbol.includes('::')
      ? `apexify.js::${symbol.replace('.', '#')}`
      : symbol;
    return !apiIds.has(converted);
  });
  const joined = featurePages.map((page) => page.body).join('\n').toLowerCase();
  const guide = featurePages.length > 0 ? 'COMPLETE' : 'BLOCKED';
  const apiReference = apiSymbols.length === 0 ? 'PARTIAL' : invalidApiSymbols.length === 0 && apiComplete ? 'COMPLETE' : 'BLOCKED';
  const optionsComplete = apiReference === 'COMPLETE' && apiCoverage.missingOptionPaths.length === 0 ? 'COMPLETE' : apiReference === 'BLOCKED' ? 'BLOCKED' : 'PARTIAL';
  const examples = featureExamples.length > 0 || featurePages.some((page) => page.examples.length > 0) ? 'COMPLETE' : 'PARTIAL';
  const errors = /error|fail|invalid|throw|reject|troubleshoot/.test(joined) ? 'COMPLETE' : 'PARTIAL';
  const limits = /limit|maximum|max |budget|bounded|size/.test(joined) ? 'COMPLETE' : 'PARTIAL';
  const performance = /performance|memory|expensive|cache|concurrency|cost/.test(joined) ? 'COMPLETE' : 'PARTIAL';
  const security = /security|untrusted|ssrf|remote|sanitize|safe|path traversal/.test(joined) ? 'COMPLETE' : 'NOT APPLICABLE';
  const migration = /migration|deprecated|compatib/.test(joined) ? 'COMPLETE' : 'NOT APPLICABLE';
  const relevantStates = [guide, apiReference, optionsComplete, examples, errors, limits, performance, security]
    .filter((state) => state !== 'NOT APPLICABLE');
  const status = relevantStates.every((state) => state === 'COMPLETE') ? 'COMPLETE' : relevantStates.includes('BLOCKED') ? 'BLOCKED' : 'PARTIAL';
  return {
    feature,
    package: 'apexify.js',
    runtime: ['node'],
    guide,
    apiReference,
    optionsComplete,
    examples,
    errors,
    limits,
    performance,
    security,
    animation: 'NOT APPLICABLE',
    migration,
    verifiedVersion: PACKAGE_VERSION,
    status,
    canonicalRoutes: featurePages.map((page) => page.canonicalPath).sort(),
    apiSymbols,
    invalidApiSymbols,
    exampleIds: featureExamples.map((example: any) => example.id).sort(),
  };
});

const legacyOnly = featureRows
  .filter((row) => row.guide !== 'COMPLETE')
  .map((row) => ({
    activeFeatureId: row.feature,
    legacyPageOrHash: records.filter((record) => record.featureIds.includes(row.feature)).map((record) => record.legacyHash),
    canonicalReplacement: row.canonicalRoutes,
    migrationState: 'blocked',
  }));

if (legacyOnly.length !== 0) {
  throw new Error(`[doc9] active_feature_legacy_only_count must be 0; found ${legacyOnly.map((row) => row.activeFeatureId).join(', ')}`);
}
if (missingTargets.length || unroutedActive.length || targetMismatches.length || duplicateRoutes.length) {
  throw new Error(
    `[doc9] migration integrity failed: missingTargets=${missingTargets.length}, unroutedActive=${unroutedActive.length}, targetMismatches=${targetMismatches.length}, duplicateRoutes=${duplicateRoutes.length}`,
  );
}
if (clientRedirectMismatches.length) {
  throw new Error(`[doc9] legacy client mapping is incomplete: ${clientRedirectMismatches.map((entry) => `${entry.identity}:${entry.actual ?? 'null'}!=${entry.expected}`).join(', ')}`);
}

const sourceLegacyLinks = records.flatMap((record) => {
  const raw = fs.readFileSync(path.join(ROOT, record.legacyPath), 'utf8');
  return [...raw.matchAll(/\]\((\/docs#[^)]+)\)/g)].map((match) => ({ source: record.legacyPath, href: match[1] }));
});
const unresolvedLegacyLinks = sourceLegacyLinks.filter((entry) => {
  const fragment = entry.href.slice('/docs#'.length).split('?')[0];
  return !resolveDoc9LegacyIdentity(fragment);
});
if (unresolvedLegacyLinks.length) {
  throw new Error(`[doc9] unresolved legacy internal links: ${unresolvedLegacyLinks.map((entry) => `${entry.source}:${entry.href}`).join(', ')}`);
}

const routeMap = records.map((record) => ({
  legacyPath: record.legacyPath,
  legacyHash: record.legacyHash,
  canonicalRoutes: record.targetRoutes,
  classification: record.classification,
  redirectRequired: record.redirectRequired,
}));
const archive = records.filter((record) => record.classification === 'archive');
const deletions = records.filter((record) => record.classification === 'delete');
const canonicalPages = pages.map((page) => ({
  sourcePath: page.sourcePath,
  route: page.canonicalPath,
  kind: page.kind,
  feature: page.feature ?? null,
  search: page.search,
  headingCount: page.headings.length,
}));
const navRoutes = new Set(flattenDocumentationNavigation(navigation).map((item) => item.href));
const navigationMissing = pages.filter((page) => !navRoutes.has(page.canonicalPath));
const duplicateHeadingIds = pages.flatMap((page) => {
  const ids = page.headings.map((heading) => heading.id);
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].map((id) => ({ route: page.canonicalPath, id }));
});

const outputs: Record<string, unknown> = {
  'identity.json': {
    schemaVersion: 1,
    phase: 'DOC-9',
    docsRepository: 'EIAS79/Apexify.js-Documentation',
    docsBaseSha: DOC9_BASE_SHA,
    packageRepository: 'EIAS79/Apexify.js',
    packagePinnedSha: PACKAGE_SHA,
    packageMainSha: PACKAGE_MAIN_SHA,
    packageVersion: PACKAGE_VERSION,
    phase14PFrozenSha: PHASE14P_FROZEN_SHA,
    branch: 'doc9-full-content-migration',
  },
  'legacy-content-inventory.json': {
    schemaVersion: 1,
    sourceCount: sources.length,
    frontmatterSourceCount: sources.filter((source) => source.hasFrontmatter).length,
    sources: sources.map((source) => ({ sourcePath: source.sourcePath, legacyId: source.filename, hadFrontmatterAtDoc9Start: source.hasFrontmatter })),
  },
  'migration-manifest.json': { schemaVersion: 1, sourceCoverage: `${records.length}/${sources.length}`, records },
  'classification-summary.json': {
    schemaVersion: 1,
    total: records.length,
    ...classification,
    migrated: activeRecords.length,
    verified: records.filter((record) => record.status === 'verified').length,
    blocked: 0,
    unclassified: 0,
  },
  'route-map.json': { schemaVersion: 1, mappings: routeMap },
  'legacy-alias-map.json': {
    schemaVersion: 1,
    mappings: routeMap.map((entry) => ({
      from: entry.legacyHash,
      to: entry.canonicalRoutes[0] ?? null,
      policy: entry.classification === 'archive' ? 'historical-to-current-context' : 'compatibility',
    })),
  },
  'content-preservation.json': {
    schemaVersion: 1,
    preserved: records.filter((record) => record.contentPreserved).length,
    deleted: deletions.length,
    records: records.map((record) => ({ source: record.legacyPath, preserved: record.contentPreserved, targets: record.targetRoutes, classification: record.classification })),
  },
  'canonical-routes.json': { schemaVersion: 1, routeCount: canonicalPages.length, pages: canonicalPages },
  'active-feature-inventory.json': {
    schemaVersion: 1,
    featureCount: featureRows.length,
    derivation: ['DOC-7 CURRENT_CAPABILITIES', 'DOC-5 example features', 'live DOC-9 migration records'],
    features: featureRows.map((row) => ({ id: row.feature, package: row.package, runtime: row.runtime, canonicalRoutes: row.canonicalRoutes, apiSymbols: row.apiSymbols })),
  },
  'feature-completeness-matrix.json': { schemaVersion: 1, packageVersion: PACKAGE_VERSION, features: featureRows },
  'legacy-only-features.json': { schemaVersion: 1, active_feature_legacy_only_count: legacyOnly.length, features: legacyOnly },
  'API-content-migration.json': {
    schemaVersion: 1,
    handwrittenApiSources: records.filter((record) => record.legacyPath.includes('/04-api-reference/')).map((record) => ({ source: record.legacyPath, classification: record.classification, canonical: record.targetRoutes[0], apiTruth: 'DOC-4 generated manifest' })),
    doc4Coverage: {
      publicExportsTotal: apiCoverage.publicExportsTotal,
      missingPublicExports: apiCoverage.missingPublicExports,
      optionPathsTotal: apiCoverage.optionPathsTotal,
      missingOptionPaths: apiCoverage.missingOptionPaths,
      signatureMismatches: apiCoverage.signatureMismatches,
    },
  },
  'example-content-migration.json': {
    schemaVersion: 1,
    authoritativeSource: 'DOC-5 example manifest',
    exampleCount: exampleManifest.examples.length,
    examples: exampleManifest.examples.map((example: any) => ({ id: example.id, route: example.canonicalRoute, features: example.features, apiSymbols: example.apiSymbols })),
    linkedCanonicalPages: pages.filter((page) => page.examples.length > 0).map((page) => ({ route: page.canonicalPath, examples: page.examples })),
  },
  'changelog-migration.json': { schemaVersion: 1, source: 'content/docs/05-internals/changelog.mdx', canonical: '/docs/migration/changelog', classification: 'move' },
  'archive-inventory.json': { schemaVersion: 1, count: archive.length, records: archive },
  'deletion-inventory.json': { schemaVersion: 1, count: deletions.length, records: deletions },
  'duplicate-content-audit.json': {
    schemaVersion: 1,
    duplicateCanonicalRoutes: duplicateRoutes,
    status: duplicateRoutes.length ? 'FAIL' : 'PASS',
    note: 'Semantic duplicate candidates require manual review; DOC-9 does not auto-delete by text similarity.',
  },
  'orphan-content-audit.json': {
    schemaVersion: 1,
    unclassified: [],
    missingTargets: missingTargets.map((record) => record.legacyPath),
    unroutedActive: unroutedActive.map((record) => record.legacyPath),
    targetMismatches: targetMismatches.map((record) => record.legacyPath),
    status: missingTargets.length || unroutedActive.length || targetMismatches.length ? 'FAIL' : 'PASS',
  },
  'navigation-coverage.json': {
    schemaVersion: 1,
    canonicalPageCount: pages.length,
    navigatedPageCount: pages.length - navigationMissing.length,
    missing: navigationMissing.map((page) => page.canonicalPath),
    status: navigationMissing.length ? 'FAIL' : 'PASS',
  },
  'search-coverage.json': {
    schemaVersion: 1,
    canonicalPageCount: pages.length,
    searchableCount: pages.filter((page) => page.search).length,
    excluded: pages.filter((page) => !page.search).map((page) => ({ route: page.canonicalPath, reason: 'explicit search:false metadata' })),
  },
  'internal-links.json': {
    schemaVersion: 1,
    sourceLegacyHashLinkCount: sourceLegacyLinks.length,
    unresolvedLegacyHashLinkCount: unresolvedLegacyLinks.length,
    policy: 'Legacy source syntax is compatibility input; routed/search content is canonicalized through the DOC-9 resolver.',
    unresolved: unresolvedLegacyLinks,
  },
  'heading-links.json': {
    schemaVersion: 1,
    pageCount: pages.length,
    headingCount: pages.reduce((sum, page) => sum + page.headings.length, 0),
    duplicateHeadingIds,
    status: duplicateHeadingIds.length ? 'FAIL' : 'PASS',
  },
  'redirect-verification.json': {
    schemaVersion: 1,
    mappedLegacyIdentityCount: records.length,
    activeCompatibilityMappings: records.filter((record) => record.redirectRequired).length,
    clientRedirectMismatches,
    mappings: routeMap,
    status: clientRedirectMismatches.length ? 'FAIL' : 'PASS',
  },
  'content-lint.json': {
    schemaVersion: 1,
    delegatedGate: 'DOC-3 content lint',
    migrationStructuralChecks: { unclassified: 0, missingTargets: 0, duplicateRoutes: 0, duplicateHeadingIds: duplicateHeadingIds.length },
    status: duplicateHeadingIds.length ? 'FAIL' : 'PASS_PENDING_DOC3_REGRESSION',
  },
  'prior-phase-regression.json': {
    schemaVersion: 1,
    required: ['DOC-1', 'DOC-2', 'DOC-3', 'DOC-4', 'DOC-5', 'DOC-6', 'DOC-7', 'DOC-8'],
    execution: 'PR CI workflows plus .github/workflows/doc9.yml',
    status: 'PENDING_CI',
  },
  'accessibility.json': { schemaVersion: 1, scope: 'migration-caused representative smoke', execution: 'DOC-8 browser/axe regression in PR CI', status: 'PENDING_CI' },
  'responsive.json': { schemaVersion: 1, scope: 'representative migrated page classes', execution: 'DOC-8 browser responsive regression in PR CI', status: 'PENDING_CI' },
  'build-comparison.json': {
    schemaVersion: 1,
    before: { managedRoutes: 3, legacyFallbackPages: 145 },
    after: { managedRoutes: pages.length, legacyFallbackPages: 0 },
    status: 'ROUTE_COUNTS_RECORDED_RUNTIME_BUILD_METRICS_IN_CI_ARTIFACT',
  },
  'bundle-comparison.json': {
    schemaVersion: 1,
    expectation: 'content migration must not globally import interactive/heavy components',
    verification: ['production build', 'DOC-8 bundle/browser regression', 'DOC-7 product build measurement'],
    status: 'PENDING_CI',
  },
};

for (const [name, value] of Object.entries(outputs)) emit(name, value);
const generatedFiles = CHECK
  ? fs.readdirSync(OUTPUT).filter((name) => name.endsWith('.json')).sort()
  : [...Object.keys(outputs), 'index.json'].sort();
emit('index.json', {
  schemaVersion: 1,
  phase: 'DOC-9',
  sourceCount: sources.length,
  canonicalRouteCount: pages.length,
  classification,
  activeFeatureCount: featureRows.length,
  active_feature_legacy_only_count: legacyOnly.length,
  generatedFiles,
});

console.log(`[doc9] ${CHECK ? 'verified' : 'generated'} sources=${sources.length} canonical=${pages.length} mergedApi=${classification.merge} archived=${classification.archive} legacyOnlyFeatures=${legacyOnly.length}`);
