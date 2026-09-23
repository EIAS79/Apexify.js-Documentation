import { createVisualId } from './ids';
import type {
  VisualProject,
  VisualProjectIssue,
  VisualProjectRecord,
  VisualValue,
} from './model';

export const PHASE12_TIMELINE_KIND = 'audio-authoring-timeline' as const;

export const PHASE12_AUDIO_PRESETS = [
  'laser','laserHeavy','laserCharge','explosion','explosionSmall','explosionDeep',
  'hit','hitSoft','hitMetal','coin','powerup','powerupLong','shield','jump','jumpHigh',
  'alarm','alarmUrgent','beep','beepHigh','click','clickSoft','whoosh','whooshIn',
  'engine','engineIdle','siren','gameOver','gameOverSoft','blip','charge','failure',
  'success','menuSelect','menuBack','footstep','slash','rumble','sparkle','thunder',
] as const;

export type Phase12PresetName = (typeof PHASE12_AUDIO_PRESETS)[number];
export type Phase12AudioMode = 'preset' | 'synth' | 'sequence' | 'compose' | 'mix';
export type Phase12Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise' | 'pink';
export type Phase12FilterType = 'lowpass' | 'highpass';

export type Phase12Adsr = {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
};

export type Phase12Modulation = {
  depth: number;
  rate: number;
};

export type Phase12Filter = {
  type: Phase12FilterType;
  cutoff: number;
  q?: number;
};

export type Phase12Layer = {
  id: string;
  waveform?: Phase12Waveform;
  frequency?: number;
  frequencyEnd?: number;
  duration: number;
  delay?: number;
  gain?: number;
  detune?: number;
  adsr?: Phase12Adsr;
  vibrato?: Phase12Modulation;
  tremolo?: Phase12Modulation;
  filter?: Phase12Filter;
  noiseMix?: number;
  partials?: Array<[number, number]>;
  pan?: number;
};

export type Phase12Sound = {
  layers: Phase12Layer[];
  sampleRate?: number;
  channels?: 1 | 2;
  masterGain?: number;
  duration?: number;
  limiter?: boolean;
  seed?: string | number;
};

export type Phase12SequenceEvent = {
  id: string;
  at: number;
  preset?: Phase12PresetName;
  sound?: Phase12Sound;
  gain?: number;
};

export type Phase12ComposeClipSource =
  | { kind: 'preset'; preset: Phase12PresetName }
  | { kind: 'sound'; sound: Phase12Sound }
  | { kind: 'asset'; assetId: string };

export type Phase12ComposeClip = {
  id: string;
  at?: number;
  duration?: number;
  sourceStart?: number;
  source: Phase12ComposeClipSource;
  gain?: number;
  volume?: number;
  transpose?: number;
  detune?: number;
  pitch?: number;
  speed?: number;
  pan?: number;
  fadeIn?: number;
  fadeOut?: number;
  noise?: number;
  filter?: Phase12Filter;
  quality?: 'bright' | 'warm' | 'muffled' | 'lofi' | 'crisp';
  seed?: string | number;
};

export type Phase12MixInput =
  | { id: string; kind: 'preset'; preset: Phase12PresetName; gain?: number }
  | { id: string; kind: 'sound'; sound: Phase12Sound }
  | { id: string; kind: 'asset'; assetId: string; gain?: number };

export type Phase12Timeline = {
  mode: Phase12AudioMode;
  sampleRate: number;
  channels: 1 | 2;
  masterGain: number;
  seed?: string | number;
  limiter: boolean;
  preset: {
    name: Phase12PresetName;
    volume: number;
    transpose: number;
  };
  synth: Phase12Sound;
  sequence: {
    events: Phase12SequenceEvent[];
    tail: number;
  };
  compose: {
    clips: Phase12ComposeClip[];
    duration?: number;
    tail: number;
    postHighpassHz?: number;
    noiseGateThreshold?: number;
  };
  mix: {
    inputs: Phase12MixInput[];
  };
};

