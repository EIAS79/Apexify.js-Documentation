/**
 * Studio configuration: types, persistence keys, starter templates, and the
 * canonical action ids used by the command palette + shortcut overlay.
 */

export const STUDIO_STORAGE_KEY = 'apexify-studio-v2';
export const STUDIO_LEGACY_STORAGE_KEY = 'apexify-studio-v1';
export const STUDIO_HISTORY_KEY = 'apexify-studio-history-v1';
export const STUDIO_INCOMING_SNIPPET_KEY = 'apexify-studio-incoming';
export const STUDIO_SHARE_HASH = '#snippet=';

export type StudioLang = 'ts' | 'js';
export type LayoutMode = 'code' | 'split' | 'media';

export type StudioBuffer = {
  id: string;
  name: string;
  ts: string;
  js: string;
};

export type PersistedStudio = {
  buffers?: StudioBuffer[];
  activeBufferId?: string;
  lang?: StudioLang;
  layout?: LayoutMode;
  autoRun?: boolean;
  splitRatio?: number;
};

export type RunHistoryEntry = {
  id: string;
  bufferId: string;
  bufferName: string;
  lang: StudioLang;
  ok: boolean;
  elapsedMs: number | null;
  exitCode: number | null;
  error: string | null;
  thumbDataUrl: string | null;
  mime: string | null;
  ts: number;
  snippet: string;
};

/* ----------------------------------------------------------------- *
 *  Studio templates. Browser-direct templates intentionally exercise the
 *  current Live Canvas contract; advanced media templates can route to the
 *  full Apexify runtime automatically.
 * ----------------------------------------------------------------- */

export type StudioTemplate = {
  id: string;
  name: string;
  blurb: string;
  /** Tag used for grouping in the templates menu. */
  group: 'Starter' | 'Charts' | 'Backgrounds' | 'Patterns' | 'Effects' | 'Media';
  ts: string;
  js: string;
};

const wrapTs = (body: string): string =>
  `import { ApexPainter } from 'apexify.js';\n\nasync function main(): Promise<unknown> {\n  const painter = new ApexPainter();\n${body}\n}\n`;

const wrapJs = (body: string): string =>
  `import { ApexPainter } from 'apexify.js';\n\nasync function main() {\n  const painter = new ApexPainter();\n${body}\n}\n`;

/**
 * Build a studio handoff payload from documentation code fences.
 * Returns `null` for non-executable languages (bash, json, …).
 */
