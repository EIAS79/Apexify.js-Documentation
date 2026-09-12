import fs from 'node:fs';
import path from 'node:path';
import {
  CURRENT_CAPABILITIES,
  FEATURE_TRACKS,
  HERO_EXAMPLE_ID,
  PUBLIC_CLAIMS,
  ROADMAP_CAPABILITIES,
} from '../../lib/product/catalog-data';

type ApiManifest = {
  package: { name: string; version: string; commit: string };
  symbols: Array<{
    symbol: string;
    members: Array<{ name: string; href: string; stability: string }>;
  }>;
};

type ExampleManifest = {
  package: { name: string; version: string; commit: string };
  examples: Array<{
    id: string;
    title: string;
    verificationStatus: string;
    verifiedPackageVersion: string | null;
    verifiedPackageCommit: string | null;
    canonicalRoute: string;
    entrypoint: string;
    sources: Array<{ path: string; content: string }>;
    outputs: Array<{ path: string; publicPath: string | null }>;
    gallery: { enabled: boolean; previewOutput: string };
  }>;
};

const ROOT = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const json = <T>(relative: string): T => JSON.parse(read(relative)) as T;
const fail = (message: string): never => {
  throw new Error(`[doc7-verify] ${message}`);
};

const api = json<ApiManifest>('generated/docs-doc4/api-manifest.json');
const examples = json<ExampleManifest>('generated/docs-doc5/example-manifest.json');
const packageJson = json<{ dependencies?: Record<string, string> }>('package.json');

if (api.package.name !== 'apexify.js') fail(`unexpected DOC-4 package ${api.package.name}`);
if (
  api.package.name !== examples.package.name ||
  api.package.version !== examples.package.version ||
  api.package.commit !== examples.package.commit
) {
  fail('DOC-4 and DOC-5 package identities disagree');
}

const pin = packageJson.dependencies?.['apexify.js'] ?? '';
if (!pin.endsWith(`#${api.package.commit}`)) {
  fail(`documentation dependency pin does not match ${api.package.commit}`);
}

const apexPainter = api.symbols.find((symbol) => symbol.symbol === 'ApexPainter');
if (!apexPainter) fail('ApexPainter missing from DOC-4 manifest');

const currentCapabilities = CURRENT_CAPABILITIES.map((capability) => {
  const member = apexPainter.members.find((candidate) => candidate.name === capability.apiMember);
  if (!member) fail(`ApexPainter#${capability.apiMember} missing from DOC-4 manifest`);
  if (member.stability !== 'CURRENT') {
    fail(`ApexPainter#${capability.apiMember} is ${member.stability}, but DOC-7 labels it CURRENT`);
  }
  if (capability.exampleId) {
    const example = examples.examples.find((candidate) => candidate.id === capability.exampleId);
    if (!example || example.verificationStatus !== 'verified') {
      fail(`${capability.id} example ${capability.exampleId} is not DOC-5 verified`);
    }
  }
  return {
    id: capability.id,
    title: capability.title,
    status: 'CURRENT',
    api: `ApexPainter#${capability.apiMember}`,
    href: member.href,
    exampleId: capability.exampleId ?? null,
  };
});

for (const roadmap of ROADMAP_CAPABILITIES) {
  if (!['ROADMAP', 'PREVIEW', 'EXPERIMENTAL'].includes(roadmap.status)) {
    fail(`roadmap capability ${roadmap.id} has invalid public status ${roadmap.status}`);
  }
}

const hero = examples.examples.find((example) => example.id === HERO_EXAMPLE_ID);
if (!hero || hero.verificationStatus !== 'verified') fail(`${HERO_EXAMPLE_ID} is not verified`);
if (hero.verifiedPackageCommit !== api.package.commit || hero.verifiedPackageVersion !== api.package.version) {
  fail(`${HERO_EXAMPLE_ID} verification identity does not match active package`);
}
const heroSource = hero.sources.find((source) => source.path === hero.entrypoint);
const heroOutput = hero.outputs.find((output) => output.path === hero.gallery.previewOutput);
if (!heroSource?.content.includes('ApexPainter')) fail('homepage hero source is not authoritative executable source');
if (!heroOutput?.publicPath) fail('homepage hero output is not a public DOC-5 output');

for (const track of FEATURE_TRACKS) {
  if (!track.apiMembers.length) fail(`feature track ${track.id} has no API evidence`);
  for (const memberName of track.apiMembers) {
    if (!apexPainter.members.some((member) => member.name === memberName && member.stability === 'CURRENT')) {
      fail(`feature track ${track.id} references non-current API ${memberName}`);
    }
  }
}

