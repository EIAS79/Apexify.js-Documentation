export type ParityStatus =
  | 'FULL'
  | 'PARTIAL'
  | 'MISSING'
  | 'RUNTIME-ONLY'
  | 'CODE-ONLY'
  | 'EXCLUDED-WITH-REASON'
  | 'DEPRECATED-COMPAT'
  | 'DRIFT'
  | 'BLOCKED'
  | 'UNKNOWN';

export type RuntimeSupport = 'supported' | 'unsupported' | 'unknown' | 'host-excluded';

export type RuntimeSourcePin = {
  repository: string;
  commit: string;
  sourceRoot: string;
  program: 'STUDIO-PARITY';
  phase: 'STUDIO-PARITY-0';
  policy: string;
};

export type SourceLocation = {
  file: string;
  line?: number;
  character?: number;
};

export type SourceEvidence = {
  implementation: SourceLocation[];
  validation: SourceLocation[];
  defaults: Array<SourceLocation & { expression: string; value: unknown | null }>;
  resourceLimits: Array<SourceLocation & { limit: string }>;
  errors: Array<SourceLocation & { errorClass: string }>;
};

export type LegacyStudioEvidence = {
  capabilityRowFound: boolean;
  capabilityClassification?: string;
  implementationState?: string;
  editorSection?: string;
  controlSchemaId?: string;
  projectModelField?: string;
  previewRuntimeRoute?: string;
  codegenSymbol?: string;
  proofCaseIds?: string[];
  legacyOptionInventoryMatches?: string[];
};

export type PublicSurfaceRecord = {
  id: string;
  publicSymbol: string;
  owner: string;
  member: string;
  kind: 'method' | 'facet-method' | 'property' | 'getter' | 'static-method';
  domain: string;
  signature: string;
  source: SourceLocation;
  implementationFiles: string[];
  validationFiles: string[];
  sourceEvidence: SourceEvidence;
  inputRecordCount: number;
  outputRecordCount: number;
  legacyStudio: LegacyStudioEvidence;
  status: ParityStatus;
  notes: string[];
};

export type RuntimeParityRecord = {
  id: string;
  publicSymbol: string;
  optionPath: string;
  direction: 'input' | 'output';
  parentType: string | null;
  leafType: string;
  unionVariant: string | null;
  sourceFiles: string[];
  implementationFiles: string[];
  validationFiles: string[];
  sourceEvidence: SourceEvidence;
  runtimeDefault: unknown | null;
  acceptedValues: Array<string | number | boolean | null>;
  constraints: string[];
  deprecation: string | null;
  runtimeInteractions: string[];
  resourceLimits: string[];
  runtimeSupport: {
    node: RuntimeSupport;
    browser: RuntimeSupport;
  };
  studio: {
    modelPath: string | null;
    controlId: string | null;
    controlSurface: string | null;
    visualValidation: string | null;
    previewRoute: string | null;
    codegenMapping: string | null;
    visualToCode: 'proven' | 'claimed' | 'unknown' | 'not-applicable';
    codeToVisual: 'proven' | 'claimed' | 'unknown' | 'not-applicable';
    undoRedo: 'proven' | 'claimed' | 'unknown' | 'not-applicable';
    persistence: 'proven' | 'claimed' | 'unknown' | 'not-applicable';
    export: 'proven' | 'claimed' | 'unknown' | 'not-applicable';
    proofIds: string[];
  };
  status: ParityStatus;
  notes: string[];
};

export type GapSummary = {
  schemaVersion: 1;
  phase: 'STUDIO-PARITY-0';
  runtime: {
    repository: string;
    commit: string;
    packageVersion: string | null;
  };
  studio: {
    repository: 'EIAS79/Apexify.js-Documentation';
    commit: string | null;
    installedApexifyPin: string | null;
    installedPinCommit: string | null;
    runtimePinMatchesInstalledPackage: boolean;
  };
  counts: {
    publicSurfaces: number;
    recursiveRecords: number;
    inputRecords: number;
    outputRecords: number;
    unionVariants: number;
    status: Record<ParityStatus, number>;
    legacyCapabilities: number;
    legacyOptionPaths: number;
    legacyUnclassifiedOptionPaths: number;
  };
  drift: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
  }>;
  domains: Record<string, {
    surfaces: number;
    records: number;
    status: Partial<Record<ParityStatus, number>>;
  }>;
  gates: {
    deterministicSourcePin: boolean;
    runtimeSourceReadable: boolean;
    apexPainterFound: boolean;
    zeroSilentPublicSurfaceOmissions: boolean;
    deepRecursiveTypeResolution: boolean;
    surfaceReconciliationComplete: boolean;
    sourceMappingVerified: boolean;
    noBootstrapFullClaims: boolean;
    everyRecordHasStatus: boolean;
    baselineComplete: boolean;
  };
};

export const PARITY_STATUSES: ParityStatus[] = [
  'FULL',
  'PARTIAL',
  'MISSING',
  'RUNTIME-ONLY',
  'CODE-ONLY',
  'EXCLUDED-WITH-REASON',
  'DEPRECATED-COMPAT',
  'DRIFT',
  'BLOCKED',
  'UNKNOWN',
];

export const DOMAIN_ORDER = [
  'canvas',
  'image',
  'text',
  'charts',
  'scene',
  'templates-components-assets',
  'paths-pixels-detect',
  'image-utils',
  'gif-animation',
  'audio',
  'video',
  'output',
  'batch-chain-plugins',
  'rendering',
  'runtime',
  'other',
] as const;
