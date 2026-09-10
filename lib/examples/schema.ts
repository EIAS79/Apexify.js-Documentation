export const EXAMPLE_SCHEMA_VERSION = 1 as const;

export const EXAMPLE_RUNTIMES = ['node'] as const;
export type ExampleRuntime = (typeof EXAMPLE_RUNTIMES)[number];

export const EXAMPLE_DIFFICULTIES = ['minimal', 'practical', 'advanced', 'integration'] as const;
export type ExampleDifficulty = (typeof EXAMPLE_DIFFICULTIES)[number];

export const EXAMPLE_OUTPUT_TYPES = ['image', 'gif', 'json', 'text', 'multi'] as const;
export type ExampleOutputType = (typeof EXAMPLE_OUTPUT_TYPES)[number];

export const EXAMPLE_VERIFICATION_MODES = ['exact-hash', 'golden-file', 'semantic', 'metadata', 'structural'] as const;
export type ExampleVerificationMode = (typeof EXAMPLE_VERIFICATION_MODES)[number];

export type ExampleVerificationStatus = 'verified' | 'failed' | 'stale' | 'not-run' | 'unsupported';

export interface ExampleOutputExpectation {
  path: string;
  kind: 'png' | 'gif' | 'json' | 'text';
  public: boolean;
  verificationMode: ExampleVerificationMode;
  width?: number;
  height?: number;
  minBytes?: number;
  maxBytes?: number;
  exactText?: string;
  jsonEquals?: unknown;
}

export interface ExampleExplanation {
  goal: string;
  prerequisites: string[];
  importantOptions: string[];
  whyOptions: string[];
  variants: string[];
  performanceNote: string;
  errorNote: string;
  nextStep: string;
}

export interface ExampleDefinition {
  id: string;
  title: string;
  summary: string;
  runtime: ExampleRuntime;
  framework?: string;
  difficulty: ExampleDifficulty;
  packages: string[];
  features: string[];
  apiSymbols: string[];
  sourceFiles: string[];
  entrypoint: string;
  outputType: ExampleOutputType;
  expectedOutput: ExampleOutputExpectation[];
  verification: {
    typecheck: boolean;
    executable: boolean;
    timeoutMs: number;
    stderrPolicy: 'fail-on-error-pattern';
  };
  relatedDocs: string[];
  relatedExamples?: string[];
  gallery: {
    enabled: boolean;
    featured?: boolean;
    previewOutput: string;
  };
  explanation: ExampleExplanation;
}

export interface GeneratedExampleSource {
  path: string;
  language: 'typescript';
  sha256: string;
  content: string;
}

export interface GeneratedExampleOutput {
  path: string;
  kind: ExampleOutputExpectation['kind'];
  publicPath: string | null;
  verificationMode: ExampleVerificationMode;
  width?: number;
  height?: number;
}

export interface GeneratedExampleRecord extends Omit<ExampleDefinition, 'sourceFiles' | 'expectedOutput'> {
  schemaVersion: typeof EXAMPLE_SCHEMA_VERSION;
  canonicalRoute: string;
  sourceHash: string;
  sources: GeneratedExampleSource[];
  outputs: GeneratedExampleOutput[];
  verificationStatus: ExampleVerificationStatus;
  verifiedPackageVersion: string | null;
  verifiedPackageCommit: string | null;
  verifiedArtifactSha256: string | null;
}

export interface ExampleManifest {
  schemaVersion: typeof EXAMPLE_SCHEMA_VERSION;
  package: { name: 'apexify.js'; version: string; commit: string };
  examples: GeneratedExampleRecord[];
}

export const EXAMPLE_ID_PATTERN = /^node\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
