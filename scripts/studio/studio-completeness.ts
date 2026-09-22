import fs from 'node:fs';
import path from 'node:path';
import {
  STUDIO_BROWSER_DIRECT_METHODS,
  STUDIO_FULL_RUNTIME_FACETS,
  STUDIO_FULL_RUNTIME_METHODS,
} from '../../lib/studio/runtime/capabilities';
import { STUDIO_TEMPLATES } from '../../lib/studio/studioConfig';
import {
  STUDIO_EXECUTION_PROOF_CASES,
  STUDIO_OPTION_FAMILY_PROOFS,
  proofCasesForCapability,
} from './studio-proof-registry';
import { balancedDeclarationBody, namedDeclarationBody, topLevelDeclarationLines } from './declaration-parser';

const root = process.cwd();
const check = process.argv.includes('--check');
const outFile = path.join(root, 'generated', 'studio', 'capability-matrix.json');

type StudioRoute =
  | 'browser'
  | 'full-runtime'
  | 'host-persistence'
  | 'external-service'
  | 'introspection';

type CapabilityProofStatus =
  | 'implementation-ready'
  | 'excluded-by-contract'
  | 'introspection-only'
  | 'missing-proof';

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
};

const browserMethods = new Set<string>(STUDIO_BROWSER_DIRECT_METHODS);
const fullMethods = new Set<string>(STUDIO_FULL_RUNTIME_METHODS);
const fullFacets = new Set<string>(STUDIO_FULL_RUNTIME_FACETS);
const persistenceMethods = new Set(['save', 'saveMultiple']);
const ignoredFacets = new Set(['outputFormat']);

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function findDeclaration(): string {
  const candidates = [
    path.join(root, 'node_modules', 'apexify.js', 'dist', 'declarations', 'apex-painter', 'main.d.ts'),
    path.join(root, 'node_modules', 'apexify.js', 'dist', 'declarations-cjs', 'apex-painter', 'main.d.cts'),
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;

  const declarationRoot = path.join(root, 'node_modules', 'apexify.js', 'dist');
  if (!fs.existsSync(declarationRoot)) {
    throw new Error('Apexify.js declarations are missing. Run npm install before Studio completeness verification.');
  }

  const found = walk(declarationRoot).find((file) => {
    if (!/\.d\.(?:ts|cts)$/.test(file)) return false;
    try {
      return /\bclass\s+ApexPainter\b/.test(fs.readFileSync(file, 'utf8'));
    } catch {
      return false;
    }
  });
  if (!found) throw new Error('Could not locate the ApexPainter declaration in the installed apexify.js package.');
  return found;
}

function classBody(source: string): string {
  return namedDeclarationBody(source, 'ApexPainter', 'class');
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractSurface(body: string) {
  const methods: string[] = [];
  const facets: string[] = [];
  const topLevel = topLevelDeclarationLines(body).join('\n');

  const methodRe = /^([A-Za-z_$][\w$]*)\s*(?:<[^\n(]+>)?\s*\(/gm;
  let methodMatch: RegExpExecArray | null;
  while ((methodMatch = methodRe.exec(topLevel))) {
    const name = methodMatch[1]!;
    if (name !== 'constructor') methods.push(name);
  }

  const readonlyRe = /^readonly\s+([A-Za-z_$][\w$]*)\s*:/gm;
  let fieldMatch: RegExpExecArray | null;
  while ((fieldMatch = readonlyRe.exec(topLevel))) facets.push(fieldMatch[1]!);

  const getterRe = /^get\s+([A-Za-z_$][\w$]*)\s*\(\)\s*:/gm;
  let getterMatch: RegExpExecArray | null;
  while ((getterMatch = getterRe.exec(topLevel))) facets.push(getterMatch[1]!);

  return {
    methods: uniqueSorted(methods),
    facets: uniqueSorted(facets),
  };
}

const declaration = findDeclaration();
const source = fs.readFileSync(declaration, 'utf8');
const surface = extractSurface(classBody(source));

const declarationFiles = walk(path.join(root, 'node_modules', 'apexify.js', 'dist'))
  .filter((file) => /\.d\.(?:ts|cts)$/.test(file));

function declarationBody(name: string, kind: 'interface' | 'class'): string {
  const pattern = new RegExp('(?:export\\s+)?(?:declare\\s+)?' + kind + '\\s+' + name + '\\b[^\\{]*\\{');
  for (const file of declarationFiles) {
    const declarationSource = fs.readFileSync(file, 'utf8');
    const match = pattern.exec(declarationSource);
    if (!match) continue;
    const open = match.index + match[0].lastIndexOf('{');
    return balancedDeclarationBody(declarationSource, open);
  }
  throw new Error('Could not locate declaration ' + kind + ' ' + name + ' in apexify.js.');
}

function declarationMethods(body: string): string[] {
  const methods: string[] = [];
  const topLevel = topLevelDeclarationLines(body).join('\n');
  const re = /^(?:public\s+)?(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*(?:<[^\n(]+>)?\s*\(/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(topLevel))) {
    if (match[1] !== 'constructor') methods.push(match[1]!);
  }
  return uniqueSorted(methods);
}

function declarationProperties(body: string): string[] {
  const properties: string[] = [];
  const topLevel = topLevelDeclarationLines(body).join('\n');
  const readonlyRe = /^(?:public\s+)?readonly\s+([A-Za-z_$][\w$]*)\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = readonlyRe.exec(topLevel))) properties.push(match[1]!);

  const getterRe = /^(?:public\s+)?get\s+([A-Za-z_$][\w$]*)\s*\(\)\s*:/gm;
  while ((match = getterRe.exec(topLevel))) properties.push(match[1]!);

  return uniqueSorted(properties);
}

function componentFactories(): string[] {
  const pattern = /(?:export\s+)?(?:declare\s+)?function\s+createPainterComponents\s*\([^)]*\)\s*:\s*\{/;
  for (const file of declarationFiles) {
    const declarationSource = fs.readFileSync(file, 'utf8');
    const match = pattern.exec(declarationSource);
    if (!match) continue;
    const open = match.index + match[0].lastIndexOf('{');
    const body = balancedDeclarationBody(declarationSource, open);
    const topLevel = topLevelDeclarationLines(body).join('\n');
    return uniqueSorted(
      [...topLevel.matchAll(/^([A-Za-z_$][\w$]*)\s*:\s*\{/gm)].map((entry) => entry[1]!),
    );
  }
  return [];
}

function routeForTopMethod(name: string): StudioRoute | 'missing' {
  if (browserMethods.has(name)) return 'browser';
  if (fullMethods.has(name)) return 'full-runtime';
  if (persistenceMethods.has(name)) return 'host-persistence';
  return 'missing';
}

const methodRows = surface.methods.map((name) => ({
  name,
  route: routeForTopMethod(name),
}));

const facetRows = surface.facets.map((name) => ({
  name,
  route: fullFacets.has(name)
    ? 'full-runtime' as const
    : ignoredFacets.has(name)
      ? 'introspection' as const
      : 'missing' as const,
}));

const missingMethods = methodRows.filter((row) => row.route === 'missing').map((row) => row.name);
const missingFacets = facetRows.filter((row) => row.route === 'missing').map((row) => row.name);

type FacetSpec = {
  declaration: string;
  kind: 'interface' | 'class';
  routeOverrides?: Readonly<Record<string, StudioRoute>>;
};

const FACET_SPECS: Record<string, FacetSpec> = {
  createAudio: {
    declaration: 'PainterCreateAudio',
    kind: 'interface',
    routeOverrides: { save: 'host-persistence' },
  },
  image: { declaration: 'PainterImageUtils', kind: 'interface' },
  detect: { declaration: 'PainterHitDetect', kind: 'interface' },
  path2d: { declaration: 'PainterPath2D', kind: 'interface' },
  pixels: { declaration: 'PainterPixels', kind: 'interface' },
  output: {
    declaration: 'PainterOutput',
    kind: 'interface',
    routeOverrides: { url: 'external-service' },
  },
  assets: { declaration: 'AssetManager', kind: 'class' },
  plugins: { declaration: 'PluginHost', kind: 'class' },
  video: { declaration: 'VideoStack', kind: 'class' },
};

const facetMembers = Object.fromEntries(
  Object.entries(FACET_SPECS).map(([facet, spec]) => {
    const body = declarationBody(spec.declaration, spec.kind);
    const methods = declarationMethods(body).map((name) => ({
      name,
      route: spec.routeOverrides?.[name] ?? 'full-runtime' as StudioRoute,
    }));
    return [
      facet,
      {
        declaration: spec.declaration,
        methods,
        properties: declarationProperties(body),
        missing: [] as string[],
      },
    ];
  }),
);

const componentMembers = componentFactories().map((name) => ({
  name,
  method: 'toLayers',
  route: 'full-runtime' as const,
}));

type NestedSpec = {
  path: string;
  declaration: string;
  kind: 'class' | 'interface';
};

const NESTED_SPECS: readonly NestedSpec[] = [
  { path: 'SceneBuilder', declaration: 'SceneBuilder', kind: 'class' },
  { path: 'TemplateHandle', declaration: 'TemplateHandle', kind: 'class' },
  { path: 'VideoPipeline', declaration: 'VideoPipeline', kind: 'class' },
  { path: 'VideoCreator', declaration: 'VideoCreator', kind: 'class' },
  { path: 'VideoOperations', declaration: 'VideoOperations', kind: 'class' },
  { path: 'VideoOperations.transcode', declaration: 'TranscodeOperations', kind: 'class' },
  { path: 'VideoOperations.merge', declaration: 'MergeOperations', kind: 'class' },
  { path: 'VideoOperations.overlays', declaration: 'OverlayOperations', kind: 'class' },
  { path: 'VideoOperations.audio', declaration: 'AudioOperations', kind: 'class' },
  { path: 'VideoOperations.frames', declaration: 'FrameOperations', kind: 'class' },
  { path: 'VideoOperations.structure', declaration: 'StructureOperations', kind: 'class' },
  { path: 'VideoOperations.advanced', declaration: 'AdvancedVideoOperations', kind: 'class' },
];

const nestedSurfaces = Object.fromEntries(
  NESTED_SPECS.map((spec) => {
    const body = declarationBody(spec.declaration, spec.kind);
    return [
      spec.path,
      {
        declaration: spec.declaration,
        route: 'full-runtime' as const,
        methods: declarationMethods(body).map((name) => ({
          name,
          route: 'full-runtime' as const,
        })),
        properties: declarationProperties(body),
      },
    ];
  }),
);

type CapabilityRow = {
  capability: string;
  route: StudioRoute;
};

const capabilityRows: CapabilityRow[] = [
  ...methodRows
    .filter((row): row is { name: string; route: StudioRoute } => row.route !== 'missing')
    .map((row) => ({ capability: 'ApexPainter.' + row.name, route: row.route })),
  ...facetRows
    .filter((row) => row.route === 'introspection')
    .map((row) => ({ capability: 'ApexPainter.' + row.name, route: 'introspection' as const })),
  ...Object.entries(facetMembers).flatMap(([facet, detail]) => {
    const typed = detail as {
      methods: Array<{ name: string; route: StudioRoute }>;
      properties: string[];
    };
    return [
      ...typed.methods.map((row) => ({
        capability: 'ApexPainter.' + facet + '.' + row.name,
        route: row.route,
      })),
      ...typed.properties.map((name) => ({
        capability: 'ApexPainter.' + facet + '.' + name,
        route: facet === 'createAudio' ? 'full-runtime' as const : 'introspection' as const,
      })),
    ];
  }),
  ...componentMembers.map((row) => ({
    capability: 'ApexPainter.components.' + row.name + '.' + row.method,
    route: row.route,
  })),
  ...Object.entries(nestedSurfaces).flatMap(([surfacePath, detail]) =>
    (detail as { methods: Array<{ name: string; route: StudioRoute }> }).methods.map((row) => ({
      capability: surfacePath + '.' + row.name,
      route: row.route,
    })),
  ),
];

function proofStatusFor(row: CapabilityRow) {
  const cases = proofCasesForCapability(row.capability);
  let status: CapabilityProofStatus;
  if (row.route === 'host-persistence' || row.route === 'external-service') {
    status = cases.length ? 'excluded-by-contract' : 'missing-proof';
  } else if (row.route === 'introspection') {
    status = 'introspection-only';
  } else {
    status = cases.length ? 'implementation-ready' : 'missing-proof';
  }
  return {
    capability: row.capability,
    route: row.route,
    status,
    proofCaseIds: cases.map((proof) => proof.id),
    finalValidation:
      status === 'implementation-ready' ? 'deferred-final-validation' as const : 'not-required' as const,
  };
}

const capabilityProofs = capabilityRows
  .map(proofStatusFor)
  .sort((a, b) => a.capability.localeCompare(b.capability));

const missingProofs = capabilityProofs
  .filter((proof) => proof.status === 'missing-proof')
  .map((proof) => proof.capability);

const knownTemplateIds = new Set(STUDIO_TEMPLATES.map((template) => template.id));
const invalidTemplateRefs = uniqueSorted(
  STUDIO_EXECUTION_PROOF_CASES.flatMap((proof) =>
    proof.templateIds.filter((id) => !knownTemplateIds.has(id)).map((id) => proof.id + ':' + id),
  ),
);

const proofCaseIds = new Set(STUDIO_EXECUTION_PROOF_CASES.map((proof) => proof.id));
const invalidOptionProofRefs = uniqueSorted(
  STUDIO_OPTION_FAMILY_PROOFS.flatMap((proof) =>
    proof.proofCaseIds
      .filter((id) => !proofCaseIds.has(id))
      .map((id) => proof.id + ':' + id),
  ),
);

const emptyOptionFamilies = STUDIO_OPTION_FAMILY_PROOFS
  .filter((proof) => proof.families.length === 0 || proof.proofCaseIds.length === 0)
  .map((proof) => proof.id);

const artifactContractSource = fs.readFileSync(
  path.join(root, 'lib', 'docs', 'playground', 'contracts.ts'),
  'utf8',
);
const artifactPreviewSource = fs.readFileSync(
  path.join(root, 'components', 'studio', 'StudioArtifactPreview.tsx'),
  'utf8',
);
const requiredArtifactKinds = uniqueSorted(
  STUDIO_EXECUTION_PROOF_CASES.flatMap((proof) => [...proof.expectedArtifacts]),
);
const missingArtifactContractKinds = requiredArtifactKinds.filter(
  (kind) => !artifactContractSource.includes("'" + kind + "'"),
);
const missingArtifactPreviewKinds = requiredArtifactKinds.filter((kind) => {
  if (kind === 'image' || kind === 'gif') {
    return !artifactPreviewSource.includes("artifact.kind === 'image'") ||
      !artifactPreviewSource.includes("artifact.kind === 'gif'");
  }
  if (kind === 'audio' || kind === 'video' || kind === 'json' || kind === 'text') {
    return !artifactPreviewSource.includes("artifact.kind === '" + kind + "'");
  }
  return !artifactPreviewSource.includes('binary output');
});

const proofCoverage = {
  status:
    missingProofs.length === 0 &&
    invalidTemplateRefs.length === 0 &&
    invalidOptionProofRefs.length === 0 &&
    emptyOptionFamilies.length === 0 &&
    missingArtifactContractKinds.length === 0 &&
    missingArtifactPreviewKinds.length === 0
      ? 'complete'
      : 'incomplete',
  totalCapabilities: capabilityProofs.length,
  implementationReady: capabilityProofs.filter((proof) => proof.status === 'implementation-ready').length,
  excludedByContract: capabilityProofs.filter((proof) => proof.status === 'excluded-by-contract').length,
  missingProofs,
  proofCaseIds: [...proofCaseIds],
  optionFamilyProofIds: STUDIO_OPTION_FAMILY_PROOFS.map((proof) => proof.id),
  invalidTemplateRefs,
  invalidOptionProofRefs,
  emptyOptionFamilies,
  requiredArtifactKinds,
  missingArtifactContractKinds,
  missingArtifactPreviewKinds,
  finalRuntimeValidation: 'deferred-final-validation' as const,
  introspectionOnly: capabilityProofs.filter((proof) => proof.status === 'introspection-only').length,
};

const artifact = {
  schemaVersion: 2,
  packagePin: packageJson.dependencies?.['apexify.js'] ?? null,
  browserRuntime: {
    package: '@apexify/web',
    sourceRepository: 'EIAS79/Apexify.js',
    sourceCommit: 'f57bb82743c8f71bbe7e519d060010f970b06ef9',
    installation: 'integrity-checked-build-snapshot',
  },
  declaration: path.relative(root, declaration).replaceAll(path.sep, '/'),
  topLevel: {
    methods: methodRows,
    facets: facetRows,
    missingMethods,
    missingFacets,
  },
  facetMembers,
  componentMembers,
  nestedSurfaces,
  capabilityProofs,
  optionFamilyProofs: STUDIO_OPTION_FAMILY_PROOFS,
  proofCoverage,
  excludedFromStudioManipulation: [
    {
      capability: 'ApexPainter.save',
      category: 'host-persistence',
      reason: 'Writes to the host filesystem rather than returning a Studio artifact.',
    },
    {
      capability: 'ApexPainter.saveMultiple',
      category: 'host-persistence',
      reason: 'Writes to the host filesystem rather than returning Studio artifacts.',
    },
    {
      capability: 'ApexPainter.createAudio.save',
      category: 'host-persistence',
      reason: 'Writes WAV bytes to a host path rather than returning a Studio artifact.',
    },
    {
      capability: 'ApexPainter.output.url',
      category: 'external-service',
      reason: 'Uploads to Imgur and requires third-party credentials/network access; Studio returns local artifacts instead.',
    },
  ],
  implementationComplete:
    missingMethods.length === 0 &&
    missingFacets.length === 0 &&
    proofCoverage.status === 'complete',
  finalRuntimeValidation: {
    status: 'deferred',
    reason:
      'Per project execution policy, browser/full-runtime representative execution and deployment proofs run once in the final validation pass rather than during each implementation phase.',
  },
};

if (!artifact.implementationComplete) {
  console.error('[studio-completeness] INCOMPLETE STUDIO SURFACE');
  if (missingMethods.length) console.error('unrouted methods:', missingMethods.join(', '));
  if (missingFacets.length) console.error('unrouted facets:', missingFacets.join(', '));
  if (missingProofs.length) console.error('missing capability proofs:', missingProofs.join(', '));
  if (invalidTemplateRefs.length) console.error('invalid proof templates:', invalidTemplateRefs.join(', '));
  if (invalidOptionProofRefs.length) console.error('invalid option proof refs:', invalidOptionProofRefs.join(', '));
  if (emptyOptionFamilies.length) console.error('empty option proof families:', emptyOptionFamilies.join(', '));
  if (missingArtifactContractKinds.length) {
    console.error('missing artifact contract kinds:', missingArtifactContractKinds.join(', '));
  }
  if (missingArtifactPreviewKinds.length) {
    console.error('missing artifact preview kinds:', missingArtifactPreviewKinds.join(', '));
  }
  process.exitCode = 1;
}

const expected = JSON.stringify(artifact, null, 2) + '\n';
if (check) {
  if (!fs.existsSync(outFile)) {
    console.error('[studio-completeness] missing generated/studio/capability-matrix.json');
    process.exit(1);
  }
  const current = fs.readFileSync(outFile, 'utf8');
  if (current !== expected) {
    console.error('[studio-completeness] stale generated/studio/capability-matrix.json');
    process.exit(1);
  }
  console.log('[studio-completeness] CHECK PASS');
} else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, expected);
  console.log(
    '[studio-completeness] wrote generated/studio/capability-matrix.json (' +
      proofCoverage.totalCapabilities +
      ' capabilities; final runtime validation deferred)',
  );
}
