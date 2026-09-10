export type ApiStability = 'CURRENT' | 'PREVIEW' | 'EXPERIMENTAL' | 'ROADMAP' | 'DEPRECATED' | 'REMOVED';
export type RuntimeTarget = 'node22' | 'node24' | 'node26';

export interface ApiSourceRef {
  declarationPath: string;
  sourcePath: string;
  href: string;
}

export interface ApiTypeNode {
  kind: 'primitive' | 'literal' | 'union' | 'intersection' | 'object' | 'interface' | 'array' | 'tuple' | 'generic' | 'function' | 'promise' | 'record' | 'optional' | 'nullable' | 'reference' | 'unknown';
  text: string;
  name?: string;
  href?: string;
  value?: string | number | boolean | null;
  elements?: ApiTypeNode[];
  properties?: Array<{ name: string; optional: boolean; type: ApiTypeNode }>;
}

export interface ApiOption {
  id: string;
  path: string;
  name: string;
  type: ApiTypeNode;
  required: boolean;
  defaultState: 'required' | 'none' | 'explicit' | 'runtime' | 'derived';
  defaultValue?: unknown;
  allowedValues?: Array<string | number | boolean | null>;
  description: string;
  runtimeTargets: RuntimeTarget[];
  animatable?: boolean;
  stability: ApiStability;
  deprecated?: { since?: string; replacement?: string; note?: string };
  source: ApiSourceRef;
  children: ApiOption[];
}

export interface ApiParameter {
  name: string;
  optional: boolean;
  rest: boolean;
  type: ApiTypeNode;
  description?: string;
  options: ApiOption[];
}

export interface ApiSignatureRecord {
  id: string;
  label: string;
  text: string;
  parameters: ApiParameter[];
  returnType: ApiTypeNode;
}

export interface ApiMember {
  id: string;
  owner: string;
  name: string;
  kind: 'constructor' | 'method' | 'property';
  signature: string;
  overloads: ApiSignatureRecord[];
  runtimeTargets: RuntimeTarget[];
  stability: ApiStability;
  since?: string;
  deprecated?: { since?: string; replacement?: string; note?: string };
  source: ApiSourceRef;
  href: string;
  summary: string;
  relatedApiIds: string[];
  examples: Array<{ id: string; href: string; label: string }>;
}

export interface ApiSymbol {
  id: string;
  package: string;
  exportPath: string;
  exportPaths: string[];
  symbol: string;
  kind: 'class' | 'interface' | 'type' | 'function' | 'enum' | 'constant' | 'namespace';
  signature: string;
  overloads: ApiSignatureRecord[];
  members: ApiMember[];
  runtimeTargets: RuntimeTarget[];
  stability: ApiStability;
  since?: string;
  deprecated?: { since?: string; replacement?: string; note?: string };
  source: ApiSourceRef;
  href: string;
  summary: string;
  relatedApiIds: string[];
  examples: Array<{ id: string; href: string; label: string }>;
  isTypeOnly: boolean;
}

export interface ApiType {
  id: string;
  name: string;
  type: ApiTypeNode;
  source: ApiSourceRef;
  href: string;
}

export interface ApiError {
  id: string;
  code?: string;
  className: string;
  condition: string;
  resolution: string;
  runtimeTargets: RuntimeTarget[];
  relatedApiIds: string[];
  recoverability?: string;
}

export interface ApiLimit {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  context: string;
  runtimeTargets: RuntimeTarget[];
  source: ApiSourceRef;
}

export interface ApiSearchRecord {
  kind: 'api-symbol' | 'api-member' | 'api-option' | 'api-type' | 'api-error';
  id: string;
  symbolId: string;
  package: string;
  title: string;
  terms: string[];
  runtime: RuntimeTarget[];
  href: string;
}

export interface ApiCoverageSummary {
  publicExportsTotal: number;
  stablePublicExports: number;
  documentedPublicExports: number;
  missingPublicExports: string[];
  staleDocumentedExports: string[];
  publicMembersTotal: number;
  documentedMembers: number;
  optionPathsTotal: number;
  documentedOptionPaths: number;
  missingOptionPaths: string[];
  staleOptionPaths: string[];
  signaturesVerified: number;
  signatureMismatches: string[];
  typesResolved: number;
  unresolvedPublicTypes: string[];
  errorsDocumented: number;
  limitsDocumented: number;
  runtimeMetadataCoverage: number;
  sourceLinkCoverage: number;
  exampleLinkCoverage: number;
}

export interface ApiManifest {
  schemaVersion: 1;
  generatedPolicy: 'Generated from packed package declarations/artifacts and explicit metadata. Do not edit directly.';
  package: {
    name: string;
    version: string;
    commit: string;
    packedTreeSha256: string;
    manifestSha256?: string;
  };
  entrypoints: Array<{ exportPath: string; declarationFile: string; exports: string[] }>;
  symbols: ApiSymbol[];
  types: ApiType[];
  errors: ApiError[];
  limits: ApiLimit[];
  search: ApiSearchRecord[];
  coverage: ApiCoverageSummary;
  representativeApiId: string;
}
