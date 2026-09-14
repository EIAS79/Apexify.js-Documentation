import type { ApiManifest, ApiMember, ApiOption, ApiSymbol, RuntimeTarget } from '@/lib/api-reference/schema';
import type { ExampleDefinition, ExampleRuntime } from '@/lib/examples/schema';
import type { DocumentationPackage, DocumentationRuntime } from '@/lib/docs/schema';
import {
  buildFixtureApiHref,
  type AvailabilityRow,
  type FutureAdapterDescriptor,
  type FutureCapabilityRecord,
  type FutureDiagnosticRecord,
  type TopicRouteRecord,
} from '@/lib/docs/future-readiness';

export const FUTURE_FIXTURE_POLICY = {
  schemaVersion: 1,
  fixture: true,
  publish: false,
  status: 'TEST-ONLY',
  rule: 'Future readiness data is isolated test input. It must never be interpreted as CURRENT, shipped, stable, installable, or production-ready.',
} as const;

export const FUTURE_PACKAGE_FIXTURES: Array<{
  name: DocumentationPackage;
  status: 'ROADMAP';
  runtimes: DocumentationRuntime[];
  version: '0.0.0-fixture';
  entrypointModel: string[];
  fixture: true;
  publish: false;
}> = [
  { name: '@apexify/core', status: 'ROADMAP', runtimes: ['shared'], version: '0.0.0-fixture', entrypointModel: ['.'], fixture: true, publish: false },
  { name: '@apexify/node', status: 'ROADMAP', runtimes: ['node'], version: '0.0.0-fixture', entrypointModel: ['.'], fixture: true, publish: false },
  { name: '@apexify/web', status: 'ROADMAP', runtimes: ['web', 'worker'], version: '0.0.0-fixture', entrypointModel: ['.'], fixture: true, publish: false },
  { name: '@apexify/react', status: 'ROADMAP', runtimes: ['react', 'web'], version: '0.0.0-fixture', entrypointModel: ['.'], fixture: true, publish: false },
  { name: '@apexify/next', status: 'ROADMAP', runtimes: ['next-server', 'next-client'], version: '0.0.0-fixture', entrypointModel: ['.', './server', './client'], fixture: true, publish: false },
];

export const FUTURE_RUNTIME_FIXTURES: Array<{ id: DocumentationRuntime; label: string; status: 'ROADMAP'; fixture: true; publish: false }> = [
  { id: 'node', label: 'Node', status: 'ROADMAP', fixture: true, publish: false },
  { id: 'web', label: 'Web', status: 'ROADMAP', fixture: true, publish: false },
  { id: 'react', label: 'React', status: 'ROADMAP', fixture: true, publish: false },
  { id: 'next-server', label: 'Next Server', status: 'ROADMAP', fixture: true, publish: false },
  { id: 'next-client', label: 'Next Client', status: 'ROADMAP', fixture: true, publish: false },
  { id: 'shared', label: 'Shared', status: 'ROADMAP', fixture: true, publish: false },
];

export const FUTURE_TOPIC_ROUTES: TopicRouteRecord[] = [
  { topic: 'images', runtime: 'node', package: '@apexify/node', href: '/docs/node/images', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'images', runtime: 'web', package: '@apexify/web', href: '/docs/web/images', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'images', runtime: 'react', package: '@apexify/react', href: '/docs/react/images', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'images', runtime: 'next-server', package: '@apexify/next', href: '/docs/next/images/server', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'images', runtime: 'next-client', package: '@apexify/next', href: '/docs/next/images/client', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'animation', runtime: 'shared', package: '@apexify/core', href: '/docs/engine/animation', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'animation', runtime: 'web', package: '@apexify/web', href: '/docs/web/animation', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'animation', runtime: 'react', package: '@apexify/react', href: '/docs/react/animation', status: 'ROADMAP', fixture: true, publish: false },
  { topic: 'layout', runtime: 'shared', package: '@apexify/core', href: '/docs/engine/layout', status: 'ROADMAP', fixture: true, publish: false },
];

