import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateDocumentationFrontmatter } from '@/lib/docs/schema';
import { buildDocumentationNavigation } from '@/lib/docs/navigation';
import { apiSymbolByRouteFromManifests, allApiRouteParamsFromManifests, buildApiHref, decodeApiPackageRouteSegment, encodeApiPackageRouteSegment } from '@/lib/api-reference/routing';
import { validateExampleDefinitions } from '@/lib/examples/validation';
import { resolvePackageEquivalent, resolveRuntimeEquivalent } from '@/lib/docs/future-readiness';
import {
  FUTURE_ADAPTERS,
  FUTURE_API_FIXTURES,
  FUTURE_CAPABILITIES,
  FUTURE_DIAGNOSTICS,
  FUTURE_EXAMPLE_FIXTURES,
  FUTURE_FIXTURE_POLICY,
  FUTURE_NESTED_OPTIONS,
  FUTURE_PACKAGE_FIXTURES,
  FUTURE_TOPIC_ROUTES,
} from '@/fixtures/docs-future';

const ROOT = process.cwd();

test('future fixtures are explicitly isolated and non-publishable', () => {
  assert.equal(FUTURE_FIXTURE_POLICY.fixture, true);
  assert.equal(FUTURE_FIXTURE_POLICY.publish, false);
  assert.ok(FUTURE_PACKAGE_FIXTURES.every((item) => item.status === 'ROADMAP' && item.publish === false));
  assert.ok(FUTURE_DIAGNOSTICS.every((item) => item.code.startsWith('FIXTURE-') && item.publish === false));
});

test('DOC-1 schema accepts future-shaped shared/capability metadata without marking it current', () => {
  const value = validateDocumentationFrontmatter({ title: 'Fixture images', description: 'TEST-ONLY future readiness fixture.', slug: 'web/images', kind: 'guide', category: 'Web', order: 1, package: '@apexify/web', runtime: ['web', 'shared'], frameworks: [], stability: 'ROADMAP', feature: 'images', apiSymbols: ['fixture:web-painter'], capabilities: ['webgpu', 'worker-support'], canonical: '/docs/web/images', search: false }, 'fixtures/docs-future/web-images.fixture.mdx');
  assert.deepEqual(value.runtime, ['web', 'shared']);
  assert.deepEqual(value.capabilities, ['webgpu', 'worker-support']);
  assert.equal(value.stability, 'ROADMAP');
});

test('navigation taxonomy scopes future runtimes without a giant Node fallback', () => {
  const page = (slug: string, packageName: any, runtime: any) => ({ title: slug, description: 'fixture', slug, kind: 'guide' as const, category: 'fixture', order: 1, package: packageName, runtime: [runtime], frameworks: [], stability: 'ROADMAP' as const, apiSymbols: [], capabilities: [], keywords: [], prerequisites: [], related: [], examples: [], toc: true, search: false, canonical: `/docs/${slug}`, aliases: [], legacyHashes: [], id: `fixture-${slug}`, sourcePath: `fixture/${slug}.mdx`, canonicalPath: `/docs/${slug}`, body: '', headings: [] });
  const groups = buildDocumentationNavigation([page('web/images', '@apexify/web', 'web'), page('react/images', '@apexify/react', 'react'), page('next/images/client', '@apexify/next', 'next-client'), page('engine/animation', '@apexify/core', 'shared'), page('errors/fixture-code', '@apexify/core', 'shared')]);
  assert.deepEqual(groups.map((group) => group.id), ['web', 'react', 'next', 'engine', 'errors']);
});

test('DOC-4 pure router resolves multiple scoped package manifests and 404s unknowns', () => {
  const params = allApiRouteParamsFromManifests(FUTURE_API_FIXTURES);
  assert.ok(params.some((entry) => entry.package === '@apexify/web' && entry.symbol[0] === 'WebPainterFixture'));
  const found = apiSymbolByRouteFromManifests(FUTURE_API_FIXTURES, '@apexify/web', ['WebPainterFixture', 'render']);
  assert.equal(found?.member?.name, 'render');
  assert.equal(apiSymbolByRouteFromManifests(FUTURE_API_FIXTURES, '@apexify/missing', ['Nope']), null);
  assert.equal(apiSymbolByRouteFromManifests(FUTURE_API_FIXTURES, '@apexify/web', ['Nope']), null);
});

