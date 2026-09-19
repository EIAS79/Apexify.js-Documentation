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

export const STUDIO_FULL_RUNTIME_FACETS = Object.freeze([
  'createAudio',
  'video',
  'image',
  'path2d',
  'pixels',
  'detect',
  'assets',
  'components',
  'plugins',
  'output',
] as const);

const facetPatterns: Array<[RegExp, StudioCapabilityFamily, string]> = [
  [/\.\s*createAudio\b/, 'audio', 'procedural audio'],
  [/\.\s*video\b/, 'video', 'advanced video stack'],
  [/\.\s*image\b/, 'image-utils', 'image utility facade'],
  [/\.\s*path2d\b/, 'path', 'Path2D/custom path facade'],
  [/\.\s*pixels\b/, 'pixels', 'pixel manipulation facade'],
  [/\.\s*detect\b/, 'detect', 'hit detection facade'],
  [/\.\s*assets\b/, 'assets', 'named asset registry'],
  [/\.\s*components\b/, 'components', 'component layer factories'],
  [/\.\s*plugins\b/, 'plugins', 'plugin registry'],
  [/\.\s*output\b/, 'output', 'output conversion facade'],
];

const persistenceMethodLabels = Object.freeze({
  save: 'save()',
  saveMultiple: 'saveMultiple()',
  createAudioSave: 'createAudio.save()',
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
}

/**
 * Find local identifiers that are definitely ApexPainter instances.
 * Persistence blocking uses these aliases so normal application objects with a
 * save() method are not rejected by Studio.
 */
function apexPainterIdentifiers(source: string): string[] {
  const ids = new Set<string>();
  const assignment =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+ApexPainter\b/g;
  let match: RegExpExecArray | null;
  while ((match = assignment.exec(source))) ids.add(match[1]!);

  if (/\bpainter\b/.test(source)) ids.add('painter');
  return [...ids];
}

/**
 * Remove comments without treating // or /* inside quoted media URLs / text as
 * comments. Studio source commonly contains https:// URLs.
 */
function stripComments(source: string): string {
  let out = '';
  let state: 'code' | 'single' | 'double' | 'template' | 'line' | 'block' = 'code';
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const ch = source[index]!;
    const next = source[index + 1] ?? '';

    if (state === 'line') {
      if (ch === '\n' || ch === '\r') {
        state = 'code';
        out += ch;
      } else out += ' ';
      continue;
    }

    if (state === 'block') {
      if (ch === '*' && next === '/') {
        out += '  ';
        index += 1;
        state = 'code';
      } else out += ch === '\n' || ch === '\r' ? ch : ' ';
      continue;
    }

    if (state === 'single' || state === 'double' || state === 'template') {
      out += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (
        (state === 'single' && ch === "'") ||
        (state === 'double' && ch === '"') ||
        (state === 'template' && ch === '\`')
      ) state = 'code';
      continue;
    }

    if (ch === '/' && next === '/') {
      out += '  ';
      index += 1;
      state = 'line';
      continue;
    }
    if (ch === '/' && next === '*') {
      out += '  ';
      index += 1;
      state = 'block';
      continue;
    }

    if (ch === "'") state = 'single';
    else if (ch === '"') state = 'double';
    else if (ch === '\`') state = 'template';

    out += ch;
  }

  return out;
}

type BrowserGeneratedBinding = {
  name: string;
  method: 'createCanvas' | 'createImage' | 'createText' | 'createChart';
};

/**
 * Browser-direct rendering preserves createChart() buffer identity. Auxiliary
 * canvas/image/text buffers reused later as image sources need the real runtime.
 */
function browserGeneratedMediaReuse(source: string): BrowserGeneratedBinding[] {
  const bindings: BrowserGeneratedBinding[] = [];
  const assignment =
    /\b(?:const\s+|let\s+|var\s+)?([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?[A-Za-z_$][\w$]*\s*\.\s*(createCanvas|createImage|createText|createChart)\s*\(/g;

  let match: RegExpExecArray | null;
  while ((match = assignment.exec(source))) {
    const name = match[1]!;
    const method = match[2]! as BrowserGeneratedBinding['method'];
    if (method === 'createChart') continue;

    const later = source.slice(assignment.lastIndex);
    const sourceUse = new RegExp('\\bsource\\s*:\\s*' + escapeRegExp(name) + '\\b');
    if (sourceUse.test(later)) bindings.push({ name, method });
  }

  return bindings;
}

function addFamily(target: Set<StudioCapabilityFamily>, family: StudioCapabilityFamily) {
  target.add(family);
}

export function planStudioExecution(source: string): StudioExecutionPlan {
  const scanned = stripComments(source);
  const families = new Set<StudioCapabilityFamily>();
  const reasons: string[] = [];
  const hostPersistenceOnly: string[] = [];
  let needsFullRuntime = false;

  for (const id of apexPainterIdentifiers(scanned)) {
    const escaped = escapeRegExp(id);
    const checks: Array<[RegExp, string]> = [
      [new RegExp('\\b' + escaped + '\\s*\\.\\s*save\\s*\\('), persistenceMethodLabels.save],
      [new RegExp('\\b' + escaped + '\\s*\\.\\s*saveMultiple\\s*\\('), persistenceMethodLabels.saveMultiple],
      [new RegExp('\\b' + escaped + '\\s*\\.\\s*createAudio\\s*\\.\\s*save\\s*\\('), persistenceMethodLabels.createAudioSave],
    ];
    for (const [pattern, label] of checks) {
      if (pattern.test(scanned)) {
        hostPersistenceOnly.push(label);
        addFamily(families, 'host-persistence');
      }
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

  const generatedReuse = browserGeneratedMediaReuse(scanned);
  if (generatedReuse.length) {
    needsFullRuntime = true;
    for (const binding of generatedReuse) {
      reasons.push(
        binding.method +
          '() output "' +
          binding.name +
          '" is reused as a media source and requires the full Apexify runtime to preserve buffer identity.',
      );
    }
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
