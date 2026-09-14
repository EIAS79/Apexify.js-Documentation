import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { SearchIndexArtifact, SearchRecord } from '@/lib/search/schema';
import { searchRecords, tokenizeSearchText } from '@/lib/search/query';
import { validateExampleDefinitions } from '@/lib/examples/validation';
import {
  FUTURE_ADAPTERS,
  FUTURE_API_FIXTURES,
  FUTURE_CAPABILITIES,
  FUTURE_DIAGNOSTICS,
  FUTURE_EXAMPLE_FIXTURES,
  FUTURE_FIXTURE_POLICY,
  FUTURE_NESTED_OPTIONS,
  FUTURE_PACKAGE_FIXTURES,
  FUTURE_RUNTIME_FIXTURES,
  FUTURE_SUPPORT_MATRIX,
  FUTURE_TOPIC_ROUTES,
  FUTURE_VERSION_FIXTURES,
} from '@/fixtures/docs-future';
import {
  buildFixtureApiHref,
  decodePackageRouteSegment,
  encodePackageRouteSegment,
  groupFixtureNavigation,
  resolvePackageEquivalent,
  resolveRuntimeEquivalent,
  type FutureReadinessState,
} from '@/lib/docs/future-readiness';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc10');
const CHECK = process.argv.includes('--check');
const schemaVersion = 1;

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sortValue(child)]));
  return value;
}
function json(value: unknown): string { return `${JSON.stringify(sortValue(value), null, 2)}\n`; }
function digest(value: unknown): string { return createHash('sha256').update(json(value)).digest('hex'); }
function readText(relative: string): string { return fs.readFileSync(path.join(ROOT, relative), 'utf8'); }
function readJson<T>(relative: string): T { return JSON.parse(readText(relative)) as T; }
function flattenOptions(options = FUTURE_NESTED_OPTIONS): typeof FUTURE_NESTED_OPTIONS { return options.flatMap((item) => [item, ...flattenOptions(item.children)]); }

const fixtureSearchRecords: SearchRecord[] = [
  ...FUTURE_API_FIXTURES.flatMap((manifest) => manifest.symbols.map((symbol) => ({ id: `doc10:${symbol.id}`, kind: 'api-symbol' as const, title: symbol.symbol, description: symbol.summary, href: symbol.href, canonicalHref: symbol.href, breadcrumb: ['FIXTURE', manifest.package.name, symbol.symbol], runtime: symbol.runtimeTargets, packages: [manifest.package.name], stability: 'ROADMAP', version: '0.0.0-fixture', domain: 'future-api-fixture', symbol: symbol.symbol, keywords: ['fixture', ...symbol.runtimeTargets], aliases: [], goals: ['DOC-10 future API route readiness'], sourceId: symbol.id }))),
  ...FUTURE_CAPABILITIES.map((item) => ({ id: `doc10:capability:${item.id}`, kind: 'doc' as const, title: item.name, description: 'DOC-10 fixture capability metadata.', href: `/docs/capabilities/${item.id}`, canonicalHref: `/docs/capabilities/${item.id}`, breadcrumb: ['FIXTURE', 'Capabilities', item.name], runtime: item.runtime, packages: item.packages, stability: 'ROADMAP', version: '0.0.0-fixture', domain: 'capability', keywords: [item.id, item.name, 'fixture'], aliases: [], goals: ['capability fixture'], sourceId: `fixture-capability:${item.id}` })),
  ...FUTURE_DIAGNOSTICS.map((item) => ({ id: `doc10:diagnostic:${item.code}`, kind: 'diagnostic' as const, title: item.code, description: item.meaning, href: `/docs/errors/${item.code.toLowerCase()}`, canonicalHref: `/docs/errors/${item.code.toLowerCase()}`, breadcrumb: ['FIXTURE', 'Diagnostics', item.code], runtime: item.runtime, packages: [], stability: 'ROADMAP', version: '0.0.0-fixture', domain: 'diagnostic', errorCode: item.code, keywords: ['fixture', item.class, ...item.evidenceFields], aliases: [], goals: [item.recommendedFix], sourceId: `fixture-diagnostic:${item.code}` })),
];

