import type {
  VisualProject,
  VisualProjectIssue,
  VisualProjectRecord,
  VisualValue,
} from './model';
import { createVisualId } from './ids';

export const PHASE11_TIMELINE_KIND = 'gif-animation-timeline';

export type Phase11Mode = 'create-gif' | 'animate' | 'scene-gif';

export type Phase11Frame = {
  id: string;
  source?: string;
  backgroundColor?: string;
  duration?: number;
  repeat?: number;
  dispose?: 0 | 1 | 2 | 3;
  transparentColor?: number | string | null;
  blendMode?: string;
  transformations?: {
    scaleX?: number;
    scaleY?: number;
    rotate?: number;
    translateX?: number;
    translateY?: number;
  };
};

export type Phase11Timeline = {
  id: string;
  name: string;
  mode: Phase11Mode;
  width: number;
  height: number;
  delay: number;
  repeat: number;
  quality: number;
  frames: Phase11Frame[];
  scene?: {
    prependComposedRaster?: boolean;
    composedFrameDuration?: number;
    composedFrameRepeat?: number;
  };
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function number(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function frameFromValue(value: unknown, index: number): Phase11Frame | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : 'frame-' + (index + 1);
  const transformations =
    raw.transformations && typeof raw.transformations === 'object' && !Array.isArray(raw.transformations)
      ? raw.transformations as Phase11Frame['transformations']
      : undefined;
  return {
    id,
    ...(typeof raw.source === 'string' ? { source: raw.source } : {}),
    ...(typeof raw.backgroundColor === 'string' ? { backgroundColor: raw.backgroundColor } : {}),
    ...(typeof raw.duration === 'number' ? { duration: raw.duration } : {}),
    ...(typeof raw.repeat === 'number' ? { repeat: raw.repeat } : {}),
    ...(raw.dispose === 0 || raw.dispose === 1 || raw.dispose === 2 || raw.dispose === 3
      ? { dispose: raw.dispose }
      : {}),
    ...(raw.transparentColor === null || typeof raw.transparentColor === 'number' || typeof raw.transparentColor === 'string'
      ? { transparentColor: raw.transparentColor as number | string | null }
      : {}),
    ...(typeof raw.blendMode === 'string' ? { blendMode: raw.blendMode } : {}),
    ...(transformations ? { transformations } : {}),
  };
}

function recordValue(timeline: Phase11Timeline): Record<string, VisualValue> {
  return clone({
    mode: timeline.mode,
    width: timeline.width,
    height: timeline.height,
    delay: timeline.delay,
    repeat: timeline.repeat,
    quality: timeline.quality,
    frames: timeline.frames,
    ...(timeline.scene ? { scene: timeline.scene } : {}),
  }) as unknown as Record<string, VisualValue>;
}

function parseTimeline(record: VisualProjectRecord): Phase11Timeline | null {
  if (record.kind !== PHASE11_TIMELINE_KIND) return null;
  const value = record.value ?? {};
  const mode =
    value.mode === 'animate' || value.mode === 'scene-gif' || value.mode === 'create-gif'
      ? value.mode
      : 'create-gif';
  const framesRaw = Array.isArray(value.frames) ? value.frames : [];
  const scene =
    value.scene && typeof value.scene === 'object' && !Array.isArray(value.scene)
      ? value.scene as unknown as Phase11Timeline['scene']
      : undefined;
  return {
    id: record.id,
    name: record.name ?? 'GIF Timeline',
    mode,
    width: number(value.width, 640),
    height: number(value.height, 360),
    delay: number(value.delay, 100),
    repeat: number(value.repeat, 0),
    quality: number(value.quality, 10),
    frames: framesRaw.map(frameFromValue).filter((item): item is Phase11Frame => Boolean(item)),
    ...(scene ? { scene: clone(scene) } : {}),
  };
}

export function phase11Timeline(project: VisualProject): Phase11Timeline | null {
  for (const record of project.timelines) {
    const parsed = parseTimeline(record);
    if (parsed) return parsed;
  }
  return null;
}

export function hasPhase11Authoring(project: VisualProject): boolean {
  return Boolean(phase11Timeline(project));
}

export function defaultPhase11Timeline(
  project: VisualProject,
  id = createVisualId('gif-timeline'),
): Phase11Timeline {
  return {
    id,
    name: 'GIF Timeline',
    mode: 'create-gif',
    width: Math.max(1, Math.round(project.document.width)),
    height: Math.max(1, Math.round(project.document.height)),
    delay: 100,
    repeat: 0,
    quality: 10,
    frames: [],
    scene: {
      prependComposedRaster: true,
      composedFrameDuration: 100,
      composedFrameRepeat: 1,
    },
  };
}

export function setPhase11Timeline(
  project: VisualProject,
  timeline: Phase11Timeline,
): VisualProject {
  const next = clone(project);
  const record: VisualProjectRecord = {
    id: timeline.id,
    kind: PHASE11_TIMELINE_KIND,
    name: timeline.name,
    value: recordValue(timeline),
  };
  const index = next.timelines.findIndex((item) => item.kind === PHASE11_TIMELINE_KIND);
  if (index >= 0) next.timelines[index] = record;
  else next.timelines.push(record);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function ensurePhase11Timeline(project: VisualProject): VisualProject {
  return phase11Timeline(project)
    ? project
    : setPhase11Timeline(project, defaultPhase11Timeline(project));
}

export function removePhase11Timeline(project: VisualProject): VisualProject {
  const next = clone(project);
  next.timelines = next.timelines.filter((item) => item.kind !== PHASE11_TIMELINE_KIND);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function createPhase11Frame(source = ''): Phase11Frame {
  return {
    id: createVisualId('gif-frame'),
    ...(source ? { source } : {}),
    duration: 100,
    repeat: 1,
    dispose: 2,
  };
}

export function phase11ExpandedFrames(timeline: Phase11Timeline): Phase11Frame[] {
  const out: Phase11Frame[] = [];
  for (const frame of timeline.frames) {
    const repeat = Math.max(1, Math.round(frame.repeat ?? 1));
    for (let i = 0; i < repeat; i += 1) {
      out.push({ ...clone(frame), repeat: 1 });
    }
  }
  return out;
}

function finitePositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function push(
  issues: VisualProjectIssue[],
  code: string,
  path: string,
  message: string,
) {
  issues.push({ severity: 'error', code, path, message });
}

export function validatePhase11Project(project: VisualProject): VisualProjectIssue[] {
  const issues: VisualProjectIssue[] = [];
  const records = project.timelines.filter((item) => item.kind === PHASE11_TIMELINE_KIND);
  if (!records.length) return issues;
  if (records.length > 1) {
    push(issues, 'phase11-timeline-count', 'timelines', 'Phase 11 supports one active GIF/animation timeline per Visual Project.');
  }
  const timeline = parseTimeline(records[0]!);
  if (!timeline) {
    push(issues, 'phase11-timeline', 'timelines[0]', 'GIF timeline is invalid.');
    return issues;
  }

  if (!finitePositive(timeline.width) || !Number.isInteger(timeline.width)) {
    push(issues, 'phase11-width', 'timelines.' + timeline.id + '.width', 'GIF width must be a positive integer.');
  }
  if (!finitePositive(timeline.height) || !Number.isInteger(timeline.height)) {
    push(issues, 'phase11-height', 'timelines.' + timeline.id + '.height', 'GIF height must be a positive integer.');
  }
  if (!finitePositive(timeline.delay) || timeline.delay > 655350) {
    push(issues, 'phase11-delay', 'timelines.' + timeline.id + '.delay', 'Default frame delay must be between 1 and 655350ms.');
  }
  if (!Number.isInteger(timeline.repeat) || timeline.repeat < -1) {
    push(issues, 'phase11-repeat', 'timelines.' + timeline.id + '.repeat', 'GIF repeat must be -1, 0, or a positive integer.');
  }
  if (!Number.isInteger(timeline.quality) || timeline.quality < 1 || timeline.quality > 30) {
    push(issues, 'phase11-quality', 'timelines.' + timeline.id + '.quality', 'GIF quality must be an integer from 1 to 30.');
  }

  const ids = new Set<string>();
  timeline.frames.forEach((frame, index) => {
    const path = 'timelines.' + timeline.id + '.frames[' + index + ']';
    if (!frame.id || ids.has(frame.id)) push(issues, 'phase11-frame-id', path + '.id', 'Frame ids must be non-empty and unique.');
    ids.add(frame.id);
    if (frame.duration !== undefined && (!finitePositive(frame.duration) || frame.duration > 655350)) {
      push(issues, 'phase11-frame-duration', path + '.duration', 'Frame duration must be between 1 and 655350ms.');
    }
    if (frame.repeat !== undefined && (!Number.isInteger(frame.repeat) || frame.repeat < 1)) {
      push(issues, 'phase11-frame-repeat', path + '.repeat', 'Frame repeat must be a positive integer.');
    }
    if (timeline.mode === 'animate') {
      if (!frame.source?.trim() && !frame.backgroundColor?.trim()) {
        push(issues, 'phase11-frame-source', path, 'Animation frames need a source or background color.');
      }
    } else if (!frame.source?.trim()) {
      push(issues, 'phase11-frame-source', path + '.source', 'GIF frames need an image source.');
    }
  });

  const expandedCount = phase11ExpandedFrames(timeline).length;
  if (expandedCount > 300) {
    push(issues, 'phase11-frame-limit', 'timelines.' + timeline.id + '.frames', 'Expanded GIF timeline exceeds the Studio safety limit of 300 frames.');
  }
  if (timeline.mode !== 'scene-gif' && expandedCount < 1) {
    push(issues, 'phase11-empty', 'timelines.' + timeline.id + '.frames', 'Add at least one frame.');
  }
  if (timeline.mode === 'scene-gif') {
    const prepend = timeline.scene?.prependComposedRaster !== false;
    if (!prepend && expandedCount < 1) {
      push(issues, 'phase11-empty-scene', 'timelines.' + timeline.id, 'Scene-to-GIF needs the composed scene or at least one tail frame.');
    }
    const duration = timeline.scene?.composedFrameDuration ?? timeline.delay;
    if (!finitePositive(duration)) {
      push(issues, 'phase11-scene-duration', 'timelines.' + timeline.id + '.scene.composedFrameDuration', 'Scene frame duration must be positive.');
    }
    const repeat = timeline.scene?.composedFrameRepeat ?? 1;
    if (!Number.isInteger(repeat) || repeat < 1) {
      push(issues, 'phase11-scene-repeat', 'timelines.' + timeline.id + '.scene.composedFrameRepeat', 'Scene frame repeat must be a positive integer.');
    }
  }

  return issues;
}
