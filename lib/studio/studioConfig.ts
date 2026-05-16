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
 *  Starter templates — keep API conservative (createCanvas only) so
 *  every template runs cleanly inside the gallery sandbox.
 * ----------------------------------------------------------------- */

export type StudioTemplate = {
  id: string;
  name: string;
  blurb: string;
  /** Tag used for grouping in the templates menu. */
  group: 'Starter' | 'Backgrounds' | 'Patterns' | 'Effects';
  ts: string;
  js: string;
};

const wrapTs = (body: string): string =>
  `import { ApexPainter } from 'apexify.js';\n\nasync function main(): Promise<Buffer> {\n  const painter = new ApexPainter();\n${body}\n}\n`;

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
    name: 'Sunset gradient',
    blurb: 'Linear sunset wash — the studio default.',
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
        { stop: 0, color: '#1a0f3d' },
        { stop: 0.55, color: '#e91e8c' },
        { stop: 1, color: '#e8941a' },
      ],
    },
  });
  return canvas.buffer;`,
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
        { stop: 0, color: '#0c0826' },
        { stop: 1, color: '#1d1750' },
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

export const STUDIO_STARTER_TEMPLATE_ID = 'gradient-sunset';
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
  { id: 'downloadOutput', label: 'Download last preview as PNG / GIF', group: 'Share', shortcut: '⌘ D' },
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