export function composeStudioSnippetFromDocs(
  raw: string,
  prismLang: string
): { name: string; ts: string; js: string; lang: StudioLang } | null {
  const L = prismLang.toLowerCase();
  const lang: StudioLang | null =
    L === 'ts' || L === 'tsx' || L === 'typescript' ? 'ts'
    : L === 'js' || L === 'jsx' || L === 'javascript' ? 'js'
    : null;
  if (!lang) return null;

  const trimmed = raw.trim();
  const apexImport = /import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"]/;
  const hasMain = /\basync\s+function\s+main\s*\(/.test(trimmed);
  const complete = apexImport.test(trimmed) && hasMain;

  const name = 'Documentation example';

  if (complete) {
    return lang === 'js'
      ? { name, ts: '', js: trimmed, lang: 'js' }
      : { name, ts: trimmed, js: '', lang: 'ts' };
  }

  const body = trimmed
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

  return lang === 'js'
    ? { name, ts: '', js: wrapJs(body), lang: 'js' }
    : { name, ts: wrapTs(body), js: '', lang: 'ts' };
}

const TEMPLATE_BODIES: Array<Pick<StudioTemplate, 'id' | 'name' | 'blurb' | 'group'> & { body: string }> = [
  {
    id: 'gradient-sunset',
    name: 'Slate / cobalt',
    blurb: 'Calm Studio starter aligned with the current Apexify.js product surfaces.',
    group: 'Starter',
    body: `  const canvas = await painter.createCanvas({
    width: 960,
    height: 540,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 960,
      endY: 540,
      rotate: 32,
      colors: [
        { stop: 0, color: '#0d1118' },
        { stop: 0.58, color: '#17213a' },
        { stop: 1, color: '#5269dc' },
      ],
    },
  });
  return canvas.buffer;`,
  },
  {
    id: 'editorial-card',
    name: 'Editorial system card',
    blurb: 'Canvas + geometric shapes + typography in one composition.',
    group: 'Starter',
    body: `  const canvas = await painter.createCanvas({
    width: 960,
    height: 540,
    colorBg: '#0d1118',
  });

  let output = await painter.createImage([
    {
      source: 'rectangle',
      x: 56, y: 54, width: 848, height: 432,
      borderRadius: 30,
      shape: { fill: true, color: '#151c29' },
      stroke: { color: '#2a3546', width: 2 },
    },
    {
      source: 'circle',
      x: 680, y: 84, width: 170, height: 170,
      shape: { fill: true, color: '#6f86ff' },
    },
    {
      source: 'rectangle',
      x: 82, y: 398, width: 290, height: 12,
      borderRadius: 6,
      shape: { fill: true, color: '#7db8b0' },
    },
  ], canvas);

  output = await painter.createText([
    {
      text: 'APEXIFY / LIVE',
      x: 82, y: 112,
      font: { size: 20, family: 'Arial' },
      fill: { color: '#9dd2ca' },
    },
    {
      text: 'Visual systems',
      x: 82, y: 220,
      font: { size: 72, family: 'Arial' },
      fill: { color: '#eef2f6' },
    },
    {
      text: 'from code.',
      x: 82, y: 302,
      font: { size: 64, family: 'Arial' },
      fill: { color: '#8ea2ff' },
    },
    {
      text: 'Canvas · shape · type',
      x: 82, y: 448,
      font: { size: 20, family: 'Arial' },
      fill: { color: '#b8c2cf' },
    },
  ], output);

  return output;`,
  },
  {
    id: 'integration-showcase',
    name: 'Canvas · URL · chart · text',
    blurb: 'Generated chart-buffer reuse, remote images, shapes, and fitted typography in one real Apexify composition.',
    group: 'Charts',
    body: `  const canvas = await painter.createCanvas({
    width: 1200,
    height: 720,
    gradientBg: {
      type: 'linear',
      startX: 0, startY: 0,
      endX: 1200, endY: 720,
      colors: [
        { stop: 0, color: '#07111f' },
        { stop: 0.48, color: '#101b34' },
        { stop: 1, color: '#1d335d' },
      ],
    },
    patternBg: {
      type: 'dots',
      color: 'rgba(226,232,240,0.08)',
      secondaryColor: 'rgba(96,165,250,0.08)',
      size: 3,
      spacing: 26,
      opacity: 0.32,
    },
    noiseBg: { intensity: 0.025 },
  });

  const chartBuf = await painter.createChart('bar', [
    { label: 'Canvas', value: 96, xStart: 0, xEnd: 1, color: '#60a5fa' },
    { label: 'Images', value: 92, xStart: 1, xEnd: 2, color: '#818cf8' },
    { label: 'Shapes', value: 94, xStart: 2, xEnd: 3, color: '#34d399' },
    { label: 'Text', value: 98, xStart: 3, xEnd: 4, color: '#f59e0b' },
  ], {
    type: 'standard',
    dimensions: { width: 390, height: 240, padding: { top: 36, right: 24, bottom: 44, left: 42 } },
    appearance: { backgroundColor: '#0b1427' },
    labels: { title: { text: 'Feature coverage', color: '#e2e8f0', fontSize: 18 } },
  });

  let output = await painter.createImage([
    {
      source: 'rectangle',
      x: 54, y: 150, width: 560, height: 430,
      borderRadius: 28,
      shape: { fill: true, color: 'rgba(15,23,42,0.82)' },
      stroke: { width: 2, color: 'rgba(255,255,255,0.16)', borderRadius: 28 },
      shadow: { color: 'rgba(0,0,0,0.44)', offsetY: 20, blur: 38, opacity: 1, borderRadius: 28 },
    },
    {
      source: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
      x: 78, y: 174, width: 512, height: 292,
      fit: 'cover',
      align: 'center',
      borderRadius: 22,
      stroke: { width: 2, color: 'rgba(255,255,255,0.24)' },
      shadow: { color: 'rgba(0,0,0,0.34)', offsetY: 14, blur: 24, opacity: 1 },
    },
    {
      source: 'rectangle',
      x: 660, y: 150, width: 486, height: 430,
      borderRadius: 28,
      shape: { fill: true, color: 'rgba(15,23,42,0.90)' },
      stroke: { width: 2, color: 'rgba(255,255,255,0.14)', borderRadius: 28 },
    },
    {
      source: chartBuf,
      x: 708, y: 206, width: 390, height: 240,
      borderRadius: 18,
      shadow: { color: 'rgba(0,0,0,0.35)', offsetY: 12, blur: 24, opacity: 1 },
    },
    {
      source: 'star',
      x: 82, y: 82, width: 86, height: 86, rotation: -10,
      shape: { fill: true, color: '#fde047', innerRadius: 17, outerRadius: 39 },
      stroke: { width: 2, color: '#713f12' },
    },
    {
      source: 'circle',
      x: 1042, y: 82, width: 104, height: 104,
      shape: { fill: true, color: '#14e5a4', radius: 52 },
    },
  ], canvas);

  output = await painter.createText([
    {
      text: 'Apexify.js integration',
      x: 194, y: 58,
      font: { family: 'Arial', size: 34 },
      bold: true,
      fill: { color: '#f8fafc' },
      textBaseline: 'middle',
    },
    {
      text: 'Canvas · URL image · generated chart · shapes · text',
      x: 194, y: 94,
      font: { family: 'Arial', size: 16 },
      fill: { color: '#a9b8cf' },
      textBaseline: 'middle',
    },
    {
      text: 'Remote image layer',
      x: 82, y: 506,
      font: { family: 'Arial', size: 20 },
      bold: true,
      fill: { color: '#f8fafc' },
    },
    {
      text: 'Public HTTPS source with crop, radius, stroke, and shadow.',
      x: 82, y: 538,
      font: { family: 'Arial', size: 14 },
      fill: { color: '#cbd5e1' },
      maxWidth: 460,
    },
    {
      text: 'Generated chart buffer',
      x: 708, y: 490,
      font: { family: 'Arial', size: 20 },
      bold: true,
      fill: { color: '#f8fafc' },
    },
    {
      text: 'The chart output is reused by createImage() in the same program.',
      x: 708, y: 522,
      font: { family: 'Arial', size: 14 },
      fill: { color: '#cbd5e1' },
      maxWidth: 390,
    },
    {
      text: 'One composition · real Apexify data flow',
      x: 1146, y: 676,
      font: { family: 'Arial', size: 14 },
      fill: { color: '#94a3b8' },
      textAlign: 'right',
    },
  ], output);

  return output;`,
  },
  {
    id: 'gif-motion-card',
    name: 'GIF · motion card',
    blurb: 'Two rendered Apexify frames encoded into a looping GIF and previewed directly in Studio.',
    group: 'Media',
    body: `  const first = await painter.createCanvas({
    width: 640,
    height: 360,
    gradientBg: {
      type: 'linear',
      startX: 0, startY: 0,
      endX: 640, endY: 360,
      colors: [
        { stop: 0, color: '#0b1020' },
        { stop: 1, color: '#2444a8' },
      ],
    },
  });

  const second = await painter.createCanvas({
    width: 640,
    height: 360,
    gradientBg: {
      type: 'linear',
      startX: 0, startY: 0,
      endX: 640, endY: 360,
      colors: [
        { stop: 0, color: '#241238' },
        { stop: 1, color: '#a12f88' },
      ],
    },
  });

  const frameA = await painter.createText({
    text: 'APEXIFY / FRAME 01',
    x: 320, y: 180,
    font: { family: 'Arial', size: 34 },
    bold: true,
    fill: { color: '#f8fafc' },
    textAlign: 'center',
    textBaseline: 'middle',
  }, first);

  const frameB = await painter.createText({
    text: 'APEXIFY / FRAME 02',
    x: 320, y: 180,
    font: { family: 'Arial', size: 34 },
    bold: true,
    fill: { color: '#f8fafc' },
    textAlign: 'center',
    textBaseline: 'middle',
  }, second);

  return painter.createGIF([
    { buffer: frameA, duration: 420 },
    { buffer: frameB, duration: 420 },
  ], {
    outputFormat: 'buffer',
    width: 640,
    height: 360,
    repeat: 0,
    quality: 10,
    delay: 420,
  });`,
  },
  {
    id: 'audio-preset',
    name: 'Audio · procedural preset',
    blurb: 'Generate a WAV sound entirely from Apexify.js and play it in the Studio audio preview.',
    group: 'Media',
    body: `  return painter.createAudio.preset('laser', {
    volume: 0.72,
    transpose: -2,
  });`,
  },
  {
    id: 'video-from-frames',
    name: 'Video · frames to MP4',
    blurb: 'Create two rendered frames and encode them into MP4 through the full Apexify video runtime.',
    group: 'Media',
    body: `  const first = await painter.createCanvas({
    width: 640,
    height: 360,
    colorBg: '#0b1020',
  });
  const second = await painter.createCanvas({
    width: 640,
    height: 360,
    colorBg: '#162b5f',
  });

  const frameA = await painter.createText({
    text: 'FRAME 01',
    x: 320, y: 180,
    font: { family: 'Arial', size: 48 },
    bold: true,
    fill: { color: '#f8fafc' },
    textAlign: 'center',
    textBaseline: 'middle',
  }, first);

  const frameB = await painter.createText({
    text: 'FRAME 02',
    x: 320, y: 180,
    font: { family: 'Arial', size: 48 },
    bold: true,
    fill: { color: '#67e8f9' },
    textAlign: 'center',
    textBaseline: 'middle',
  }, second);

  return painter.createVideo({
    source: frameA,
    createFromFrames: {
      frames: [frameA, frameB, frameA, frameB],
      outputPath: 'studio-video.mp4',
      fps: 2,
      format: 'mp4',
      quality: 'medium',
    },
  });`,
  },
  {
    id: 'aurora-iris',
    name: 'Aurora · iris',
    blurb: 'Indigo base with a layered iris/magenta sweep.',
    group: 'Backgrounds',
    body: `  const canvas = await painter.createCanvas({
    width: 960,
    height: 540,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 960,
      endY: 540,
      colors: [
        { stop: 0, color: '#07051a' },
        { stop: 1, color: '#15103a' },
      ],
    },
    bgLayers: [
      {
        type: 'gradient',
        opacity: 0.85,
        blendMode: 'screen',
        value: {
          type: 'radial',
          startX: 220,
          startY: 180,
          startRadius: 0,
          endX: 220,
          endY: 180,
          endRadius: 520,
          colors: [
            { stop: 0, color: 'rgba(123, 108, 255, 0.85)' },
            { stop: 1, color: 'rgba(123, 108, 255, 0)' },
          ],
        },
      },
      {
        type: 'gradient',
        opacity: 0.85,
        blendMode: 'screen',
        value: {
          type: 'radial',
          startX: 760,
          startY: 380,
          startRadius: 0,
          endX: 760,
          endY: 380,
          endRadius: 540,
          colors: [
            { stop: 0, color: 'rgba(255, 61, 170, 0.7)' },
            { stop: 1, color: 'rgba(255, 61, 170, 0)' },
          ],
        },
      },
    ],
    noiseBg: { intensity: 0.04 },
  });
  return canvas.buffer;`,
  },
  {
    id: 'grid-mesh',
    name: 'Indigo grid',
    blurb: 'Slate gradient with a soft-light grid overlay.',
    group: 'Patterns',
    body: `  const canvas = await painter.createCanvas({
    width: 960,
    height: 540,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 960,
      endY: 540,
      colors: [
        { stop: 0, color: '#0d1118' },
        { stop: 1, color: '#26344f' },
      ],
    },
    bgLayers: [
      {
        type: 'presetPattern',
        opacity: 0.85,
        blendMode: 'soft-light',
        pattern: {
          type: 'grid',
          color: 'rgba(123, 108, 255, 0.45)',
          secondaryColor: 'rgba(255, 61, 170, 0.22)',
          size: 6,
          spacing: 24,
          opacity: 0.9,
        },
      },
    ],
  });
  return canvas.buffer;`,
  },
  {
    id: 'dot-cloud',
    name: 'Dot cloud',
    blurb: 'Twilight gradient + multiplied dot pattern.',
    group: 'Patterns',
    body: `  const canvas = await painter.createCanvas({
    width: 960,
    height: 540,
    transparentBase: true,
    bgLayers: [
      {
        type: 'gradient',
        opacity: 1,
        value: {
          type: 'linear',
          startX: 0,
          startY: 0,
          endX: 960,
          endY: 540,
          colors: [
            { stop: 0, color: '#07051a' },
            { stop: 0.6, color: '#1d1750' },
            { stop: 1, color: '#e91e8c' },
          ],
        },
      },
      {
        type: 'presetPattern',
        opacity: 1,
        blendMode: 'multiply',
        pattern: {
          type: 'dots',
          color: 'rgba(255, 217, 152, 0.55)',
          size: 8,
          spacing: 20,
          opacity: 1,
        },
      },
    ],
    noiseBg: { intensity: 0.04 },
  });
  return canvas.buffer;`,
  },
  {
    id: 'ember-radial',
    name: 'Ember bloom',
    blurb: 'Warm radial bloom + grain.',
    group: 'Backgrounds',
    body: `  const canvas = await painter.createCanvas({
    width: 960,
    height: 540,
    gradientBg: {
      type: 'radial',
      startX: 480,
      startY: 270,
      startRadius: 0,
      endX: 480,
      endY: 270,
      endRadius: 620,
      colors: [
        { stop: 0, color: '#ffd86e' },
        { stop: 0.45, color: '#e8941a' },
        { stop: 1, color: '#1a0f3d' },
      ],
    },
    noiseBg: { intensity: 0.06 },
  });
  return canvas.buffer;`,
  },
  {
    id: 'framed-card',
    name: 'Framed card',
    blurb: 'Rounded canvas with sunset border + drop shadow.',
    group: 'Effects',
    body: `  const canvas = await painter.createCanvas({
    width: 960,
    height: 540,
    borderRadius: 28,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 960,
      endY: 540,
      colors: [
        { stop: 0, color: '#150f3a' },
        { stop: 1, color: '#4f3fff' },
      ],
    },
    canvasStroke: {
      color: '#ff3daa',
      width: 4,
    },
    canvasShadow: {
      color: 'rgba(233, 30, 140, 0.45)',
      blur: 36,
      offsetX: 0,
      offsetY: 14,
    },
  });
  return canvas.buffer;`,
  },
];

export const STUDIO_TEMPLATES: StudioTemplate[] = TEMPLATE_BODIES.map((t) => ({
  id: t.id,
  name: t.name,
  blurb: t.blurb,
  group: t.group,
  ts: wrapTs(t.body),
  js: wrapJs(t.body),
}));

export const STUDIO_STARTER_TEMPLATE_ID = 'editorial-card';
export const STUDIO_STARTER_TEMPLATE = STUDIO_TEMPLATES.find((t) => t.id === STUDIO_STARTER_TEMPLATE_ID)!;
export const STUDIO_STARTER_TS = STUDIO_STARTER_TEMPLATE.ts;
export const STUDIO_STARTER_JS = STUDIO_STARTER_TEMPLATE.js;

/* ----------------------------------------------------------------- *
 *  Command-palette action ids (single source of truth)
 * ----------------------------------------------------------------- */

export type StudioActionId =
  | 'run'
  | 'reset'
  | 'newBuffer'
  | 'closeBuffer'
  | 'renameBuffer'
  | 'duplicateBuffer'
  | 'toggleAutoRun'
  | 'toggleLang'
  | 'layoutCode'
  | 'layoutSplit'
  | 'layoutMedia'
  | 'copyCode'
  | 'copyShareLink'
  | 'downloadOutput'
  | 'openShortcuts'
  | 'gotoGallery'
  | 'gotoDocs'
  | 'clearHistory';

export type StudioAction = {
  id: StudioActionId;
  label: string;
  group: 'Run' | 'Layout' | 'Buffer' | 'Share' | 'Navigate';
  shortcut?: string;
  /** Optional secondary keywords for fuzzy search. */
  keywords?: string;
};

export const STUDIO_ACTIONS: StudioAction[] = [
  { id: 'run', label: 'Run snippet', group: 'Run', shortcut: '⌘ ↵', keywords: 'execute build render preview' },
  { id: 'reset', label: 'Reset to starter snippet', group: 'Run', keywords: 'restore default sample' },
  { id: 'toggleAutoRun', label: 'Toggle auto-run on edit', group: 'Run', keywords: 'live debounce auto' },
  { id: 'toggleLang', label: 'Switch TypeScript / JavaScript', group: 'Run', shortcut: '⌘ L', keywords: 'ts js language' },

  { id: 'layoutCode', label: 'Layout · Code only', group: 'Layout', shortcut: '⌘ 1' },
  { id: 'layoutSplit', label: 'Layout · Split (code + preview)', group: 'Layout', shortcut: '⌘ 2' },
  { id: 'layoutMedia', label: 'Layout · Preview only', group: 'Layout', shortcut: '⌘ 3' },

  { id: 'newBuffer', label: 'New tab (blank snippet)', group: 'Buffer', shortcut: '⌘ T' },
  { id: 'duplicateBuffer', label: 'Duplicate active tab', group: 'Buffer', keywords: 'copy clone' },
  { id: 'renameBuffer', label: 'Rename active tab', group: 'Buffer' },
  { id: 'closeBuffer', label: 'Close active tab', group: 'Buffer', shortcut: '⌘ W' },

  { id: 'copyCode', label: 'Copy active snippet', group: 'Share', shortcut: '⌘ C', keywords: 'clipboard' },
  { id: 'copyShareLink', label: 'Copy share link (encoded snippet)', group: 'Share', shortcut: '⌘ S', keywords: 'url permalink' },
  { id: 'downloadOutput', label: 'Download active output artifact', group: 'Share', shortcut: '⌘ D', keywords: 'image gif audio video media export' },
  { id: 'clearHistory', label: 'Clear run history', group: 'Share' },

  { id: 'openShortcuts', label: 'Show keyboard shortcuts', group: 'Navigate', shortcut: '?' },
  { id: 'gotoGallery', label: 'Open gallery', group: 'Navigate' },
  { id: 'gotoDocs', label: 'Open docs', group: 'Navigate' },
];

/* ----------------------------------------------------------------- *
 *  Buffer helpers
 * ----------------------------------------------------------------- */

export function makeId(prefix = 'buf'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultBuffer(): StudioBuffer {
  return {
    id: makeId(),
    name: 'Sketch',
    ts: STUDIO_STARTER_TS,
    js: STUDIO_STARTER_JS,
  };
}

export function createBlankBuffer(name = 'Untitled'): StudioBuffer {
  return {
    id: makeId(),
    name,
    ts: wrapTs(`  const canvas = await painter.createCanvas({\n    width: 640,\n    height: 360,\n    gradientBg: {\n      type: 'linear',\n      startX: 0, startY: 0, endX: 640, endY: 360,\n      colors: [\n        { stop: 0, color: '#0c0826' },\n        { stop: 1, color: '#1d1750' },\n      ],\n    },\n  });\n  return canvas.buffer;`),
    js: wrapJs(`  const canvas = await painter.createCanvas({\n    width: 640,\n    height: 360,\n    gradientBg: {\n      type: 'linear',\n      startX: 0, startY: 0, endX: 640, endY: 360,\n      colors: [\n        { stop: 0, color: '#0c0826' },\n        { stop: 1, color: '#1d1750' },\n      ],\n    },\n  });\n  return canvas.buffer;`),
  };
}

export function bufferFromTemplate(template: StudioTemplate, name?: string): StudioBuffer {
  return {
    id: makeId(),
    name: name ?? template.name,
    ts: template.ts,
    js: template.js,
  };
}