function asTimeline(record: VisualProjectRecord | undefined): Phase12Timeline | null {
  if (!record || record.kind !== PHASE12_TIMELINE_KIND) return null;
  if (!record.value || typeof record.value !== 'object' || Array.isArray(record.value)) return null;
  const value = record.value as unknown as Phase12Timeline;
  if (!['preset','synth','sequence','compose','mix'].includes(value.mode)) return null;
  if (!value.preset || typeof value.preset !== 'object') return null;
  if (!value.synth || typeof value.synth !== 'object' || !Array.isArray(value.synth.layers)) return null;
  if (!value.sequence || typeof value.sequence !== 'object' || !Array.isArray(value.sequence.events)) return null;
  if (!value.compose || typeof value.compose !== 'object' || !Array.isArray(value.compose.clips)) return null;
  if (!value.mix || typeof value.mix !== 'object' || !Array.isArray(value.mix.inputs)) return null;
  if (value.synth.layers.some((layer) => !layer || typeof layer !== 'object')) return null;
  if (value.sequence.events.some((event) => !event || typeof event !== 'object')) return null;
  if (value.compose.clips.some((clip) => !clip || typeof clip !== 'object' || !clip.source || typeof clip.source !== 'object')) return null;
  if (value.mix.inputs.some((input) => !input || typeof input !== 'object')) return null;
  return value;
}

export function phase12Record(project: VisualProject): VisualProjectRecord | undefined {
  return project.timelines.find((item) => item.kind === PHASE12_TIMELINE_KIND);
}

export function phase12Timeline(project: VisualProject): Phase12Timeline | null {
  return asTimeline(phase12Record(project));
}

export function hasPhase12Authoring(project: VisualProject): boolean {
  return Boolean(phase12Timeline(project));
}

export function defaultPhase12Layer(): Phase12Layer {
  return {
    id: createVisualId('audio-layer'),
    waveform: 'sine',
    frequency: 440,
    duration: 0.35,
    gain: 0.5,
    pan: 0,
    adsr: { attack: 0.005, decay: 0.04, sustain: 0.65, release: 0.08 },
  };
}

export function defaultPhase12Timeline(): Phase12Timeline {
  return {
    mode: 'preset',
    sampleRate: 44100,
    channels: 2,
    masterGain: 1,
    seed: 'apexify-studio-audio',
    limiter: true,
    preset: {
      name: 'laser',
      volume: 0.8,
      transpose: 0,
    },
    synth: {
      sampleRate: 44100,
      channels: 2,
      masterGain: 1,
      limiter: true,
      seed: 'apexify-studio-synth',
      layers: [defaultPhase12Layer()],
    },
    sequence: {
      events: [
        { id: createVisualId('audio-event'), at: 0, preset: 'beep', gain: 0.8 },
        { id: createVisualId('audio-event'), at: 0.24, preset: 'coin', gain: 0.7 },
      ],
      tail: 0.2,
    },
    compose: {
      clips: [
        {
          id: createVisualId('audio-clip'),
          at: 0,
          source: { kind: 'preset', preset: 'whoosh' },
          gain: 0.75,
          pan: 0,
          fadeOut: 0.08,
        },
        {
          id: createVisualId('audio-clip'),
          at: 0.35,
          source: { kind: 'preset', preset: 'sparkle' },
          gain: 0.7,
          pan: 0.35,
        },
      ],
      tail: 0.25,
    },
    mix: {
      inputs: [
        { id: createVisualId('audio-mix'), kind: 'preset', preset: 'beep', gain: 0.7 },
        { id: createVisualId('audio-mix'), kind: 'preset', preset: 'whoosh', gain: 0.45 },
      ],
    },
  };
}

export function setPhase12Timeline(
  project: VisualProject,
  timeline: Phase12Timeline,
): VisualProject {
  const next = structuredClone(project);
  const current = phase12Record(next);
  const record: VisualProjectRecord = {
    id: current?.id ?? createVisualId('audio-timeline'),
    kind: PHASE12_TIMELINE_KIND,
    name: current?.name ?? 'Audio composition',
    value: timeline as unknown as Record<string, VisualValue>,
  };
  next.timelines = [
    ...next.timelines.filter((item) => item.kind !== PHASE12_TIMELINE_KIND),
    record,
  ];
  next.updatedAt = new Date().toISOString();
  return next;
}

export function ensurePhase12Timeline(project: VisualProject): VisualProject {
  if (hasPhase12Authoring(project)) return project;
  return setPhase12Timeline(project, defaultPhase12Timeline());
}

