import type { VisualProject } from './model';
import {
  hasPhase12Authoring,
  phase12Timeline,
  type Phase12ComposeClip,
  type Phase12Layer,
  type Phase12MixInput,
  type Phase12SequenceEvent,
  type Phase12Sound,
  type Phase12Timeline,
} from './audio-authoring-contract';

export const PHASE12_SOURCE_MARKER = 'apexify-studio-v12:';

function semanticPayload(project: VisualProject) {
  return encodeURIComponent(JSON.stringify(project)).replace(/\*/g, '%2A');
}

function emitValue(value: unknown, indent = 0): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
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
  throw new Error('Unsupported Phase 12 code value: ' + String(value));
}

function layerValue(layer: Phase12Layer) {
  const { id: _id, ...value } = layer;
  return value;
}

function soundValue(sound: Phase12Sound, timeline: Phase12Timeline) {
  return {
    ...sound,
    layers: sound.layers.map(layerValue),
    sampleRate: sound.sampleRate ?? timeline.sampleRate,
    channels: sound.channels ?? timeline.channels,
    masterGain: sound.masterGain ?? timeline.masterGain,
    limiter: sound.limiter ?? timeline.limiter,
    seed: sound.seed ?? timeline.seed,
  };
}

function eventValue(event: Phase12SequenceEvent, timeline: Phase12Timeline) {
  return {
    at: event.at,
    ...(event.preset ? { preset: event.preset } : {}),
    ...(event.sound ? { options: soundValue(event.sound, timeline) } : {}),
    ...(event.gain !== undefined ? { gain: event.gain } : {}),
  };
}

type AssetBinding = { assetId: string; variable: string };

function collectAssetBindings(timeline: Phase12Timeline): AssetBinding[] {
  const ids: string[] = [];
  for (const clip of timeline.compose.clips) {
    if (clip.source.kind === 'asset' && !ids.includes(clip.source.assetId)) ids.push(clip.source.assetId);
  }
  for (const input of timeline.mix.inputs) {
    if (input.kind === 'asset' && !ids.includes(input.assetId)) ids.push(input.assetId);
  }
  return ids.map((assetId, index) => ({ assetId, variable: 'audioAsset' + (index + 1) }));
}

function clipValue(
  clip: Phase12ComposeClip,
  timeline: Phase12Timeline,
  assets: readonly AssetBinding[],
) {
  const { id: _id, source, ...options } = clip;
  if (source.kind === 'preset') return { ...options, preset: source.preset };
  if (source.kind === 'sound') return { ...options, sound: soundValue(source.sound, timeline) };
  const binding = assets.find((item) => item.assetId === source.assetId);
  if (!binding) throw new Error('Missing Phase 12 audio asset binding for ' + source.assetId + '.');
  return { ...options, __assetVariable: binding.variable };
}

function mixValue(
  input: Phase12MixInput,
  timeline: Phase12Timeline,
  assets: readonly AssetBinding[],
) {
  if (input.kind === 'preset') {
    return {
      preset: input.preset,
      ...(input.gain !== undefined ? { gain: input.gain } : {}),
    };
  }
  if (input.kind === 'sound') return soundValue(input.sound, timeline);
  const binding = assets.find((item) => item.assetId === input.assetId);
  if (!binding) throw new Error('Missing Phase 12 audio asset binding for ' + input.assetId + '.');
  return {
    __assetVariable: binding.variable,
    ...(input.gain !== undefined ? { gain: input.gain } : {}),
  };
}

function emitAssetAware(value: unknown, indent = 0): string {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    '__assetVariable' in (value as Record<string, unknown>)
  ) {
    const object = value as Record<string, unknown>;
    const variable = String(object.__assetVariable);
    const rest = Object.fromEntries(
      Object.entries(object).filter(([key]) => key !== '__assetVariable'),
    );
    const entries = Object.entries(rest);
    if (!entries.length) return variable;
    const body = [
      ' '.repeat(indent + 2) + 'wav: ' + variable,
      ...entries.map(([key, item]) =>
        ' '.repeat(indent + 2) +
        (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)) +
        ': ' +
        emitAssetAware(item, indent + 2),
      ),
    ].join(',\n');
    return '{\n' + body + ',\n' + ' '.repeat(indent) + '}';
  }
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const body = value
      .map((item) => ' '.repeat(indent + 2) + emitAssetAware(item, indent + 2))
      .join(',\n');
    return '[\n' + body + ',\n' + ' '.repeat(indent) + ']';
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined);
    if (!entries.length) return '{}';
    const body = entries
      .map(([key, item]) =>
        ' '.repeat(indent + 2) +
        (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)) +
        ': ' +
        emitAssetAware(item, indent + 2),
      )
      .join(',\n');
    return '{\n' + body + ',\n' + ' '.repeat(indent) + '}';
  }
  return emitValue(value, indent);
}

