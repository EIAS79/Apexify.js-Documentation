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
  canvas: ['phase16-canvas'],
  'image-shape': ['phase16-image'],
  'text-font': ['phase16-text'],
  chart: ['phase16-chart'],
  'path-doodle': ['phase16-path-pixels-detect'],
  'pixels-detection': ['phase16-path-pixels-detect'],
  'scene-nested-surface': ['phase16-scene-components'],
  component: ['phase16-scene-components'],
  template: ['phase16-scene-components'],
  'named-assets': ['phase16-scene-components'],
  'image-effects': ['phase16-image-effects'],
  gif: ['phase16-gif-animation'],
  animation: ['phase16-gif-animation'],
  audio: ['phase16-audio'],
  video: ['phase16-video'],
  'batch-chain': ['phase16-advanced'],
  'output-conversion': ['phase16-advanced'],
  'multi-artifact-output': ['phase16-advanced'],
  'generated-code-execution': [
    'phase16-canvas',
    'phase16-image',
    'phase16-text',
    'phase16-path-pixels-detect',
    'phase16-chart',
    'phase16-scene-components',
    'phase16-image-effects',
    'phase16-gif-animation',
    'phase16-audio',
    'phase16-video',
    'phase16-advanced',
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