export const FUTURE_CAPABILITIES: FutureCapabilityRecord[] = [
  { id: 'webcodecs', name: 'WebCodecs', status: 'ROADMAP', runtime: ['web', 'worker'], packages: ['@apexify/web'], required: false, optional: true, fallback: 'adapter-declared', detection: 'runtime-adapter', relatedApis: ['fixture:web-painter'], relatedDocs: ['/docs/web/capabilities'], fixture: true, publish: false },
  { id: 'ffmpeg', name: 'FFmpeg', status: 'ROADMAP', runtime: ['node'], packages: ['@apexify/node'], required: false, optional: true, fallback: 'feature-specific', detection: 'runtime-adapter', relatedApis: ['fixture:node-painter'], relatedDocs: ['/docs/node/video'], fixture: true, publish: false },
  { id: 'webgpu', name: 'WebGPU', status: 'ROADMAP', runtime: ['web', 'worker'], packages: ['@apexify/web'], required: false, optional: true, fallback: 'canvas-backend', detection: 'runtime-adapter', relatedApis: ['fixture:web-painter'], relatedDocs: ['/docs/web/capabilities'], fixture: true, publish: false },
  { id: 'offscreen-canvas', name: 'OffscreenCanvas', status: 'ROADMAP', runtime: ['web', 'worker'], packages: ['@apexify/web'], required: false, optional: true, fallback: 'main-thread-canvas', detection: 'runtime-adapter', relatedApis: ['fixture:web-painter'], relatedDocs: ['/docs/web/workers'], fixture: true, publish: false },
  { id: 'hardware-acceleration', name: 'Hardware acceleration', status: 'ROADMAP', runtime: ['web', 'node'], packages: ['@apexify/web', '@apexify/node'], required: false, optional: true, fallback: 'software', detection: 'runtime-adapter', relatedApis: [], relatedDocs: ['/docs/capabilities/hardware-acceleration'], fixture: true, publish: false },
  { id: 'worker-support', name: 'Worker support', status: 'ROADMAP', runtime: ['worker', 'web'], packages: ['@apexify/web'], required: false, optional: true, fallback: 'main-thread', detection: 'runtime-adapter', relatedApis: ['fixture:web-painter'], relatedDocs: ['/docs/web/workers'], fixture: true, publish: false },
];

export const FUTURE_DIAGNOSTICS: FutureDiagnosticRecord[] = [
  { code: 'FIXTURE-APX-WEB-001', class: 'FixtureCapabilityDiagnostic', meaning: 'Fixture-only capability requirement is unavailable.', trigger: 'The DOC-10 test double reports WebGPU unavailable.', evidenceFields: ['capability', 'runtime', 'adapter'], recommendedFix: 'Select a supported fixture backend or mark the feature unavailable.', runtime: ['web'], relatedApi: ['fixture:web-painter'], status: 'TEST-ONLY', fixture: true, publish: false },
  { code: 'FIXTURE-APX-NEXT-001', class: 'FixtureBoundaryDiagnostic', meaning: 'Fixture-only Next server/client boundary violation.', trigger: 'A client fixture references a server-only package identity.', evidenceFields: ['framework', 'runtime', 'package'], recommendedFix: 'Move the fixture import to the matching runtime boundary.', runtime: ['next-server', 'next-client'], relatedApi: ['fixture:next-server', 'fixture:next-client'], status: 'TEST-ONLY', fixture: true, publish: false },
];

const source = (packageName: string) => ({
  declarationPath: `fixtures/${packageName}/index.d.ts`,
  sourcePath: `fixtures/docs-future/${packageName}.fixture.ts`,
  href: 'https://example.invalid/apexify-doc10-fixture-source',
});

function option(id: string, path: string, runtimeTargets: RuntimeTarget[], children: ApiOption[] = [], extra: Partial<ApiOption> = {}): ApiOption {
  return {
    id,
    path,
    name: path.split('.').at(-1) ?? path,
    type: { kind: 'primitive', text: 'string' },
    required: false,
    defaultState: 'none',
    description: 'DOC-10 fixture option used only to validate reference architecture.',
    runtimeTargets,
    stability: 'ROADMAP',
    source: source('future-option'),
    children,
    ...extra,
  };
}

