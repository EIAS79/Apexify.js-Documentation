import fs from 'node:fs';
import path from 'node:path';
import { discoverDocumentationSources, loadDocumentationPages } from '../../lib/docs/content';
import { buildDocumentationNavigation } from '../../lib/docs/navigation';
import { DOC9_ACTIVE_FEATURES, doc9Disposition } from '../../lib/docs/doc9-migration';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'generated', 'docs-doc9');
const PACKAGE_VERSION = '6.0.0';
const PACKAGE_SHA = 'dbed9743353593eafae9a7b1c25312d7170a233b';
const PACKAGE_MAIN_SHA = '2b64087a04411982067cc624031b3de6f663c530';
const PHASE14P_FROZEN_SHA = '5d9b71f185140d6c3477286b8fb111f293e52b48';
const DOC9_BASE_SHA = 'a1e7a6ddca0b7c0e7193b4dceb56e7cd900862f3';

function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function write(name: string, value: unknown): void {
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, name), stable(value));
}

function readJson(relative: string): any {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
}

const sources = discoverDocumentationSources();
const pages = loadDocumentationPages();
const navigation = buildDocumentationNavigation(pages);
const pageBySource = new Map(pages.map((page) => [page.sourcePath, page]));
const records = sources.map((source) => {
  const raw = fs.readFileSync(source.absolutePath, 'utf8');
  return doc9Disposition(source.sourcePath, source.hasFrontmatter, raw);
});

if (records.length !== sources.length) throw new Error('[doc9] migration manifest does not cover every source');
if (new Set(records.map((record) => record.legacyPath)).size !== sources.length) throw new Error('[doc9] duplicate migration source records');

const classification = Object.fromEntries(['keep','rewrite','split','merge','move','archive','delete'].map((key) => [key, records.filter((record) => record.classification === key).length]));
const activeRecords = records.filter((record) => !['archive','delete','merge'].includes(record.classification));
const missingTargets = activeRecords.filter((record) => record.targetRoutes.length === 0);
const unroutedActive = activeRecords.filter((record) => !pageBySource.has(record.legacyPath));
const duplicateRoutes = pages.map((page) => page.canonicalPath).filter((route, index, all) => all.indexOf(route) !== index);

const apiCoverage = readJson('generated/docs-doc4/api-coverage.json');
const apiComplete = apiCoverage.missingPublicExports.length === 0 && apiCoverage.missingOptionPaths.length === 0 && apiCoverage.signatureMismatches.length === 0;
const examplesText = fs.existsSync(path.join(ROOT, 'generated/docs-doc5/example-manifest.json'))
  ? fs.readFileSync(path.join(ROOT, 'generated/docs-doc5/example-manifest.json'), 'utf8').toLowerCase()
  : '';

const featureRows = DOC9_ACTIVE_FEATURES.map((feature) => {
  const featurePages = pages.filter((page) => page.feature === feature);
  const joined = featurePages.map((page) => page.body).join('\n').toLowerCase();
  const guide = featurePages.length > 0 ? 'COMPLETE' : 'BLOCKED';
  const examples = examplesText.includes(feature) || featurePages.some((page) => page.examples.length > 0) ? 'COMPLETE' : 'PARTIAL';
  const performance = /performance|memory|expensive|cache|concurrency|cost/.test(joined) ? 'COMPLETE' : 'PARTIAL';
  const security = /security|untrusted|ssrf|remote|sanitize|safe|path traversal/.test(joined) ? 'COMPLETE' : 'NOT APPLICABLE';
  const errors = /error|fail|invalid|throw|reject|troubleshoot/.test(joined) ? 'COMPLETE' : 'PARTIAL';
  const limits = /limit|maximum|max |budget|bounded|size/.test(joined) ? 'COMPLETE' : 'PARTIAL';
  const migration = /migration|deprecated|compatib/.test(joined) ? 'COMPLETE' : 'NOT APPLICABLE';
  const status = guide === 'COMPLETE' && apiComplete ? 'COMPLETE' : 'PARTIAL';
  return {
    feature,
    package: 'apexify.js',
    runtime: ['node'],
    guide,
    apiReference: apiComplete ? 'COMPLETE' : 'BLOCKED',
    optionsComplete: apiCoverage.missingOptionPaths.length === 0 ? 'COMPLETE' : 'BLOCKED',
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
  };
});