function generatedBody(timeline: Phase12Timeline) {
  const assets = collectAssetBindings(timeline);
  const lines: string[] = [
    "import { ApexPainter } from 'apexify.js';",
  ];
  if (assets.length) lines.push("import { readFileSync } from 'node:fs';");
  lines.push('', 'const painter = new ApexPainter();', '', 'async function main() {');

  for (const binding of assets) {
    lines.push(
      '  const ' + binding.variable + ' = readFileSync(' +
        JSON.stringify('studio://asset/' + binding.assetId) +
        ');',
    );
  }
  if (assets.length) lines.push('');

  if (timeline.mode === 'preset') {
    lines.push(
      '  const audio = painter.createAudio.preset(',
      '    ' + JSON.stringify(timeline.preset.name) + ',',
      '    ' + emitValue({
        volume: timeline.preset.volume,
        transpose: timeline.preset.transpose,
        sampleRate: timeline.sampleRate,
        channels: timeline.channels,
        masterGain: timeline.masterGain,
        limiter: timeline.limiter,
        seed: timeline.seed,
      }, 4).replace(/\n/g, '\n    ') + ',',
      '  );',
    );
  } else if (timeline.mode === 'synth') {
    lines.push(
      '  const audio = painter.createAudio.synth(',
      '    ' + emitValue(soundValue(timeline.synth, timeline), 4).replace(/\n/g, '\n    ') + ',',
      '  );',
    );
  } else if (timeline.mode === 'sequence') {
    lines.push(
      '  const audio = painter.createAudio.sequence(',
      '    ' + emitValue({
        events: timeline.sequence.events.map((event) => eventValue(event, timeline)),
        sampleRate: timeline.sampleRate,
        channels: timeline.channels,
        masterGain: timeline.masterGain,
        tail: timeline.sequence.tail,
        seed: timeline.seed,
      }, 4).replace(/\n/g, '\n    ') + ',',
      '  );',
    );
  } else if (timeline.mode === 'compose') {
    const clips = timeline.compose.clips.map((clip) => clipValue(clip, timeline, assets));
    lines.push(
      '  const audio = painter.createAudio.compose(',
      '    ' + emitAssetAware({
        clips,
        duration: timeline.compose.duration,
        sampleRate: timeline.sampleRate,
        channels: timeline.channels,
        masterGain: timeline.masterGain,
        tail: timeline.compose.tail,
        limiter: timeline.limiter,
        postHighpassHz: timeline.compose.postHighpassHz,
        noiseGateThreshold: timeline.compose.noiseGateThreshold,
        seed: timeline.seed,
      }, 4).replace(/\n/g, '\n    ') + ',',
      '  );',
    );
  } else {
    const inputs = timeline.mix.inputs.map((input) => mixValue(input, timeline, assets));
    lines.push(
      '  const audio = painter.createAudio.mix(',
      '    ' + emitAssetAware(inputs, 4).replace(/\n/g, '\n    ') + ',',
      '    ' + emitValue({
        sampleRate: timeline.sampleRate,
        channels: timeline.channels,
        masterGain: timeline.masterGain,
        seed: timeline.seed,
      }, 4).replace(/\n/g, '\n    ') + ',',
      '  );',
    );
  }

  lines.push(
    "  if (!(audio instanceof Uint8Array)) throw new Error('Expected PCM WAV buffer output.');",
    '  return audio;',
    '}',
    '',
    'return await main();',
    '',
  );
  return lines.join('\n');
}

export function phase12ProjectFromSourceMarker(source: string): VisualProject | null {
  const match = source.match(/\/\*\s*apexify-studio-v12:([^*]+)\*\//);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1].trim())) as VisualProject;
  } catch {
    return null;
  }
}

export { hasPhase12Authoring };

export function generatePhase12NativeSource(project: VisualProject): string {
  const timeline = phase12Timeline(project);
  if (!timeline) throw new Error('Phase 12 code generation requires an audio timeline.');
  return '/* ' + PHASE12_SOURCE_MARKER + semanticPayload(project) + ' */\n' +
    generatedBody(timeline);
}

export function generatePhase12PreviewSource(project: VisualProject): string {
  return generatePhase12NativeSource(project);
}