export function removePhase12Timeline(project: VisualProject): VisualProject {
  const next = structuredClone(project);
  next.timelines = next.timelines.filter((item) => item.kind !== PHASE12_TIMELINE_KIND);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function createPhase12SequenceEvent(at = 0): Phase12SequenceEvent {
  return {
    id: createVisualId('audio-event'),
    at,
    preset: 'beep',
    gain: 0.8,
  };
}

export function createPhase12ComposeClip(at = 0): Phase12ComposeClip {
  return {
    id: createVisualId('audio-clip'),
    at,
    source: { kind: 'preset', preset: 'beep' },
    gain: 0.8,
    pan: 0,
  };
}

export function createPhase12MixInput(): Phase12MixInput {
  return {
    id: createVisualId('audio-mix'),
    kind: 'preset',
    preset: 'beep',
    gain: 0.8,
  };
}

function push(
  issues: VisualProjectIssue[],
  code: string,
  path: string,
  message: string,
) {
  issues.push({ severity: 'error', code, path, message });
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateRange(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
  label: string,
  min: number,
  max: number,
) {
  if (!finite(value) || value < min || value > max) {
    push(issues, 'phase12-range', path, label + ' must be between ' + min + ' and ' + max + '.');
  }
}

function validateSeed(issues: VisualProjectIssue[], seed: unknown, path: string) {
  if (seed === undefined) return;
  if (typeof seed === 'number' && Number.isSafeInteger(seed)) return;
  if (typeof seed === 'string' && seed.length >= 1 && seed.length <= 256) return;
  push(issues, 'phase12-seed', path, 'Audio seed must be a safe integer or a 1–256 character string.');
}

function validateLayer(
  layer: Phase12Layer,
  issues: VisualProjectIssue[],
  path: string,
  sampleRate: number,
) {
  if (!layer.id) push(issues, 'phase12-layer-id', path + '.id', 'Audio layer id is required.');
  if (layer.waveform !== undefined && !['sine','square','sawtooth','triangle','noise','pink'].includes(layer.waveform)) {
    push(issues, 'phase12-waveform', path + '.waveform', 'Unknown audio waveform.');
  }
  if (layer.frequency !== undefined && (!finite(layer.frequency) || layer.frequency <= 0)) {
    push(issues, 'phase12-frequency', path + '.frequency', 'Layer frequency must be positive.');
  }
  if (layer.frequencyEnd !== undefined && (!finite(layer.frequencyEnd) || layer.frequencyEnd <= 0)) {
    push(issues, 'phase12-frequency', path + '.frequencyEnd', 'Layer end frequency must be positive.');
  }
  if (!finite(layer.duration) || layer.duration <= 0) {
    push(issues, 'phase12-duration', path + '.duration', 'Layer duration must be positive.');
  }
  if (layer.delay !== undefined && (!finite(layer.delay) || layer.delay < 0)) {
    push(issues, 'phase12-delay', path + '.delay', 'Layer delay cannot be negative.');
  }
  if (layer.gain !== undefined) validateRange(issues, layer.gain, path + '.gain', 'Layer gain', 0, 4);
  if (layer.pan !== undefined) validateRange(issues, layer.pan, path + '.pan', 'Layer pan', -1, 1);
  if (layer.noiseMix !== undefined) validateRange(issues, layer.noiseMix, path + '.noiseMix', 'Noise mix', 0, 1);
  if (layer.detune !== undefined && !finite(layer.detune)) {
    push(issues, 'phase12-detune', path + '.detune', 'Layer detune must be finite.');
  }
  if (layer.partials !== undefined) {
    if (!Array.isArray(layer.partials) || layer.partials.length > 4096 || layer.partials.some((partial) =>
      !Array.isArray(partial) || partial.length !== 2 || !finite(partial[0]) || partial[0] <= 0 || !finite(partial[1]) || partial[1] < 0
    )) {
      push(issues, 'phase12-partials', path + '.partials', 'Partials must contain at most 4096 positive [frequencyRatio, gain] pairs.');
    }
  }
  if (layer.adsr?.sustain !== undefined) validateRange(issues, layer.adsr.sustain, path + '.adsr.sustain', 'ADSR sustain', 0, 1);
  for (const key of ['attack','decay','release'] as const) {
    const value = layer.adsr?.[key];
    if (value !== undefined && (!finite(value) || value < 0)) {
      push(issues, 'phase12-adsr', path + '.adsr.' + key, 'ADSR ' + key + ' cannot be negative.');
    }
  }
  if (layer.vibrato) {
    if (!finite(layer.vibrato.depth) || layer.vibrato.depth < 0 || !finite(layer.vibrato.rate) || layer.vibrato.rate <= 0) {
      push(issues, 'phase12-vibrato', path + '.vibrato', 'Vibrato depth/rate must be finite and rate must be positive.');
    }
  }
  if (layer.tremolo) {
    validateRange(issues, layer.tremolo.depth, path + '.tremolo.depth', 'Tremolo depth', 0, 1);
    if (!finite(layer.tremolo.rate) || layer.tremolo.rate <= 0) {
      push(issues, 'phase12-tremolo', path + '.tremolo.rate', 'Tremolo rate must be positive.');
    }
  }
  if (layer.filter) {
    if (!finite(layer.filter.cutoff) || layer.filter.cutoff <= 0 || layer.filter.cutoff >= sampleRate / 2) {
      push(issues, 'phase12-filter-cutoff', path + '.filter.cutoff', 'Filter cutoff must be positive and below Nyquist.');
    }
    if (layer.filter.q !== undefined) validateRange(issues, layer.filter.q, path + '.filter.q', 'Filter Q', 0.1, 20);
  }
}

function validateSound(
  sound: Phase12Sound,
  issues: VisualProjectIssue[],
  path: string,
  fallbackRate: number,
) {
  const sampleRate = sound.sampleRate ?? fallbackRate;
  if (!finite(sampleRate) || sampleRate < 8000 || sampleRate > 192000) {
    push(issues, 'phase12-sample-rate', path + '.sampleRate', 'Sample rate must be between 8000 and 192000 Hz.');
  }
  if (sound.channels !== undefined && sound.channels !== 1 && sound.channels !== 2) {
    push(issues, 'phase12-channels', path + '.channels', 'Audio channels must be 1 or 2.');
  }
  if (!Array.isArray(sound.layers) || sound.layers.length < 1) {
    push(issues, 'phase12-layers', path + '.layers', 'Custom audio requires at least one layer.');
    return;
  }
  if (sound.layers.length > 1024) {
    push(issues, 'phase12-layers', path + '.layers', 'Custom audio exceeds the 1024 layer safety limit.');
  }
  const ids = new Set<string>();
  sound.layers.forEach((layer, index) => {
    if (ids.has(layer.id)) push(issues, 'phase12-layer-id', path + '.layers[' + index + '].id', 'Audio layer ids must be unique.');
    ids.add(layer.id);
    validateLayer(layer, issues, path + '.layers[' + index + ']', sampleRate);
  });
  if (sound.masterGain !== undefined) validateRange(issues, sound.masterGain, path + '.masterGain', 'Master gain', 0, 4);
  if (sound.duration !== undefined && (!finite(sound.duration) || sound.duration <= 0 || sound.duration > 600)) {
    push(issues, 'phase12-duration', path + '.duration', 'Sound duration must be positive and no longer than 600 seconds.');
  }
  validateSeed(issues, sound.seed, path + '.seed');
}

function validateAssetId(assetId: string, issues: VisualProjectIssue[], path: string) {
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(assetId)) {
    push(issues, 'phase12-asset', path, 'Audio asset id must be a valid Studio virtual-asset identifier.');
  }
}

export function validatePhase12Project(project: VisualProject): VisualProjectIssue[] {
  const issues: VisualProjectIssue[] = [];
  const records = project.timelines.filter((item) => item.kind === PHASE12_TIMELINE_KIND);
  if (!records.length) return issues;
  if (records.length > 1) {
    push(issues, 'phase12-timeline-count', 'timelines', 'Phase 12 supports one active audio timeline per Visual Project.');
  }
  const timeline = asTimeline(records[0]);
  if (!timeline) {
    push(issues, 'phase12-timeline', 'timelines', 'Audio timeline has an invalid shape.');
    return issues;
  }

  if (!finite(timeline.sampleRate) || timeline.sampleRate < 8000 || timeline.sampleRate > 192000) {
    push(issues, 'phase12-sample-rate', 'timelines.audio.sampleRate', 'Sample rate must be between 8000 and 192000 Hz.');
  }
  if (timeline.channels !== 1 && timeline.channels !== 2) {
    push(issues, 'phase12-channels', 'timelines.audio.channels', 'Audio channels must be 1 or 2.');
  }
  validateRange(issues, timeline.masterGain, 'timelines.audio.masterGain', 'Master gain', 0, 4);
  if (typeof timeline.limiter !== 'boolean') {
    push(issues, 'phase12-limiter', 'timelines.audio.limiter', 'Limiter must be true or false.');
  }
  validateSeed(issues, timeline.seed, 'timelines.audio.seed');
  validateSound(timeline.synth, issues, 'timelines.audio.synth', timeline.sampleRate);

  if (!PHASE12_AUDIO_PRESETS.includes(timeline.preset.name)) {
    push(issues, 'phase12-preset', 'timelines.audio.preset.name', 'Unknown Apexify audio preset.');
  }
  validateRange(issues, timeline.preset.volume, 'timelines.audio.preset.volume', 'Preset volume', 0, 4);
  if (!finite(timeline.preset.transpose) || timeline.preset.transpose < -96 || timeline.preset.transpose > 96) {
    push(issues, 'phase12-transpose', 'timelines.audio.preset.transpose', 'Preset transpose must be between -96 and 96 semitones.');
  }

  if (!finite(timeline.sequence.tail) || timeline.sequence.tail < 0 || timeline.sequence.tail > 600) {
    push(issues, 'phase12-tail', 'timelines.audio.sequence.tail', 'Sequence tail must be between 0 and 600 seconds.');
  }
  if (timeline.sequence.events.length < 1) {
    push(issues, 'phase12-sequence', 'timelines.audio.sequence.events', 'Sequence requires at least one event.');
  }
  if (timeline.sequence.events.length > 20000) {
    push(issues, 'phase12-sequence', 'timelines.audio.sequence.events', 'Sequence exceeds the 20,000 event safety limit.');
  }
  const eventIds = new Set<string>();
  timeline.sequence.events.forEach((event, index) => {
    const path = 'timelines.audio.sequence.events[' + index + ']';
    if (eventIds.has(event.id)) push(issues, 'phase12-event-id', path + '.id', 'Sequence event ids must be unique.');
    eventIds.add(event.id);
    if (!finite(event.at) || event.at < 0 || event.at > 600) {
      push(issues, 'phase12-event-time', path + '.at', 'Sequence event time must be between 0 and 600 seconds.');
    }
    if (Boolean(event.preset) === Boolean(event.sound)) {
      push(issues, 'phase12-event-source', path, 'Sequence event must define exactly one preset or custom sound.');
    }
    if (event.preset && !PHASE12_AUDIO_PRESETS.includes(event.preset)) {
      push(issues, 'phase12-preset', path + '.preset', 'Unknown Apexify audio preset.');
    }
    if (event.sound) validateSound(event.sound, issues, path + '.sound', timeline.sampleRate);
    if (event.gain !== undefined) validateRange(issues, event.gain, path + '.gain', 'Event gain', 0, 4);
  });

  if (timeline.compose.duration !== undefined && (!finite(timeline.compose.duration) || timeline.compose.duration <= 0 || timeline.compose.duration > 600)) {
    push(issues, 'phase12-duration', 'timelines.audio.compose.duration', 'Composition duration must be positive and no longer than 600 seconds.');
  }
  if (!finite(timeline.compose.tail) || timeline.compose.tail < 0 || timeline.compose.tail > 600) {
    push(issues, 'phase12-tail', 'timelines.audio.compose.tail', 'Composition tail must be between 0 and 600 seconds.');
  }
  if (timeline.compose.noiseGateThreshold !== undefined) {
    validateRange(issues, timeline.compose.noiseGateThreshold, 'timelines.audio.compose.noiseGateThreshold', 'Noise gate threshold', 0, 1);
  }
  if (timeline.compose.postHighpassHz !== undefined && (!finite(timeline.compose.postHighpassHz) || timeline.compose.postHighpassHz <= 0 || timeline.compose.postHighpassHz >= timeline.sampleRate / 2)) {
    push(issues, 'phase12-filter-cutoff', 'timelines.audio.compose.postHighpassHz', 'Post high-pass must be positive and below Nyquist.');
  }
  if (timeline.compose.clips.length < 1) {
    push(issues, 'phase12-compose', 'timelines.audio.compose.clips', 'Composition requires at least one clip.');
  }
  const clipIds = new Set<string>();
  timeline.compose.clips.forEach((clip, index) => {
    const path = 'timelines.audio.compose.clips[' + index + ']';
    if (clipIds.has(clip.id)) push(issues, 'phase12-clip-id', path + '.id', 'Composition clip ids must be unique.');
    clipIds.add(clip.id);
    if (clip.at !== undefined && (!finite(clip.at) || clip.at < 0 || clip.at > 600)) {
      push(issues, 'phase12-clip-time', path + '.at', 'Clip time must be between 0 and 600 seconds.');
    }
    if (clip.duration !== undefined && (!finite(clip.duration) || clip.duration <= 0 || clip.duration > 600)) {
      push(issues, 'phase12-duration', path + '.duration', 'Clip duration must be positive and no longer than 600 seconds.');
    }
    if (clip.sourceStart !== undefined && (!finite(clip.sourceStart) || clip.sourceStart < 0 || clip.sourceStart > 600)) {
      push(issues, 'phase12-source-start', path + '.sourceStart', 'Clip sourceStart must be between 0 and 600 seconds.');
    }
    for (const key of ['gain','volume'] as const) {
      const value = clip[key];
      if (value !== undefined) validateRange(issues, value, path + '.' + key, 'Clip ' + key, 0, 4);
    }
    if (clip.speed !== undefined && (!finite(clip.speed) || clip.speed <= 0 || clip.speed > 16)) {
      push(issues, 'phase12-speed', path + '.speed', 'Clip speed must be positive and at most 16.');
    }
    if (clip.pan !== undefined) validateRange(issues, clip.pan, path + '.pan', 'Clip pan', -1, 1);
    if (clip.fadeIn !== undefined && (!finite(clip.fadeIn) || clip.fadeIn < 0)) push(issues, 'phase12-fade', path + '.fadeIn', 'Clip fade-in cannot be negative.');
    if (clip.fadeOut !== undefined && (!finite(clip.fadeOut) || clip.fadeOut < 0)) push(issues, 'phase12-fade', path + '.fadeOut', 'Clip fade-out cannot be negative.');
    if (clip.noise !== undefined) validateRange(issues, clip.noise, path + '.noise', 'Clip noise', 0, 1);
    validateSeed(issues, clip.seed, path + '.seed');
    if (clip.source.kind === 'preset' && !PHASE12_AUDIO_PRESETS.includes(clip.source.preset)) {
      push(issues, 'phase12-preset', path + '.source.preset', 'Unknown Apexify audio preset.');
    } else if (clip.source.kind === 'sound') {
      validateSound(clip.source.sound, issues, path + '.source.sound', timeline.sampleRate);
    } else if (clip.source.kind === 'asset') {
      validateAssetId(clip.source.assetId, issues, path + '.source.assetId');
    } else if (!['preset','sound','asset'].includes((clip.source as { kind?: string }).kind ?? '')) {
      push(issues, 'phase12-clip-source', path + '.source.kind', 'Unknown composition clip source kind.');
    }
  });

  if (timeline.mix.inputs.length < 1) {
    push(issues, 'phase12-mix', 'timelines.audio.mix.inputs', 'Mix requires at least one input.');
  }
  const mixIds = new Set<string>();
  timeline.mix.inputs.forEach((input, index) => {
    const path = 'timelines.audio.mix.inputs[' + index + ']';
    if (mixIds.has(input.id)) push(issues, 'phase12-mix-id', path + '.id', 'Mix input ids must be unique.');
    mixIds.add(input.id);
    if (input.kind === 'preset' && !PHASE12_AUDIO_PRESETS.includes(input.preset)) {
      push(issues, 'phase12-preset', path + '.preset', 'Unknown Apexify audio preset.');
    } else if (input.kind === 'sound') {
      validateSound(input.sound, issues, path + '.sound', timeline.sampleRate);
    } else if (input.kind === 'asset') {
      validateAssetId(input.assetId, issues, path + '.assetId');
      if (input.gain !== undefined) validateRange(issues, input.gain, path + '.gain', 'Mix gain', 0, 4);
    } else {
      push(issues, 'phase12-mix-source', path + '.kind', 'Unknown mix input source kind.');
    }
  });

  return issues;
}
