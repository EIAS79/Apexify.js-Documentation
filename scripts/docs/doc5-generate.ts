import fs from 'node:fs';
import path from 'node:path';
import { exampleDefinitions, DOC5_PACKAGE } from '../../lib/examples/definitions';
import { stableSourceHash, sha256 } from '../../lib/examples/hash';
import { EXAMPLE_SCHEMA_VERSION, type ExampleManifest, type GeneratedExampleRecord } from '../../lib/examples/schema';
import { validateExampleDefinitions } from '../../lib/examples/validation';
import { BROWSER_EXAMPLE_RUNTIME_STATUS } from '../../lib/examples/browser-runner-contract';

const root = process.cwd();
const outDir = path.join(root, 'generated', 'docs-doc5');
const check = process.argv.includes('--check');

function readJson<T>(file: string): T { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as T; }
function rel(p: string) { return p.replace(/\\/g, '/'); }
function writeJson(name: string, value: unknown) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  const file = path.join(outDir, name);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) throw new Error(`[doc5-generate] stale ${name}`);
    return;
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(file, text);
}

const docsManifest = readJson<{ pages: Array<{ canonicalPath: string }> }>('generated/docs-doc1/docs-manifest.json');
const apiManifest = readJson<{ symbols: Array<{ id: string; members: Array<{ id: string }> }> }>('generated/docs-doc4/api-manifest.json');
const apiIds = new Set<string>();
for (const symbol of apiManifest.symbols) { apiIds.add(symbol.id); for (const member of symbol.members) apiIds.add(member.id); }
const docs = new Set(docsManifest.pages.map((page) => page.canonicalPath));
const files = new Set<string>();
for (const definition of exampleDefinitions) for (const source of definition.sourceFiles) if (fs.existsSync(path.join(root, source))) files.add(source);
validateExampleDefinitions(exampleDefinitions, { docs, apiIds, files });

const provenancePath = path.join(outDir, 'output-provenance.json');
const provenance = fs.existsSync(provenancePath) ? JSON.parse(fs.readFileSync(provenancePath, 'utf8')) as { examples?: Array<{ id: string; sourceHash: string; packageVersion: string; packageCommit: string; artifactSha256: string; outputs: Array<{ path: string; sha256: string }> }> } : { examples: [] };
const provenanceById = new Map((provenance.examples ?? []).map((item) => [item.id, item]));

const records: GeneratedExampleRecord[] = exampleDefinitions.map((definition) => {
  const sources = definition.sourceFiles.map((sourcePath) => {
    const content = fs.readFileSync(path.join(root, sourcePath), 'utf8').replace(/\r\n/g, '\n');
    return { path: rel(sourcePath), language: 'typescript' as const, sha256: sha256(content), content };
  });
  const sourceHash = stableSourceHash(sources);
  const prior = provenanceById.get(definition.id);
  let verificationStatus: GeneratedExampleRecord['verificationStatus'] = 'not-run';
  if (prior) verificationStatus = prior.sourceHash === sourceHash && prior.packageVersion === DOC5_PACKAGE.version && prior.packageCommit === DOC5_PACKAGE.commit ? 'verified' : 'stale';
  return {
    ...definition,
    schemaVersion: EXAMPLE_SCHEMA_VERSION,
    canonicalRoute: `/examples/${encodeURIComponent(definition.id)}`,
    sourceHash,
    sources,
    outputs: definition.expectedOutput.map((output) => ({
      path: output.path,
      kind: output.kind,
      publicPath: output.public ? `/example-outputs/${definition.id}/${output.path}` : null,
      verificationMode: output.verificationMode,
      width: 'width' in output ? output.width : undefined,
      height: 'height' in output ? output.height : undefined,
    })),
    verificationStatus,
    verifiedPackageVersion: verificationStatus === 'verified' ? prior!.packageVersion : null,
    verifiedPackageCommit: verificationStatus === 'verified' ? prior!.packageCommit : null,
    verifiedArtifactSha256: verificationStatus === 'verified' ? prior!.artifactSha256 : null,
  };
});