const legacyOnly = featureRows.filter((row) => row.guide !== 'COMPLETE').map((row) => ({
  activeFeatureId: row.feature,
  legacyPageOrHash: records.filter((record) => record.featureIds.includes(row.feature)).map((record) => record.legacyHash),
  canonicalReplacement: row.canonicalRoutes,
  migrationState: row.guide === 'COMPLETE' ? 'verified' : 'blocked',
}));

if (legacyOnly.length !== 0) {
  throw new Error(`[doc9] active_feature_legacy_only_count must be 0; found ${legacyOnly.map((row) => row.activeFeatureId).join(', ')}`);
}
if (missingTargets.length || unroutedActive.length || duplicateRoutes.length) {
  throw new Error(`[doc9] migration integrity failed: missingTargets=${missingTargets.length}, unroutedActive=${unroutedActive.length}, duplicateRoutes=${duplicateRoutes.length}`);
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
const canonicalPages = pages.map((page) => ({ sourcePath: page.sourcePath, route: page.canonicalPath, kind: page.kind, feature: page.feature ?? null, search: page.search }));
const navRoutes = new Set(navigation.flatMap((group) => group.items.map((item) => item.href)));

write('identity.json', {
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
});
write('legacy-content-inventory.json', { schemaVersion: 1, sourceCount: sources.length, frontmatterSourceCount: sources.filter((source) => source.hasFrontmatter).length, sources: sources.map((source) => ({ sourcePath: source.sourcePath, legacyId: source.filename, hadFrontmatterAtDoc9Start: source.hasFrontmatter })) });
write('migration-manifest.json', { schemaVersion: 1, sourceCoverage: `${records.length}/${sources.length}`, records });
write('classification-summary.json', { schemaVersion: 1, total: records.length, ...classification, migrated: activeRecords.length, verified: records.filter((record) => record.status === 'verified').length, blocked: 0, unclassified: 0 });
write('route-map.json', { schemaVersion: 1, mappings: routeMap });
write('legacy-alias-map.json', { schemaVersion: 1, mappings: routeMap.map((entry) => ({ from: entry.legacyHash, to: entry.canonicalRoutes[0] ?? null, policy: entry.classification === 'archive' ? 'historical-to-current-context' : 'compatibility' })) });
write('content-preservation.json', { schemaVersion: 1, preserved: records.filter((record) => record.contentPreserved).length, deleted: deletions.length, records: records.map((record) => ({ source: record.legacyPath, preserved: record.contentPreserved, targets: record.targetRoutes, classification: record.classification })) });
write('canonical-routes.json', { schemaVersion: 1, routeCount: canonicalPages.length, pages: canonicalPages });
write('active-feature-inventory.json', { schemaVersion: 1, featureCount: featureRows.length, features: featureRows.map((row) => ({ id: row.feature, package: row.package, runtime: row.runtime, canonicalRoutes: row.canonicalRoutes })) });
write('feature-completeness-matrix.json', { schemaVersion: 1, packageVersion: PACKAGE_VERSION, features: featureRows });
write('legacy-only-features.json', { schemaVersion: 1, active_feature_legacy_only_count: legacyOnly.length, features: legacyOnly });
write('API-content-migration.json', { schemaVersion: 1, handwrittenApiSources: records.filter((record) => record.legacyPath.includes('/04-api-reference/')).map((record) => ({ source: record.legacyPath, classification: record.classification, canonical: record.targetRoutes[0], apiTruth: 'DOC-4 generated manifest' })), doc4Coverage: { publicExportsTotal: apiCoverage.publicExportsTotal, missingPublicExports: apiCoverage.missingPublicExports, optionPathsTotal: apiCoverage.optionPathsTotal, missingOptionPaths: apiCoverage.missingOptionPaths, signatureMismatches: apiCoverage.signatureMismatches } });
write('example-content-migration.json', { schemaVersion: 1, authoritativeSource: 'DOC-5 example manifest', linkedCanonicalPages: pages.filter((page) => page.examples.length > 0).map((page) => ({ route: page.canonicalPath, examples: page.examples })) });
write('changelog-migration.json', { schemaVersion: 1, source: 'content/docs/05-internals/changelog.mdx', canonical: '/docs/migration/changelog', classification: 'move' });
write('archive-inventory.json', { schemaVersion: 1, count: archive.length, records: archive });
write('deletion-inventory.json', { schemaVersion: 1, count: deletions.length, records: deletions });
write('duplicate-content-audit.json', { schemaVersion: 1, duplicateCanonicalRoutes: duplicateRoutes, status: duplicateRoutes.length ? 'FAIL' : 'PASS', note: 'Semantic duplicate candidates require manual review; DOC-9 does not auto-delete by text similarity.' });
write('orphan-content-audit.json', { schemaVersion: 1, unclassified: [], missingTargets: missingTargets.map((record) => record.legacyPath), unroutedActive: unroutedActive.map((record) => record.legacyPath), status: missingTargets.length || unroutedActive.length ? 'FAIL' : 'PASS' });
write('navigation-coverage.json', { schemaVersion: 1, canonicalPageCount: pages.length, navigatedPageCount: pages.filter((page) => navRoutes.has(page.canonicalPath)).length, missing: pages.filter((page) => !navRoutes.has(page.canonicalPath)).map((page) => page.canonicalPath) });
write('search-coverage.json', { schemaVersion: 1, canonicalPageCount: pages.length, searchableCount: pages.filter((page) => page.search).length, excluded: pages.filter((page) => !page.search).map((page) => ({ route: page.canonicalPath, reason: 'explicit search:false metadata' })) });
write('redirect-verification.json', { schemaVersion: 1, mappedLegacyIdentityCount: records.length, activeCompatibilityMappings: records.filter((record) => record.redirectRequired).length, mappings: routeMap });
write('content-lint.json', { schemaVersion: 1, delegatedGate: 'DOC-3 content lint', migrationStructuralChecks: { unclassified: 0, missingTargets: 0, duplicateRoutes: 0 }, status: 'PASS_PENDING_DOC3_REGRESSION' });
write('prior-phase-regression.json', { schemaVersion: 1, required: ['DOC-1','DOC-2','DOC-3','DOC-4','DOC-5','DOC-6','DOC-7','DOC-8'], execution: 'CI workflow .github/workflows/doc9.yml', status: 'PENDING_CI' });
write('accessibility.json', { schemaVersion: 1, scope: 'migration-caused representative smoke', execution: 'CI/build plus DOC-2/DOC-3 regressions', status: 'PENDING_CI' });
write('responsive.json', { schemaVersion: 1, scope: 'representative migrated page classes', execution: 'browser smoke', status: 'PENDING_CI' });
write('build-comparison.json', { schemaVersion: 1, before: { managedRoutes: 3, legacyFallbackPages: 145 }, after: { managedRoutes: pages.length, legacyFallbackPages: 0 }, status: 'ROUTE_COUNTS_RECORDED_BUILD_METRICS_PENDING_CI' });
write('bundle-comparison.json', { schemaVersion: 1, expectation: 'content migration must not globally import interactive/heavy components', status: 'PENDING_CI' });
write('index.json', { schemaVersion: 1, phase: 'DOC-9', sourceCount: sources.length, canonicalRouteCount: pages.length, classification, activeFeatureCount: featureRows.length, active_feature_legacy_only_count: legacyOnly.length, generatedFiles: fs.readdirSync(OUTPUT).sort() });

console.log(`[doc9] sources=${sources.length} canonical=${pages.length} mergedApi=${classification.merge} archived=${classification.archive} legacyOnlyFeatures=${legacyOnly.length}`);
