import type { VisualProject } from './model';
import {
  materializePhase9Project,
  phase9RootSceneDefinition,
  resolvePhase9References,
} from './scene-component-contract';
import {
  hasPhase11Authoring,
  phase11ExpandedFrames,
  phase11Timeline,
  type Phase11Frame,
  type Phase11Timeline,
} from './gif-animation-contract';

export const PHASE11_SOURCE_MARKER = 'apexify-studio-v11:';

function semanticPayload(project: VisualProject) {
  return encodeURIComponent(JSON.stringify(project)).replace(/\*/g, '%2A');
}

function emitString(value: string) {
  return JSON.stringify(value);
}

function emitValue(value: unknown, indent = 0): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return emitString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const body = value
      .map((item) => ' '.repeat(indent + 2) + emitValue(item, indent + 2))
      .join(',\n');
    return '[\n' + body + ',\n' + ' '.repeat(indent) + ']';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined);
    if (!entries.length) return '{}';
    const body = entries
      .map(([key, item]) =>
        ' '.repeat(indent + 2) +
        (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)) +
        ': ' +
        emitValue(item, indent + 2),
      )
      .join(',\n');
    return '{\n' + body + ',\n' + ' '.repeat(indent) + '}';
  }
  throw new Error('Unsupported Phase 11 code value: ' + String(value));
}

function gifOptions(timeline: Phase11Timeline) {
  return {
    outputFormat: 'buffer',
    width: timeline.width,
    height: timeline.height,
    repeat: timeline.repeat,
    quality: timeline.quality,
    delay: timeline.delay,
  };
}

function gifInputFrame(frame: Phase11Frame) {
  return {
    buffer: frame.source,
    duration: frame.duration,
    dispose: frame.dispose,
    transparentColor: frame.transparentColor,
  };
}

function animateFrame(frame: Phase11Frame, timeline: Phase11Timeline) {
  return {
    ...(frame.source ? { source: frame.source } : {}),
    ...(frame.backgroundColor ? { backgroundColor: frame.backgroundColor } : {}),
    duration: frame.duration ?? timeline.delay,
    width: timeline.width,
    height: timeline.height,
    ...(frame.blendMode ? { blendMode: frame.blendMode } : {}),
    ...(frame.transformations ? { transformations: frame.transformations } : {}),
  };
}

function resolvedSceneProject(project: VisualProject) {
  return resolvePhase9References(materializePhase9Project(project));
}

function generatedBody(project: VisualProject, timeline: Phase11Timeline) {
  const frames = phase11ExpandedFrames(timeline);
  const lines: string[] = [
    "import { ApexPainter } from 'apexify.js';",
    '',
    'const painter = new ApexPainter();',
    '',
    'async function main() {',
  ];

  if (timeline.mode === 'animate') {
    lines.push(
      '  const animationFrames = ' +
        emitValue(frames.map((frame) => animateFrame(frame, timeline)), 2).replace(/\n/g, '\n  ') +
        ';',
      '  const renderedFrames = await painter.animate(',
      '    animationFrames,',
      '    ' + String(timeline.delay) + ',',
      '    ' + String(timeline.width) + ',',
      '    ' + String(timeline.height) + ',',
      '    undefined,',
      '    { resolveAssetRefs: true },',
      '  );',
      "  if (!renderedFrames?.length) throw new Error('Apexify animate() produced no frames.');",
      '  const gif = await painter.createGIF(',
      '    renderedFrames.map((buffer, index) => ({',
      '      buffer,',
      '      duration: animationFrames[index]?.duration ?? ' + String(timeline.delay) + ',',
      '    })),',
      '    ' + emitValue(gifOptions(timeline), 4).replace(/\n/g, '\n    ') + ',',
      '  );',
    );
  } else if (timeline.mode === 'scene-gif') {
    const sceneProject = resolvedSceneProject(project);
    const scene = phase9RootSceneDefinition(sceneProject);
    // Scene GIF accepts per-frame repeat natively. Keep the authored repeat
    // visible in generated code so edits in Live Code can round-trip back to
    // the Visual timeline without expanding one frame into duplicate rows.
    const sceneFrames = timeline.frames.map((frame) => ({
      ...gifInputFrame(frame),
      repeat: Math.max(1, Math.round(frame.repeat ?? 1)),
    }));
    lines.push(
      '  const scene = ' + emitValue(scene, 2).replace(/\n/g, '\n  ') + ';',
      '  const gif = await painter.renderSceneToGIF(',
      '    scene,',
      '    {',
      '      options: ' + emitValue(gifOptions(timeline), 6).replace(/\n/g, '\n      ') + ',',
      '      gifFrames: ' + emitValue(sceneFrames, 6).replace(/\n/g, '\n      ') + ',',
      '      prependComposedRaster: ' + String(timeline.scene?.prependComposedRaster !== false) + ',',
      '      composedFrameDuration: ' + String(timeline.scene?.composedFrameDuration ?? timeline.delay) + ',',
      '      composedFrameRepeat: ' + String(timeline.scene?.composedFrameRepeat ?? 1) + ',',
      '      sceneRender: { resolveAssetRefs: true },',
      '    },',
      '  );',
    );
  } else {
    lines.push(
      '  const gifFrames = ' +
        emitValue(frames.map(gifInputFrame), 2).replace(/\n/g, '\n  ') +
        ';',
      '  const gif = await painter.createGIF(',
      '    gifFrames,',
      '    ' + emitValue(gifOptions(timeline), 4).replace(/\n/g, '\n    ') + ',',
      '    { resolveAssetRefs: true },',
      '  );',
    );
  }

  lines.push(
    "  if (!(gif instanceof Uint8Array)) throw new Error('Expected GIF buffer output.');",
    '  return gif;',
    '}',
    '',
    'return await main();',
    '',
  );
  return lines.join('\n');
}

export function phase11ProjectFromSourceMarker(source: string): VisualProject | null {
  const match = source.match(/\/\*\s*apexify-studio-v11:([^*]+)\*\//);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1].trim())) as VisualProject;
  } catch {
    return null;
  }
}

export { hasPhase11Authoring };

export function generatePhase11NativeSource(project: VisualProject): string {
  const timeline = phase11Timeline(project);
  if (!timeline) throw new Error('Phase 11 code generation requires a GIF timeline.');
  return '/* ' + PHASE11_SOURCE_MARKER + semanticPayload(project) + ' */\n' +
    generatedBody(project, timeline);
}

export function generatePhase11PreviewSource(project: VisualProject): string {
  return generatePhase11NativeSource(project);
}