const sourceChecks = {
  page: read('app/page.tsx'),
  productHome: read('components/home/ProductHome.tsx'),
  galleryClient: read('app/gallery/components/GalleryClient.tsx'),
  galleryHero: read('app/gallery/components/GalleryHero.tsx'),
  galleryScope: read('app/gallery/components/GalleryScopeBar.tsx'),
  galleryHelpers: read('app/gallery/components/galleryHelpers.ts'),
  galleryAdapter: read('lib/gallery/docs/doc5GalleryAdapter.ts'),
};

if (/['"]use client['"]/.test(sourceChecks.page.slice(0, 80))) fail('homepage root is still a client component');
for (const obsolete of [
  'components/home/HeroShowcase.tsx',
  'components/home/HomeSections.tsx',
  'components/home/HomeMotion.tsx',
  'components/home/ShowcaseWall.tsx',
]) {
  if (fs.existsSync(path.join(ROOT, obsolete))) fail(`obsolete homepage implementation remains: ${obsolete}`);
}

if (!sourceChecks.productHome.includes('data-doc7-verified-hero')) fail('homepage lacks verified-example proof marker');
if (!sourceChecks.productHome.includes('data-product-status')) fail('homepage lacks explicit product-status markers');
if (!sourceChecks.galleryHelpers.includes('itemMatchesRuntime')) fail('Gallery runtime filter is missing');
if (!sourceChecks.galleryHelpers.includes('itemMatchesEvidence')) fail('Gallery evidence/provenance filter is missing');
if (!sourceChecks.galleryScope.includes('Verified examples')) fail('Gallery provenance explanation is missing');
if (!sourceChecks.galleryAdapter.includes('**VERIFIED EXAMPLE**')) fail('DOC-5 Gallery cards are not visibly provenance-labelled');
if (sourceChecks.galleryHero.includes('v5.4.5')) fail('stale v5.4.5 Gallery copy remains');

for (const [name, source] of Object.entries(sourceChecks)) {
  if (source.includes('/docs#')) fail(`${name} reintroduced legacy hash documentation links`);
}

const publicCopy = `${sourceChecks.productHome}\n${sourceChecks.galleryHero}\n${sourceChecks.galleryScope}`;
const bannedClaims = [
  /\b\d+(?:\.\d+)?\s*fps\b/i,
  /\b\d+(?:\.\d+)?\s*ms\b/i,
  /\b\d+(?:\.\d+)?%\s*(?:faster|quicker|less memory)\b/i,
  /\bblazing fast\b/i,
  /\brealtime browser rendering is available\b/i,
];
for (const pattern of bannedClaims) {
  if (pattern.test(publicCopy)) fail(`unverified performance/future capability claim matched ${pattern}`);
}

const galleryExamples = examples.examples.filter((example) => example.gallery.enabled);
for (const example of galleryExamples) {
  if (example.verificationStatus !== 'verified') fail(`Gallery example ${example.id} is not verified`);
  const output = example.outputs.find((candidate) => candidate.path === example.gallery.previewOutput);
  if (!output?.publicPath) fail(`Gallery example ${example.id} lacks a public preview`);
}

const evidence = {
  schemaVersion: 1,
  phase: 'DOC-7',
  package: api.package,
  homepage: {
    serverRoot: true,
    heroExampleId: HERO_EXAMPLE_ID,
    currentCapabilities,
    roadmap: ROADMAP_CAPABILITIES,
    featureTracks: FEATURE_TRACKS.map((track) => ({
      id: track.id,
      apiMembers: track.apiMembers,
      exampleId: track.exampleId ?? null,
    })),
  },
  gallery: {
    verifiedExamples: galleryExamples.map((example) => example.id),
    runtimeFilter: true,
    evidenceFilter: true,
    canonicalExampleLinkage: true,
  },
  claims: PUBLIC_CLAIMS,
  guardrails: {
    obsoleteHomepageFilesRemoved: true,
    legacyHashLinksInDoc7Surfaces: 0,
    unverifiedNumericPerformanceClaims: 0,
    futureCapabilitiesPresentedAsCurrent: 0,
  },
};

const outDir = path.join(ROOT, 'generated', 'docs-doc7', 'runtime');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'product-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log('[doc7-verify] PASS', JSON.stringify({
  package: `${api.package.name}@${api.package.version}`,
  currentCapabilities: currentCapabilities.length,
  roadmapCapabilities: ROADMAP_CAPABILITIES.length,
  verifiedGalleryExamples: galleryExamples.length,
  claims: PUBLIC_CLAIMS.length,
}));