export const FUTURE_NESTED_OPTIONS: ApiOption[] = [
  option('fixture:render', 'render', ['shared'], [
    option('fixture:render.backend', 'render.backend', ['shared'], [
      option('fixture:render.backend.preference', 'render.backend.preference', ['web', 'node24'], [], { allowedValues: ['auto', 'fixture-gpu', 'fixture-canvas'], defaultState: 'explicit', defaultValue: 'auto' }),
    ]),
    option('fixture:render.worker', 'render.worker', ['web'], [
      option('fixture:render.worker.enabled', 'render.worker.enabled', ['web'], [], { type: { kind: 'primitive', text: 'boolean' }, defaultState: 'explicit', defaultValue: false, capabilityIds: ['worker-support'] }),
    ]),
    option('fixture:render.capabilities.webgpu', 'render.capabilities.webgpu', ['web'], [], { type: { kind: 'primitive', text: 'boolean' }, capabilityIds: ['webgpu'], defaultState: 'runtime' }),
  ]),
  option('fixture:animation', 'animation', ['shared'], [
    option('fixture:animation.duration', 'animation.duration', ['shared'], [], { type: { kind: 'primitive', text: 'number' }, defaultState: 'explicit', defaultValue: 300, animatable: true, limitIds: ['fixture:timeline-duration'] }),
    option('fixture:animation.easing', 'animation.easing', ['shared'], [], { allowedValues: ['linear', 'fixture-ease'], defaultState: 'explicit', defaultValue: 'linear', animatable: true }),
    option('fixture:animation.legacyCurve', 'animation.legacyCurve', ['shared'], [], { stability: 'DEPRECATED', deprecated: { since: 'fixture', replacement: 'animation.easing', note: 'Fixture deprecation only.' } }),
  ]),
  option('fixture:layout', 'layout', ['shared'], [
    option('fixture:layout.mode', 'layout.mode', ['shared'], [], { allowedValues: ['absolute', 'fixture-flow'], defaultState: 'explicit', defaultValue: 'absolute' }),
  ]),
];

function member(packageName: string, owner: string, runtimeTargets: RuntimeTarget[]): ApiMember {
  const memberId = `fixture:${packageName}:${owner}:render`;
  return {
    id: memberId,
    owner,
    name: 'render',
    kind: 'method',
    signature: 'render(options?: FixtureRenderOptions): Promise<void>',
    overloads: [{ id: `${memberId}:signature`, label: 'Fixture signature', text: 'render(options?: FixtureRenderOptions): Promise<void>', parameters: [{ name: 'options', optional: true, rest: false, type: { kind: 'reference', text: 'FixtureRenderOptions', name: 'FixtureRenderOptions' }, options: FUTURE_NESTED_OPTIONS }], returnType: { kind: 'promise', text: 'Promise<void>' } }],
    runtimeTargets,
    stability: 'ROADMAP',
    source: source(packageName),
    href: buildFixtureApiHref(packageName, owner, 'render'),
    summary: 'Fixture-only render member for DOC-10 architecture verification.',
    relatedApiIds: [],
    examples: [],
  };
}

