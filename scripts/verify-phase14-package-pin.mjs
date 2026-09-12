import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exactPin = /^github:EIAS79\/Apexify\.js#([0-9a-f]{40})$/;
const anyInstallPin = /github:EIAS79\/Apexify\.js#([0-9a-f]{7,40})/g;

function fail(message) {
  throw new Error(`Phase 14 package-pin verification failed: ${message}`);
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function collectFiles(relative, predicate, out = []) {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) return out;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const childRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) collectFiles(childRelative, predicate, out);
    else if (predicate(childRelative)) out.push(childRelative);
  }
  return out;
}

const pkg = JSON.parse(read('package.json'));
const dependency = pkg.dependencies?.['apexify.js'];
const match = exactPin.exec(dependency ?? '');
if (!match) fail(`package.json must pin apexify.js to an exact 40-character GitHub SHA; received ${dependency}`);
const pinnedSha = match[1];

const lock = read('package-lock.json');
if (!lock.includes(`github:EIAS79/Apexify.js#${pinnedSha}`)) fail('package-lock root spec does not match package.json Apexify SHA');
if (!lock.includes(`#${pinnedSha}`)) fail('package-lock resolved Apexify dependency does not contain the exact package SHA');

const publicFiles = [
  ...collectFiles('content/docs', (file) => file.endsWith('.mdx')),
  ...collectFiles('components/home', (file) => file.endsWith('.tsx') || file.endsWith('.ts')),
  ...collectFiles('app', (file) => file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.mdx')),
];

let fullPinCount = 0;
for (const relative of publicFiles) {
  const text = read(relative);
  for (const occurrence of text.matchAll(anyInstallPin)) {
    const advertisedSha = occurrence[1];
    if (advertisedSha.length === 40) {
      fullPinCount++;
      if (advertisedSha !== pinnedSha) fail(`${relative} advertises stale Apexify SHA ${advertisedSha}; expected ${pinnedSha}`);
    } else if (!pinnedSha.startsWith(advertisedSha)) {
      fail(`${relative} advertises abbreviated Apexify SHA ${advertisedSha} that does not match ${pinnedSha}`);
    }
  }
}

const productCatalogPath = 'lib/product/catalog.ts';
let manifestDerivedInstall = false;
if (fs.existsSync(path.join(root, productCatalogPath))) {
  const productCatalog = read(productCatalogPath);
  manifestDerivedInstall =
    productCatalog.includes('apiManifest.package.commit') &&
    productCatalog.includes('npm install github:EIAS79/Apexify.js#${apiManifest.package.commit}');
  if (manifestDerivedInstall) {
    const apiManifest = JSON.parse(read('generated/docs-doc4/api-manifest.json'));
    if (apiManifest.package?.commit !== pinnedSha) {
      fail(`DOC-4 API manifest advertises ${apiManifest.package?.commit}; expected ${pinnedSha}`);
    }
  }
}

if (fullPinCount === 0 && !manifestDerivedInstall) {
  fail('no user-facing exact Apexify GitHub install pin or verified manifest-derived install command was found');
}

if (!manifestDerivedInstall) {
  const legacyHero = path.join(root, 'components', 'home', 'HeroShowcase.tsx');
  if (!fs.existsSync(legacyHero)) fail('neither the DOC-7 manifest-derived install command nor the legacy HeroShowcase exists');
  if (!read('components/home/HeroShowcase.tsx').includes(`github:EIAS79/Apexify.js#${pinnedSha}`)) {
    fail('HeroShowcase copy-install command does not use the exact package.json Apexify SHA');
  }
}

for (const temporaryWorkflow of [
  '.github/workflows/phase13-lock-sync.yml',
  '.github/workflows/phase14-package-pin.yml',
]) {
  if (fs.existsSync(path.join(root, temporaryWorkflow))) fail(`temporary workflow must not ship: ${temporaryWorkflow}`);
}

console.log(`verify-phase14-package-pin: package, lockfile and ${manifestDerivedInstall ? 'manifest-derived public install command' : 'public install pins'} agree on ${pinnedSha}.`);