const manifest: ExampleManifest = { schemaVersion: EXAMPLE_SCHEMA_VERSION, package: DOC5_PACKAGE, examples: records };
const inventory = records.map(({ id, title, runtime, difficulty, features, canonicalRoute, verificationStatus, sourceHash }) => ({ id, title, runtime, difficulty, features, canonicalRoute, verificationStatus, sourceHash }));
const coverage = {
  schemaVersion: 1,
  total: records.length,
  verified: records.filter((r) => r.verificationStatus === 'verified').map((r) => r.id),
  failed: [] as string[],
  stale: records.filter((r) => r.verificationStatus === 'stale').map((r) => r.id),
  unverified: records.filter((r) => r.verificationStatus === 'not-run').map((r) => r.id),
  node: records.map((r) => r.id),
  difficulty: Object.fromEntries(['minimal','practical','advanced','integration'].map((d) => [d, records.filter((r) => r.difficulty === d).map((r) => r.id)])),
  docsLinked: records.filter((r) => r.relatedDocs.length).map((r) => r.id),
  apiLinked: records.filter((r) => r.apiSymbols.length).map((r) => r.id),
  galleryLinked: records.filter((r) => r.gallery.enabled).map((r) => r.id),
  withVerifiedOutput: records.filter((r) => r.verificationStatus === 'verified').map((r) => r.id),
  missingExplanation: [] as string[],
};
const drift = {
  schemaVersion: 1,
  orphanSources: [] as string[],
  manifestWithoutSource: [] as string[],
  sourceWithoutManifest: [] as string[],
  docsMissingExampleIds: [] as string[],
  apiMissingExampleIds: [] as string[],
  galleryMissingExampleIds: [] as string[],
  staleOutputs: coverage.stale,
  unverifiedPublicExamples: records.filter((r) => r.gallery.enabled && r.verificationStatus !== 'verified').map((r) => r.id),
};
const identity = {
  schemaVersion: 1,
  phase: 'DOC-5',
  docsBaseSha: 'b7dfca98c2c227619f6b5360898248845846d83a',
  package: DOC5_PACKAGE,
  phase14pFrozenSha: '5d9b71f185140d6c3477286b8fb111f293e52b48',
  stableIdPattern: '^node\\.[a-z0-9]+(?:[.-][a-z0-9]+)*$',
};
const linkage = (kind: 'docs'|'api'|'gallery') => records.map((r) => kind === 'docs' ? { id:r.id, links:r.relatedDocs } : kind === 'api' ? { id:r.id, links:r.apiSymbols } : { id:r.id, enabled:r.gallery.enabled, preview:r.gallery.previewOutput });
const security = {
  schemaVersion: 1,
  executes: 'repository-controlled DOC-5 example sources only',
  arbitraryPublicCode: false,
  sandboxClaim: false,
  isolation: ['temporary consumer fixture', 'per-example working/output directory', 'packed artifact install', 'sanitized execution environment', 'timeout', 'stdio cap', 'output count/byte limits', 'cleanup'],
  network: 'No example requires network I/O; operating-system network access is not claimed to be denied.',
  inheritedSecretEnvironment: false,
};
const dependencyAudit = { schemaVersion:1, productionDependenciesAdded:[], ciDependenciesAdded:[], decision:'DOC-5 uses Node core plus existing TypeScript/tsx tooling; no heavy production dependency added.' };
const browserContract = { schemaVersion:1, ...BROWSER_EXAMPLE_RUNTIME_STATUS, contract:'BrowserExampleRunner', activation:'deferred until a real shipped @apexify/web runtime exists' };

writeJson('identity.json', identity);
writeJson('example-manifest.json', manifest);
writeJson('example-inventory.json', inventory);
writeJson('source-hashes.json', records.map((r) => ({ id:r.id, sourceHash:r.sourceHash, files:r.sources.map((s) => ({ path:s.path, sha256:s.sha256 })) })));
writeJson('example-coverage.json', coverage);
writeJson('example-drift.json', drift);
writeJson('docs-linkage.json', linkage('docs'));
writeJson('api-linkage.json', linkage('api'));
writeJson('gallery-linkage.json', linkage('gallery'));
writeJson('browser-runner-contract.json', browserContract);
writeJson('security-boundary.json', security);
writeJson('dependency-audit.json', dependencyAudit);
const index = ['identity.json','example-manifest.json','example-inventory.json','source-hashes.json','example-coverage.json','example-drift.json','docs-linkage.json','api-linkage.json','gallery-linkage.json','browser-runner-contract.json','security-boundary.json','dependency-audit.json'].map((name) => ({ name }));
writeJson('index.json', { schemaVersion:1, phase:'DOC-5', files:index });
console.log(`[doc5-generate] ${check ? 'verified' : 'wrote'} ${records.length} authoritative examples; ${coverage.verified.length} verified`);