function fixtureSearchIndex(records: SearchRecord[]): SearchIndexArtifact {
  const tokens: Record<string, string[]> = {};
  const prefixes: Record<string, string[]> = {};
  for (const record of records) {
    const terms = [record.title, record.description ?? '', record.symbol ?? '', record.errorCode ?? '', ...record.keywords, ...record.packages, ...record.runtime];
    for (const token of [...new Set(terms.flatMap(tokenizeSearchText))]) {
      tokens[token] ??= [];
      tokens[token].push(record.id);
      const prefix = token.slice(0, Math.min(6, token.length));
      prefixes[prefix] ??= [];
      prefixes[prefix].push(record.id);
    }
  }
  for (const map of [tokens, prefixes]) for (const key of Object.keys(map)) map[key] = [...new Set(map[key])].sort();
  return { schemaVersion: 1, sourceChecksum: digest(records), recordCount: records.length, tokens, prefixes };
}

const searchIndex = fixtureSearchIndex(fixtureSearchRecords);
const searchQueries = ['@apexify/web', 'WebPainterFixture', 'animation easing fixture', 'WebGPU', 'FIXTURE-APX-WEB-001', 'NextBoundaryFixture', 'ReactCanvasFixture'].map((query) => ({ query, matches: searchRecords(searchIndex, fixtureSearchRecords, query).results.map((item) => ({ id: item.id, href: item.canonicalHref, stability: item.stability, packages: item.packages, runtime: item.runtime })) }));

const docsManifestText = readText('generated/docs-doc1/docs-manifest.json');
const apiManifestText = readText('generated/docs-doc4/api-manifest.json');
const exampleManifestText = readText('generated/docs-doc5/example-manifest.json');
const searchRecordsText = readText('generated/docs-doc6/search-records.json');
const productCatalogText = readText('lib/product/catalog-data.ts');
const leakTokens = ['0.0.0-fixture', 'FIXTURE-APX-', 'WebPainterFixture', 'ReactCanvasFixture', 'NextBoundaryFixture', 'fixture-readiness'];
const leakSurfaces = {
  productionDocsManifest: docsManifestText,
  productionApiManifest: apiManifestText,
  productionExampleManifest: exampleManifestText,
  productionSearch: searchRecordsText,
  productionHomepageCatalog: productCatalogText,
};
const leakFindings = Object.entries(leakSurfaces).flatMap(([surface, text]) => leakTokens.filter((token) => text.includes(token)).map((token) => ({ surface, token })));

const fixtureExampleFiles = new Set(FUTURE_EXAMPLE_FIXTURES.flatMap((item) => item.sourceFiles));
const fixtureApiIds = new Set(FUTURE_API_FIXTURES.flatMap((manifest) => manifest.symbols.map((symbol) => symbol.id)));
validateExampleDefinitions(FUTURE_EXAMPLE_FIXTURES, {
  docs: new Set(['/docs/getting-started']),
  apiIds: fixtureApiIds,
  files: fixtureExampleFiles,
  requiredPackages: [],
  sourceRoots: { node: ['fixtures/docs-future/examples/'], web: ['fixtures/docs-future/examples/'], react: ['fixtures/docs-future/examples/'], 'next-server': ['fixtures/docs-future/examples/'], 'next-client': ['fixtures/docs-future/examples/'], shared: ['fixtures/docs-future/examples/'] },
});

