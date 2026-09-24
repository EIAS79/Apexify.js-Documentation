export const PHASE18_REQUIRED_COVERAGE = [
  'canvas',
  'image-shape',
  'text-font',
  'chart',
  'path-doodle',
  'pixels-detection',
  'scene-nested-surface',
  'component',
  'template',
  'named-assets',
  'image-effects',
  'gif',
  'animation',
  'audio',
  'video',
  'batch-chain',
  'output-conversion',
  'multi-artifact-output',
  'generated-code-execution',
] as const;

export type Phase18Coverage = typeof PHASE18_REQUIRED_COVERAGE[number];

export const PHASE18_PROOF_MAP: Readonly<Record<Phase18Coverage, readonly string[]>> = {
  canvas: ['phase18-core'],
  'image-shape': ['phase18-core'],
  'text-font': ['phase18-core'],
  chart: ['phase18-core'],
  'path-doodle': ['phase18-core'],
  'pixels-detection': ['phase18-core'],
  'scene-nested-surface': ['phase18-scene'],
  component: ['phase18-component'],
  template: ['phase18-template'],
  'named-assets': ['phase18-named-asset'],
  'image-effects': ['phase18-image-effects'],
  gif: ['phase18-gif'],
  animation: ['phase18-gif'],
  audio: ['phase18-audio'],
  video: ['phase18-video'],
  'batch-chain': ['phase18-advanced-chain', 'phase18-advanced-batch'],
  'output-conversion': ['phase18-advanced-chain'],
  'multi-artifact-output': ['phase18-advanced-batch'],
  'generated-code-execution': [
    'phase18-core',
    'phase18-scene',
    'phase18-component',
    'phase18-template',
    'phase18-named-asset',
    'phase18-image-effects',
    'phase18-gif',
    'phase18-audio',
    'phase18-video',
    'phase18-advanced-chain',
    'phase18-advanced-batch',
  ],
};

export const PHASE18_REVERSIBLE_PHASES = [4, 5, 6, 7, 8] as const;

export const PHASE18_REQUIRED_SHELL_MARKERS = [
  'data-studio-visual-workspace',
  'data-feature-tool=',
  'apx-pre4-layers',
  'apx-pre4-inspector',
  'data-visual-live-code',
  'data-dock-tab=',
  'data-visual-preview-modal',
  'data-visual-code-modal',
  'data-phase15-single-file-export',
  'data-phase15-project-export',
] as const;

export const PHASE18_BROWSER_VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1100, height: 800 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
