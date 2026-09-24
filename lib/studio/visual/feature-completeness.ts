import type { VisualCapabilityClassification, VisualCapabilityRow } from './capability';

export type Phase16AuthoringMode = 'visual-controls' | 'advanced-schema';

export interface Phase16DomainEvidence {
  domain: string;
  phaseOwner: string;
  authoringMode: Phase16AuthoringMode;
  permanentUiLocations: readonly string[];
  controlEvidenceFiles: readonly string[];
  codegenEvidenceFiles: readonly string[];
  previewEvidenceFiles: readonly string[];
  regressionTestFiles: readonly string[];
  representativeProofProjectIds: readonly string[];
}

export interface Phase16ProofProjectDescriptor {
  id: string;
  phase: number;
  domains: readonly string[];
  description: string;
}

const COMMON_SHELL = 'components/studio/visual/VisualStudioPre4.tsx';
const CORE_CODEGEN = [
  'lib/studio/visual/codegen/generator.ts',
  'lib/studio/visual/compiler/plan.ts',
  'lib/studio/visual/codegen/emitter.ts',
] as const;

export const PHASE16_DOMAIN_EVIDENCE: readonly Phase16DomainEvidence[] = [
  {
    domain: 'canvas',
    phaseOwner: 'STUDIO-VISUAL-4',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Canvas', 'inspector:Style', 'inspector:Transform', 'inspector:Effects', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/model.ts'],
    codegenEvidenceFiles: CORE_CODEGEN,
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/codegen/generator.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase4-canvas.test.ts'],
    representativeProofProjectIds: ['phase16-canvas'],
  },
  {
    domain: 'image',
    phaseOwner: 'STUDIO-VISUAL-5',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Images', 'feature-rail:Shapes', 'dock:Assets', 'inspector:Transform', 'inspector:Style', 'inspector:Effects', 'inspector:Data', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/image-contract.ts'],
    codegenEvidenceFiles: CORE_CODEGEN,
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/codegen/generator.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase5-images-shapes.test.ts'],
    representativeProofProjectIds: ['phase16-image'],
  },
  {
    domain: 'text',
    phaseOwner: 'STUDIO-VISUAL-6',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Text', 'dock:Assets/Fonts', 'inspector:Style', 'inspector:Transform', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/text-contract.ts'],
    codegenEvidenceFiles: CORE_CODEGEN,
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/codegen/generator.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase6-text-fonts.test.ts'],
    representativeProofProjectIds: ['phase16-text'],
  },
  {
    domain: 'path',
    phaseOwner: 'STUDIO-VISUAL-7',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Paths', 'viewport:path-handles', 'inspector:Style', 'inspector:Advanced', 'dock:Diagnostics', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/path-pixel-contract.ts'],
    codegenEvidenceFiles: CORE_CODEGEN,
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/codegen/generator.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase7-path-pixels.test.ts'],
    representativeProofProjectIds: ['phase16-path-pixels-detect'],
  },
  {
    domain: 'pixels',
    phaseOwner: 'STUDIO-VISUAL-7',
    authoringMode: 'advanced-schema',
    permanentUiLocations: ['feature-rail:Paths', 'inspector:Advanced', 'dock:Diagnostics', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/path-pixel-contract.ts'],
    codegenEvidenceFiles: CORE_CODEGEN,
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/codegen/generator.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase7-path-pixels.test.ts'],
    representativeProofProjectIds: ['phase16-path-pixels-detect'],
  },
  {
    domain: 'detect',
    phaseOwner: 'STUDIO-VISUAL-7',
    authoringMode: 'advanced-schema',
    permanentUiLocations: ['feature-rail:Paths', 'inspector:Advanced', 'dock:Diagnostics', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/path-pixel-contract.ts'],
    codegenEvidenceFiles: CORE_CODEGEN,
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/codegen/generator.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase7-path-pixels.test.ts'],
    representativeProofProjectIds: ['phase16-path-pixels-detect'],
  },
  {
    domain: 'chart',
    phaseOwner: 'STUDIO-VISUAL-8',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Charts', 'inspector:Data', 'inspector:Style', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/chart-contract.ts'],
    codegenEvidenceFiles: CORE_CODEGEN,
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/codegen/generator.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase8-charts.test.ts'],
    representativeProofProjectIds: ['phase16-chart'],
  },
  {
    domain: 'scene',
    phaseOwner: 'STUDIO-VISUAL-9',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Layers', 'feature-rail:Components', 'left:Layers', 'inspector:Data', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/scene-component-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase9-codegen.ts', 'lib/studio/visual/codegen/generator.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase9-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase9-scenes-components.test.ts'],
    representativeProofProjectIds: ['phase16-scene-components'],
  },
  {
    domain: 'components',
    phaseOwner: 'STUDIO-VISUAL-9',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Components', 'left:Layers', 'inspector:Data', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/scene-component-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase9-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase9-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase9-scenes-components.test.ts'],
    representativeProofProjectIds: ['phase16-scene-components'],
  },
  {
    domain: 'template',
    phaseOwner: 'STUDIO-VISUAL-9',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Components', 'left:Layers', 'inspector:Data', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/scene-component-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase9-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase9-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase9-scenes-components.test.ts'],
    representativeProofProjectIds: ['phase16-scene-components'],
  },
  {
    domain: 'assets',
    phaseOwner: 'STUDIO-VISUAL-9',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Assets', 'dock:Assets', 'inspector:Data', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/scene-component-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase9-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase9-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase9-scenes-components.test.ts'],
    representativeProofProjectIds: ['phase16-scene-components'],
  },
  {
    domain: 'image-utils',
    phaseOwner: 'STUDIO-VISUAL-10',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Images', 'inspector:Effects', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/image-utility-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase10-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase10-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase10-image-effects.test.ts'],
    representativeProofProjectIds: ['phase16-image-effects'],
  },
  {
    domain: 'animation',
    phaseOwner: 'STUDIO-VISUAL-11',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:GIF', 'context:Timeline', 'inspector:Advanced', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/gif-animation-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase11-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase11-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase11-gif-animation.test.ts'],
    representativeProofProjectIds: ['phase16-gif-animation'],
  },
  {
    domain: 'gif',
    phaseOwner: 'STUDIO-VISUAL-11',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:GIF', 'context:Timeline', 'top:Preview', 'top:Export'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/gif-animation-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase11-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase11-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase11-gif-animation.test.ts'],
    representativeProofProjectIds: ['phase16-gif-animation'],
  },
  {
    domain: 'audio',
    phaseOwner: 'STUDIO-VISUAL-12',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Audio', 'context:Timeline', 'inspector:Data', 'inspector:Advanced', 'top:Preview', 'top:Export'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/audio-authoring-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase12-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase12-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase12-audio.test.ts'],
    representativeProofProjectIds: ['phase16-audio'],
  },
  {
    domain: 'video',
    phaseOwner: 'STUDIO-VISUAL-13',
    authoringMode: 'visual-controls',
    permanentUiLocations: ['feature-rail:Video', 'context:Timeline', 'inspector:Data', 'inspector:Advanced', 'top:Preview', 'top:Export'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/video-authoring-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase13-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase13-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase13-video.test.ts'],
    representativeProofProjectIds: ['phase16-video'],
  },
  {
    domain: 'batch-chain',
    phaseOwner: 'STUDIO-VISUAL-14',
    authoringMode: 'advanced-schema',
    permanentUiLocations: ['feature-rail:Advanced', 'inspector:Advanced', 'dock:Diagnostics', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/advanced-authoring-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase14-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase14-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase14-advanced.test.ts'],
    representativeProofProjectIds: ['phase16-advanced'],
  },
  {
    domain: 'plugins',
    phaseOwner: 'STUDIO-VISUAL-14',
    authoringMode: 'advanced-schema',
    permanentUiLocations: ['feature-rail:Advanced', 'inspector:Advanced', 'dock:Diagnostics', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/advanced-authoring-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase14-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase14-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase14-advanced.test.ts'],
    representativeProofProjectIds: ['phase16-advanced'],
  },
  {
    domain: 'output',
    phaseOwner: 'STUDIO-VISUAL-14',
    authoringMode: 'advanced-schema',
    permanentUiLocations: ['top:Export', 'inspector:Advanced', 'dock:Diagnostics', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/advanced-authoring-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase14-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase14-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase14-advanced.test.ts'],
    representativeProofProjectIds: ['phase16-advanced'],
  },
  {
    domain: 'rendering',
    phaseOwner: 'STUDIO-VISUAL-14',
    authoringMode: 'advanced-schema',
    permanentUiLocations: ['feature-rail:Advanced', 'inspector:Advanced', 'dock:Diagnostics', 'top:Preview'],
    controlEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/advanced-authoring-contract.ts'],
    codegenEvidenceFiles: ['lib/studio/visual/phase14-codegen.ts'],
    previewEvidenceFiles: [COMMON_SHELL, 'lib/studio/visual/phase14-codegen.ts'],
    regressionTestFiles: ['scripts/studio/visual/phase14-advanced.test.ts'],
    representativeProofProjectIds: ['phase16-advanced'],
  },
] as const;

export const PHASE16_DOMAIN_EVIDENCE_BY_DOMAIN = new Map(
  PHASE16_DOMAIN_EVIDENCE.map((entry) => [entry.domain, entry] as const),
);

export function isAuthorableVisualClassification(
  classification: VisualCapabilityClassification,
): boolean {
  return classification !== 'hosted-runtime-exclusion' && classification !== 'not-applicable';
}

export function isAuthorableVisualCapability(row: VisualCapabilityRow): boolean {
  return isAuthorableVisualClassification(row.classification);
}

export function capabilityFromOptionId(optionId: string): string | null {
  const separator = optionId.lastIndexOf('::');
  if (separator < 0) return null;
  const memberId = optionId.slice(0, separator);
  if (!memberId.startsWith('apexify.js::')) return null;
  return memberId.slice('apexify.js::'.length).replace('#', '.');
}

export function optionFamilyRoot(optionPath: string): string {
  const normalized = optionPath.trim().replace(/^\.+/, '');
  if (!normalized) return '$root';
  const match = /^[^.[\]]+/.exec(normalized);
  return match?.[0] || '$root';
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
