export type StudioExecutionBackend = 'browser' | 'full-runtime';

export type StudioCapabilityFamily =
  | 'canvas'
  | 'image'
  | 'text'
  | 'chart'
  | 'scene'
  | 'template'
  | 'assets'
  | 'components'
  | 'image-utils'
  | 'path'
  | 'pixels'
  | 'detect'
  | 'gif'
  | 'animation'
  | 'audio'
  | 'video'
  | 'batch'
  | 'plugins'
  | 'output'
  | 'host-persistence';

export type StudioExecutionPlan = {
  backend: StudioExecutionBackend;
  families: StudioCapabilityFamily[];
  reasons: string[];
  hostPersistenceOnly: string[];
};

const browserMethods = new Map<string, StudioCapabilityFamily>([
  ['createCanvas', 'canvas'],
  ['createImage', 'image'],
  ['createText', 'text'],
  ['createChart', 'chart'],
]);

const fullMethods = new Map<string, StudioCapabilityFamily>([
  ['measureText', 'text'],
  ['createComparisonChart', 'chart'],
  ['createComboChart', 'chart'],
  ['createScene', 'scene'],
  ['renderScene', 'scene'],
  ['validateSceneRenderInput', 'scene'],
  ['renderSceneToGIF', 'gif'],
  ['renderSceneToVideoFrames', 'video'],
  ['createTemplate', 'template'],
  ['prepareForRender', 'assets'],
  ['createGIF', 'gif'],
  ['animate', 'animation'],
  ['createVideo', 'video'],
  ['videoPipeline', 'video'],
  ['getVideoInfo', 'video'],
  ['extractFrames', 'video'],
  ['extractAllFrames', 'video'],
  ['extractFrameAtTime', 'video'],
  ['extractFrameByNumber', 'video'],
  ['extractMultipleFrames', 'video'],
  ['batch', 'batch'],
  ['chain', 'batch'],
  ['use', 'plugins'],
  ['toOutput', 'output'],
  ['outPut', 'output'],
]);

const facetPatterns: Array<[RegExp, StudioCapabilityFamily, string]> = [
  [/\bpainter\s*\.\s*createAudio\b/, 'audio', 'procedural audio'],
  [/\bpainter\s*\.\s*video\b/, 'video', 'advanced video stack'],
  [/\bpainter\s*\.\s*image\b/, 'image-utils', 'image utility facade'],
  [/\bpainter\s*\.\s*path2d\b/, 'path', 'Path2D/custom path facade'],
  [/\bpainter\s*\.\s*pixels\b/, 'pixels', 'pixel manipulation facade'],
  [/\bpainter\s*\.\s*detect\b/, 'detect', 'hit detection facade'],
  [/\bpainter\s*\.\s*assets\b/, 'assets', 'named asset registry'],
  [/\bpainter\s*\.\s*components\b/, 'components', 'component layer factories'],
  [/\bpainter\s*\.\s*plugins\b/, 'plugins', 'plugin registry'],
  [/\bpainter\s*\.\s*output\b/, 'output', 'output conversion facade'],
];

const persistencePatterns: Array<[RegExp, string]> = [
  [/\bpainter\s*\.\s*save\s*\(/, 'save()'],
  [/\bpainter\s*\.\s*saveMultiple\s*\(/, 'saveMultiple()'],
  [/\bpainter\s*\.\s*createAudio\s*\.\s*save\s*\(/, 'createAudio.save()'],
];

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n\r]*/g, ' ');
}

function addFamily(target: Set<StudioCapabilityFamily>, family: StudioCapabilityFamily) {
  target.add(family);
}

export function planStudioExecution(
  source: string,
  { hasAssets = false }: { hasAssets?: boolean } = {},
): StudioExecutionPlan {
  const scanned = stripComments(source);
  const families = new Set<StudioCapabilityFamily>();
  const reasons: string[] = [];
  const hostPersistenceOnly: string[] = [];
  let needsFullRuntime = false;

  if (hasAssets) {
    needsFullRuntime = true;
    addFamily(families, 'assets');
    reasons.push('Uploaded Studio assets are materialized by the full Apexify runtime.');
  }

  for (const [pattern, label] of persistencePatterns) {
    if (pattern.test(scanned)) {
      hostPersistenceOnly.push(label);
      addFamily(families, 'host-persistence');
    }
  }

  for (const [method, family] of browserMethods) {
    const re = new RegExp('\\.\\s*' + method + '\\s*\\(', 'g');
    if (re.test(scanned)) addFamily(families, family);
  }

  for (const [method, family] of fullMethods) {
    const re = new RegExp('\\.\\s*' + method + '\\s*\\(', 'g');
    if (!re.test(scanned)) continue;
    addFamily(families, family);
    needsFullRuntime = true;
    reasons.push(method + '() requires the full Apexify runtime in the current Studio implementation.');
  }

  for (const [pattern, family, reason] of facetPatterns) {
    if (!pattern.test(scanned)) continue;
    addFamily(families, family);
    needsFullRuntime = true;
    reasons.push(reason + ' requires the full Apexify runtime in the current Studio implementation.');
  }

  // Imports beyond apexify.js are a full-runtime concern. The browser compatibility
  // renderer intentionally does not execute arbitrary modules.
  const nonApexImport = /\b(?:import\s+(?:[^'"]+\s+from\s+)?|require\s*\()\s*['"](?!apexify\.js['"])[^'"]+['"]/;
  if (nonApexImport.test(scanned)) {
    needsFullRuntime = true;
    reasons.push('The snippet imports a module that is not executed by the browser compatibility renderer.');
  }

  if (hostPersistenceOnly.length) {
    reasons.push(
      'Host persistence calls are outside the Studio product contract. Return the generated artifact instead of saving it to the host filesystem.',
    );
  }

  return {
    backend: needsFullRuntime ? 'full-runtime' : 'browser',
    families: [...families],
    reasons: [...new Set(reasons)],
    hostPersistenceOnly: [...new Set(hostPersistenceOnly)],
  };
}

export const STUDIO_BROWSER_DIRECT_METHODS = Object.freeze([...browserMethods.keys()]);
export const STUDIO_FULL_RUNTIME_METHODS = Object.freeze([...fullMethods.keys()]);