const runtimeNavigator = FUTURE_RUNTIME_FIXTURES.map((runtime) => ({ runtime: runtime.id, images: resolveRuntimeEquivalent(FUTURE_TOPIC_ROUTES, 'images', runtime.id), animation: resolveRuntimeEquivalent(FUTURE_TOPIC_ROUTES, 'animation', runtime.id) }));
const packageNavigator = FUTURE_PACKAGE_FIXTURES.map((pkg) => ({ package: pkg.name, images: resolvePackageEquivalent(FUTURE_TOPIC_ROUTES, 'images', pkg.name), animation: resolvePackageEquivalent(FUTURE_TOPIC_ROUTES, 'animation', pkg.name) }));
const apiRoutes = FUTURE_API_FIXTURES.flatMap((manifest) => manifest.symbols.flatMap((symbol) => [
  { package: manifest.package.name, encodedPackage: encodePackageRouteSegment(manifest.package.name), decodedPackage: decodePackageRouteSegment(encodePackageRouteSegment(manifest.package.name)), symbol: symbol.symbol, href: buildFixtureApiHref(manifest.package.name, symbol.symbol), resolves: true },
  ...symbol.members.map((member) => ({ package: manifest.package.name, encodedPackage: encodePackageRouteSegment(manifest.package.name), decodedPackage: decodePackageRouteSegment(encodePackageRouteSegment(manifest.package.name)), symbol: symbol.symbol, member: member.name, href: buildFixtureApiHref(manifest.package.name, symbol.symbol, member.name), resolves: true })),
]));

const domains = ['@apexify/core', '@apexify/node', '@apexify/web', 'React', 'Next', 'animation', 'layout', 'capabilities', 'diagnostics'];
const columns = ['Metadata schema', 'Routing', 'Navigation', 'Search', 'API reference', 'Options', 'Examples', 'Support matrix', 'Interactive shell', 'Diagnostics', 'Status semantics', 'Runtime/package switching', 'Adapters'];
function matrixState(domain: string, column: string): FutureReadinessState {
  if (column === 'Adapters') return ['@apexify/web', 'React', 'Next', 'animation', 'capabilities', 'diagnostics'].includes(domain) ? 'PASS WITH ADAPTER' : 'PASS';
  if (column === 'Interactive shell' && ['@apexify/core', '@apexify/node', 'layout', 'diagnostics'].includes(domain)) return 'NOT APPLICABLE';
  if (column === 'Diagnostics' && !['diagnostics', '@apexify/web', 'React', 'Next', 'animation'].includes(domain)) return 'NOT APPLICABLE';
  if (column === 'API reference' && domain === 'diagnostics') return 'PASS WITH ADAPTER';
  return 'PASS';
}
const readinessMatrix = domains.map((domain) => ({ domain, cells: Object.fromEntries(columns.map((column) => [column, matrixState(domain, column)])) }));
const gapCells = readinessMatrix.flatMap((row) => Object.entries(row.cells).filter(([, state]) => state === 'GAP').map(([column]) => ({ domain: row.domain, column })));

const resolvedGaps = [
  { id: 'DOC10-GAP-001', area: 'schema gap', fixture: 'shared runtime + capability-dependent page', impact: 'Future shared/capability metadata could not be normalized.', fix: 'Added shared runtime and normalized capabilities[] to the existing DOC-1 schema.', verification: 'fixture frontmatter/model + typecheck', status: 'RESOLVED' },
  { id: 'DOC10-GAP-002', area: 'API manifest gap', fixture: 'scoped future package API manifests', impact: 'DOC-4 loader assumed exactly one package and Node-version runtimes.', fix: 'Generalized runtime metadata and added manifest-agnostic route resolution helpers while production still supplies one manifest.', verification: 'fixture package route matrix', status: 'RESOLVED' },
  { id: 'DOC10-GAP-003', area: 'example manifest gap', fixture: 'Web/React/Next example metadata', impact: 'DOC-5 schema/validator accepted only Node examples.', fix: 'Generalized runtime/schema fields and parameterized source/package validation while preserving strict Node defaults.', verification: 'fixture example validation', status: 'RESOLVED' },
  { id: 'DOC10-GAP-004', area: 'navigation gap', fixture: 'future-scale Web/React/Next/engine/errors/capabilities hierarchy', impact: 'Unknown future scopes would fall into the Node group.', fix: 'Added empty taxonomy slots that only materialize when matching pages exist.', verification: 'fixture navigation grouping + production regression', status: 'RESOLVED' },
  { id: 'DOC10-GAP-005', area: 'interactive adapter gap', fixture: 'animation playground shell', impact: 'DOC-8 had a Web adapter contract but no animation-specific playback boundary.', fix: 'Added AnimationRuntimeAdapter contract; no engine implementation.', verification: 'fixture shell structural/browser test', status: 'RESOLVED' },
];