function apiManifest(packageName: DocumentationPackage, symbolName: string, runtimeTargets: RuntimeTarget[]): ApiManifest {
  const m = member(packageName, symbolName, runtimeTargets);
  const symbol: ApiSymbol = {
    id: `fixture:${packageName}:${symbolName}`,
    package: packageName,
    exportPath: '.',
    exportPaths: ['.'],
    symbol: symbolName,
    kind: 'class',
    signature: `class ${symbolName}`,
    overloads: [],
    members: [m],
    runtimeTargets,
    stability: 'ROADMAP',
    source: source(packageName),
    href: buildFixtureApiHref(packageName, symbolName),
    summary: 'DOC-10 fixture symbol. Not a shipped Apexify API.',
    relatedApiIds: [],
    examples: [],
    isTypeOnly: false,
  };
  return {
    schemaVersion: 1,
    generatedPolicy: 'Generated from packed package declarations/artifacts and explicit metadata. Do not edit directly.',
    package: { name: packageName, version: '0.0.0-fixture', commit: 'FIXTURE-NOT-A-REAL-COMMIT', packedTreeSha256: 'fixture-not-a-real-artifact' },
    entrypoints: [{ exportPath: '.', declarationFile: `fixtures/${packageName}/index.d.ts`, exports: [symbolName] }],
    symbols: [symbol],
    types: [],
    errors: [],
    limits: [],
    search: [{ kind: 'api-symbol', id: symbol.id, symbolId: symbol.id, package: packageName, title: symbolName, terms: [symbolName, 'fixture'], runtime: runtimeTargets, href: symbol.href }],
    coverage: { publicExportsTotal: 1, stablePublicExports: 0, documentedPublicExports: 1, missingPublicExports: [], staleDocumentedExports: [], publicMembersTotal: 1, documentedMembers: 1, optionPathsTotal: 10, documentedOptionPaths: 10, missingOptionPaths: [], staleOptionPaths: [], signaturesVerified: 1, signatureMismatches: [], typesResolved: 1, unresolvedPublicTypes: [], errorsDocumented: 0, limitsDocumented: 0, runtimeMetadataCoverage: 1, sourceLinkCoverage: 1, exampleLinkCoverage: 1 },
    representativeApiId: symbol.id,
  };
}

export const FUTURE_API_FIXTURES = [
  apiManifest('@apexify/core', 'CoreSharedFixture', ['shared']),
  apiManifest('@apexify/node', 'NodePainterFixture', ['node24']),
  apiManifest('@apexify/web', 'WebPainterFixture', ['web']),
  apiManifest('@apexify/react', 'ReactCanvasFixture', ['react']),
  apiManifest('@apexify/next', 'NextBoundaryFixture', ['next-server', 'next-client']),
];

const fixtureExample = (runtime: ExampleRuntime, framework: string | undefined, packageName: DocumentationPackage, apiId: string): ExampleDefinition => ({
  id: `${runtime}.fixture.readiness`,
  title: `${runtime} readiness fixture`,
  summary: 'TEST-ONLY fixture; never published as a verified Apexify example.',
  runtime,
  framework,
  difficulty: 'integration',
  packages: [packageName],
  features: ['fixture-readiness'],
  apiSymbols: [apiId],
  sourceFiles: [`fixtures/docs-future/examples/${runtime}/main.ts`],
  entrypoint: `fixtures/docs-future/examples/${runtime}/main.ts`,
  outputType: 'text',
  expectedOutput: [{ path: 'fixture.txt', kind: 'text', public: false, verificationMode: 'adapter-contract', exactText: 'fixture' }],
  verification: { typecheck: false, executable: false, timeoutMs: 1000, stderrPolicy: 'fail-on-error-pattern' },
  relatedDocs: ['/docs/getting-started'],
  gallery: { enabled: false, previewOutput: '' },
  explanation: { goal: 'Validate manifest shape.', prerequisites: ['DOC-10 fixture mode'], importantOptions: ['runtime'], whyOptions: ['Tests metadata boundaries.'], variants: ['fixture only'], performanceNote: 'No benchmark claim.', errorNote: 'No runtime is executed.', nextStep: 'Supply a future verifier adapter when the runtime ships.' },
});

export const FUTURE_EXAMPLE_FIXTURES: ExampleDefinition[] = [
  fixtureExample('node', undefined, '@apexify/node', 'fixture:@apexify/node:NodePainterFixture'),
  fixtureExample('web', undefined, '@apexify/web', 'fixture:@apexify/web:WebPainterFixture'),
  fixtureExample('react', 'react', '@apexify/react', 'fixture:@apexify/react:ReactCanvasFixture'),
  fixtureExample('next-server', 'next', '@apexify/next', 'fixture:@apexify/next:NextBoundaryFixture'),
  fixtureExample('next-client', 'next', '@apexify/next', 'fixture:@apexify/next:NextBoundaryFixture'),
];