test('scoped package route encoding is reversible and canonical', () => {
  const encoded = encodeApiPackageRouteSegment('@apexify/web');
  assert.equal(encoded, '%40apexify%2Fweb');
  assert.equal(decodeApiPackageRouteSegment(encoded), '@apexify/web');
  assert.equal(buildApiHref('@apexify/web', 'WebPainterFixture'), '/api-reference/%40apexify%2Fweb/WebPainterFixture');
});

test('nested options retain runtime, capability, default and deprecation metadata', () => {
  const flatten = (items: typeof FUTURE_NESTED_OPTIONS): typeof FUTURE_NESTED_OPTIONS => items.flatMap((item) => [item, ...flatten(item.children)]);
  const rows = flatten(FUTURE_NESTED_OPTIONS);
  assert.ok(rows.some((item) => item.path === 'render.worker.enabled' && item.capabilityIds?.includes('worker-support')));
  assert.ok(rows.some((item) => item.path === 'render.capabilities.webgpu' && item.runtimeTargets.includes('web')));
  assert.ok(rows.some((item) => item.path === 'animation.legacyCurve' && item.stability === 'DEPRECATED'));
  assert.ok(rows.some((item) => item.path === 'layout.mode' && item.defaultState === 'explicit'));
});

test('DOC-5 validator accepts isolated future fixture roots without weakening production defaults', () => {
  validateExampleDefinitions(FUTURE_EXAMPLE_FIXTURES, {
    docs: new Set(['/docs/getting-started']),
    apiIds: new Set(FUTURE_API_FIXTURES.flatMap((manifest) => manifest.symbols.map((symbol) => symbol.id))),
    files: new Set(FUTURE_EXAMPLE_FIXTURES.flatMap((item) => item.sourceFiles)),
    requiredPackages: [],
    sourceRoots: { node: ['fixtures/docs-future/examples/'], web: ['fixtures/docs-future/examples/'], react: ['fixtures/docs-future/examples/'], 'next-server': ['fixtures/docs-future/examples/'], 'next-client': ['fixtures/docs-future/examples/'], shared: ['fixtures/docs-future/examples/'] },
  });
  assert.throws(() => validateExampleDefinitions([FUTURE_EXAMPLE_FIXTURES[1]], { docs: new Set(['/docs/getting-started']), apiIds: new Set(FUTURE_API_FIXTURES.flatMap((manifest) => manifest.symbols.map((symbol) => symbol.id))), files: new Set(FUTURE_EXAMPLE_FIXTURES[1].sourceFiles) }), /no authoritative source root configured for runtime web/);
});

test('runtime and package switchers preserve topic context and never fabricate missing routes', () => {
  assert.equal(resolveRuntimeEquivalent(FUTURE_TOPIC_ROUTES, 'images', 'web').href, '/docs/web/images');
  assert.equal(resolveRuntimeEquivalent(FUTURE_TOPIC_ROUTES, 'animation', 'next-client').available, false);
  assert.equal(resolvePackageEquivalent(FUTURE_TOPIC_ROUTES, 'images', '@apexify/react').href, '/docs/react/images');
  assert.equal(resolvePackageEquivalent(FUTURE_TOPIC_ROUTES, 'layout', '@apexify/web').available, false);
});

test('capability and diagnostic fixtures remain structured metadata', () => {
  assert.ok(FUTURE_CAPABILITIES.some((item) => item.id === 'webgpu' && item.detection === 'runtime-adapter'));
  assert.ok(FUTURE_DIAGNOSTICS.every((item) => item.evidenceFields.length > 0 && item.relatedApi.length > 0));
  assert.ok(FUTURE_ADAPTERS.every((item) => item.fixtureOnly && item.inputContract.length > 0 && item.outputContract.length > 0));
});

test('fixture identifiers do not exist in current production manifests or homepage catalog', () => {
  const files = ['generated/docs-doc1/docs-manifest.json', 'generated/docs-doc4/api-manifest.json', 'generated/docs-doc5/example-manifest.json', 'generated/docs-doc6/search-records.json', 'lib/product/catalog-data.ts'];
  const fixtureTokens = ['0.0.0-fixture', 'FIXTURE-APX-', 'WebPainterFixture', 'ReactCanvasFixture', 'NextBoundaryFixture', 'fixture-readiness'];
  for (const file of files) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const token of fixtureTokens) assert.equal(text.includes(token), false, `${token} leaked into ${file}`);
  }
});