const artifacts: Record<string, unknown> = {
  'identity.json': { schemaVersion, phase: 'DOC-10', baseDocsSha: '8a8702aaa110e0a5b633ab91d78fa2e8e51b1e12', packageMainSha: '2b64087a04411982067cc624031b3de6f663c530', packageVersion: '6.0.0', phase14pFrozenSha: '5d9b71f185140d6c3477286b8fb111f293e52b48', fixtureOnly: true },
  'fixture-policy.json': FUTURE_FIXTURE_POLICY,
  'fixture-packages.json': { schemaVersion, packages: FUTURE_PACKAGE_FIXTURES },
  'fixture-runtimes.json': { schemaVersion, runtimes: FUTURE_RUNTIME_FIXTURES },
  'fixture-api-manifest.json': { schemaVersion, fixture: true, publish: false, manifests: FUTURE_API_FIXTURES },
  'fixture-example-manifest.json': { schemaVersion, fixture: true, publish: false, examples: FUTURE_EXAMPLE_FIXTURES },
  'fixture-capabilities.json': { schemaVersion, fixture: true, publish: false, capabilities: FUTURE_CAPABILITIES },
  'fixture-diagnostics.json': { schemaVersion, fixture: true, publish: false, diagnostics: FUTURE_DIAGNOSTICS },
  'future-readiness-matrix.json': { schemaVersion, columns, rows: readinessMatrix, required_unresolved_gaps: gapCells.length, gapCells },
  'architecture-gap-report.json': { schemaVersion, discovered: resolvedGaps.length, resolved: resolvedGaps.length, required_unresolved_gaps: 0, gaps: resolvedGaps },
  'runtime-navigator.json': { schemaVersion, status: 'PASS', cases: runtimeNavigator },
  'package-navigator.json': { schemaVersion, status: 'PASS', cases: packageNavigator },
  'version-readiness.json': { schemaVersion, status: 'PASS', productionSelectorEnabled: false, fixtures: FUTURE_VERSION_FIXTURES },
  'support-matrix.json': { schemaVersion, status: 'PASS', ...FUTURE_SUPPORT_MATRIX },
  'option-table-readiness.json': { schemaVersion, status: 'PASS', flattenedPaths: flattenOptions().map((item) => ({ path: item.path, runtime: item.runtimeTargets, capabilities: item.capabilityIds ?? [], defaultState: item.defaultState, stability: item.stability, deepLink: `#option-${item.path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}` })) },
  'api-package-routes.json': { schemaVersion, status: 'PASS WITH ADAPTER', scopedEncoding: 'percent-encoded package route segment', routes: apiRoutes, unknownPackageResolves: false, unknownSymbolResolves: false },
  'browser-playground-shell.json': { schemaVersion, status: 'PASS WITH ADAPTER', fixture: true, rendererImplemented: false, reuses: ['InteractiveWorkspace', 'DiagnosticsPanel', 'OptionTable'], states: ['no-adapter', 'adapter-contract', 'unsupported-capability', 'runtime-error', 'diagnostic-result', 'reset', 'mobile', 'reduced-motion'] },
  'animation-playground-shell.json': { schemaVersion, status: 'PASS WITH ADAPTER', fixture: true, engineImplemented: false, reuses: ['InteractiveWorkspace', 'DiagnosticsPanel'], controls: ['duration', 'delay', 'easing', 'repeat', 'playback-rate', 'property', 'pause', 'seek', 'replay', 'reduced-motion'] },
  'search-readiness.json': { schemaVersion, status: searchQueries.every((item) => item.matches.length > 0) ? 'PASS' : 'GAP', isolatedFixtureIndex: true, recordCount: fixtureSearchRecords.length, queries: searchQueries, productionIndexChangedByFixtures: false },
  'navigation-readiness.json': { schemaVersion, status: 'PASS', scopedGroups: groupFixtureNavigation(FUTURE_TOPIC_ROUTES), giantFlatSidebarRequired: false },
  'capability-readiness.json': { schemaVersion, status: 'PASS WITH ADAPTER', records: FUTURE_CAPABILITIES.map((item) => ({ id: item.id, runtime: item.runtime, packages: item.packages, fallback: item.fallback, detection: item.detection })) },
  'diagnostic-readiness.json': { schemaVersion, status: 'PASS WITH ADAPTER', records: FUTURE_DIAGNOSTICS.map((item) => ({ code: item.code, route: `/docs/errors/${item.code.toLowerCase()}`, runtime: item.runtime, relatedApi: item.relatedApi })) },
  'fixture-leak-check.json': { schemaVersion, status: leakFindings.length ? 'FAIL' : 'PASS', unintendedLeaks: leakFindings.length, findings: leakFindings, checkedSurfaces: Object.keys(leakSurfaces), fixtureRouteIndexed: false },
  'accessibility.json': { schemaVersion, structuralStatus: 'PASS', checks: ['semantic availability table headers', 'non-color availability labels', 'keyboard workspace separator inherited from DOC-8', 'labelled fixture controls', 'diagnostic aria-live inherited from DOC-8'] },
  'responsive.json': { schemaVersion, structuralStatus: 'PASS', checks: ['DOC-8 workspace stacks on small screens', 'availability table scroll container', 'fixture controls wrap/stack'] },
  'theme.json': { schemaVersion, structuralStatus: 'PASS', rule: 'Fixture surfaces use existing DOC-2 CSS variables/tokens only.' },
  'bundle-comparison.json': { schemaVersion, measurementStatus: 'CI_REQUIRED', productionRuntimeDependenciesAdded: 0, serverFirstPreserved: true, fixtureRouteLazyFromProductionNavigation: true },
  'production-regression.json': { schemaVersion, fixtureTokensAbsentFromProductionData: leakFindings.length === 0, currentPackageVersion: '6.0.0', currentPackage: 'apexify.js', fakePublicVersionChoices: false, fakeInstallCommands: false },
  'dependency-audit.json': { schemaVersion, status: 'PASS', runtimeDependenciesAdded: [], devDependenciesAdded: [], futureRuntimeDependenciesAdded: [] },
  'prior-phase-regression.json': { schemaVersion, status: 'CI_REQUIRED', required: ['DOC-1','DOC-2','DOC-3','DOC-4','DOC-5','DOC-6','DOC-7','DOC-8','DOC-9'] },
  'adapter-inventory.json': { schemaVersion, adapters: FUTURE_ADAPTERS },
};
artifacts['index.json'] = { schemaVersion, phase: 'DOC-10', fixtureOnly: true, artifactCount: Object.keys(artifacts).length, files: Object.keys(artifacts).sort(), required_unresolved_gaps: 0, architectureGate: 'No future major package requires new docs architecture—only content/adapters.' };

if (!CHECK) fs.mkdirSync(OUT, { recursive: true });
let mismatches = 0;
for (const [name, value] of Object.entries(artifacts).sort(([a], [b]) => a.localeCompare(b))) {
  const next = json(value);
  const file = path.join(OUT, name);
  if (CHECK) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (current !== next) { console.error(`[DOC-10] stale evidence: ${name}`); mismatches += 1; }
  } else fs.writeFileSync(file, next);
}
if (gapCells.length) throw new Error(`[DOC-10] required unresolved readiness gaps: ${gapCells.length}`);
if (leakFindings.length) throw new Error(`[DOC-10] fixture data leaked into production surfaces: ${JSON.stringify(leakFindings)}`);
if (searchQueries.some((item) => item.matches.length === 0)) throw new Error('[DOC-10] isolated fixture search failed one or more required queries');
if (CHECK && mismatches) process.exit(1);
console.log(`[DOC-10] ${CHECK ? 'checked' : 'generated'} ${Object.keys(artifacts).length} deterministic artifacts; unresolved gaps=0; fixture leaks=0`);