export const FUTURE_SUPPORT_MATRIX: { columns: string[]; rows: AvailabilityRow[]; fixture: true; publish: false } = {
  columns: ['node', 'web', 'react', 'next-server', 'next-client'],
  rows: [
    { feature: 'Image', values: { node: { state: 'roadmap', label: 'fixture yes' }, web: { state: 'roadmap', label: 'fixture yes' }, react: { state: 'partial', label: 'via adapter' }, 'next-server': { state: 'roadmap', label: 'fixture yes' }, 'next-client': { state: 'partial', label: 'via adapter' } } },
    { feature: 'Realtime', values: { node: { state: 'unsupported', label: 'fixture no' }, web: { state: 'capability-gated', label: 'fixture capability-gated', capability: 'worker-support' }, react: { state: 'partial', label: 'via adapter' }, 'next-server': { state: 'unsupported', label: 'fixture no' }, 'next-client': { state: 'partial', label: 'via adapter' } } },
  ],
  fixture: true,
  publish: false,
};

export const FUTURE_ADAPTERS: FutureAdapterDescriptor[] = [
  { name: 'FutureApiManifestAdapter', inputContract: ['generated package metadata'], outputContract: ['ApiManifest'], consumer: 'DOC-4 API reference', futureOwner: 'future package phase', architectureReason: 'Normalizes package data into the existing API renderer.', fixtureOnly: true },
  { name: 'WebRuntimeAdapter', inputContract: ['InteractiveSession', 'mount target'], outputContract: ['preview state', 'diagnostics', 'capabilities'], consumer: 'DOC-8 InteractiveWorkspace', futureOwner: 'future web runtime phase', architectureReason: 'Supplies execution only; editor/workspace stays unchanged.', fixtureOnly: true },
  { name: 'AnimationRuntimeAdapter', inputContract: ['InteractiveSession', 'AnimationPlaybackState'], outputContract: ['preview state', 'diagnostics'], consumer: 'DOC-8 InteractiveWorkspace', futureOwner: 'future animation phase', architectureReason: 'Supplies animation execution only; no shadow renderer/editor.', fixtureOnly: true },
  { name: 'ReactExampleVerifier', inputContract: ['ExampleDefinition', 'future package artifact'], outputContract: ['verification status'], consumer: 'DOC-5 example manifest', futureOwner: 'future React phase', architectureReason: 'Adds a verifier mode without a second example registry.', fixtureOnly: true },
  { name: 'NextFixtureVerifier', inputContract: ['server/client ExampleDefinition'], outputContract: ['boundary/build verification'], consumer: 'DOC-5 example manifest', futureOwner: 'future Next phase', architectureReason: 'Uses the same example registry with runtime metadata.', fixtureOnly: true },
  { name: 'DiagnosticManifestAdapter', inputContract: ['future diagnostic source'], outputContract: ['diagnostic SearchRecord/content record'], consumer: 'DOC-6 search + existing diagnostic UI', futureOwner: 'future diagnostics phase', architectureReason: 'Adds records to existing search/reference systems.', fixtureOnly: true },
  { name: 'CapabilityManifestAdapter', inputContract: ['future capability source'], outputContract: ['capability metadata'], consumer: 'support matrix/badges/API options', futureOwner: 'future capability phase', architectureReason: 'Drives structured support UI rather than duplicated prose.', fixtureOnly: true },
];

export const FUTURE_VERSION_FIXTURES = [
  { id: 'stable-fixture', label: 'Stable fixture', status: 'TEST-ONLY', public: false },
  { id: 'next-fixture', label: 'Next/preview fixture', status: 'TEST-ONLY', public: false },
  { id: 'historical-fixture', label: 'Historical supported fixture', status: 'TEST-ONLY', public: false },
] as const;
