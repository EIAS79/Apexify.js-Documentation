export type VisualCapabilityClassification =
  | 'visual-property'
  | 'visual-object'
  | 'visual-operation'
  | 'timeline-operation'
  | 'project-operation'
  | 'export-only'
  | 'hosted-runtime-exclusion'
  | 'not-applicable';

export type StudioExecutionRoute =
  | 'browser'
  | 'full-runtime'
  | 'host-persistence'
  | 'external-service'
  | 'introspection';

export type VisualCapabilityImplementationState =
  | 'planned'
  | 'excluded'
  | 'not-applicable';

export interface VisualCapabilityCodegenMapping {
  strategy: 'direct-public-api';
  symbol: string;
}

export interface VisualCapabilityRow {
  capability: string;
  sourceRoute: StudioExecutionRoute;
  classification: VisualCapabilityClassification;
  domain: string;
  editorSection: string | null;
  controlSchemaId: string | null;
  projectModelField: string | null;
  previewRuntimeRoute: 'browser' | 'full-runtime' | null;
  codegen: VisualCapabilityCodegenMapping | null;
  proofCaseIds: string[];
  phaseOwner: string;
  implementationState: VisualCapabilityImplementationState;
}

export const VISUAL_CAPABILITY_CLASSIFICATIONS: readonly VisualCapabilityClassification[] = [
  'visual-property',
  'visual-object',
  'visual-operation',
  'timeline-operation',
  'project-operation',
  'export-only',
  'hosted-runtime-exclusion',
  'not-applicable',
] as const;
