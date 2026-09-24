import type { VisualProject, VisualProjectIssue, VisualProjectRecord, VisualValue } from './model';
import type { Phase12PresetName } from './audio-authoring-contract';

export const PHASE13_TIMELINE_KIND = 'video-authoring-timeline' as const;

export type Phase13VideoMode = 'pipeline' | 'frames' | 'operations';
export type Phase13VideoFormat = 'mp4' | 'webm';
export type Phase13AssetSource = { kind: 'asset'; assetId: string };
export type Phase13FrameSource =
  | { kind: 'asset'; assetId: string }
  | { kind: 'solid'; color: string; label?: string };

export type Phase13Splice = {
  id: string;
  targetStartTime: number;
  targetEndTime: number;
  replacement: Phase13AssetSource;
  replacementStartTime?: number;
  replacementDuration?: number;
  durationPolicy?: 'fit' | 'trim' | 'preserve';
};

export type Phase13TextOverlay = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  bold?: boolean;
};

export type Phase13AudioTrack =
  | {
      id: string;
      type: 'asset';
      assetId: string;
      startTime: number;
      duration?: number;
      sourceStart?: number;
      volume?: number;
      speed?: number;
      pitchSemitones?: number;
      pan?: number;
      fadeIn?: number;
      fadeOut?: number;
    }
  | {
      id: string;
      type: 'preset';
      preset: Phase12PresetName;
      startTime: number;
      gain?: number;
      volume?: number;
      transpose?: number;
    };

export type Phase13Operation =
  | { id: string; kind: 'speed'; speed: number }
  | { id: string; kind: 'effects'; filters: Array<{ type: 'blur'|'brightness'|'contrast'|'saturation'|'grayscale'|'sepia'|'invert'|'sharpen'|'noise'; intensity?: number; value?: number }> }
  | { id: string; kind: 'crop'; x: number; y: number; width: number; height: number }
  | { id: string; kind: 'rotate'; angle?: 90|180|270; flip?: 'horizontal'|'vertical'|'both' }
  | { id: string; kind: 'compress'; quality?: 'low'|'medium'|'high'|'ultra'; targetSize?: number; maxBitrate?: number }
  | { id: string; kind: 'fade'; fadeIn?: number; fadeOut?: number }
  | { id: string; kind: 'reverse' }
  | { id: string; kind: 'color'; brightness?: number; contrast?: number; saturation?: number; hue?: number; temperature?: number }
  | { id: string; kind: 'pip'; overlayAssetId: string; position?: 'top-left'|'top-right'|'bottom-left'|'bottom-right'|'center'; width?: number; height?: number; opacity?: number }
  | { id: string; kind: 'freeze'; time: number; duration: number }
  | { id: string; kind: 'transition'; type: 'fade'|'wipe'|'slide'|'zoom'|'rotate'|'dissolve'|'blur'|'circle'|'pixelize'; duration: number; direction?: 'left'|'right'|'up'|'down'|'in'|'out'; secondAssetId?: string }
  | { id: string; kind: 'removeAudio' }
  | { id: string; kind: 'normalizeAudio'; targetLevel?: number; method?: 'peak'|'rms'|'lufs' }
  | { id: string; kind: 'exportPreset'; preset: 'youtube'|'instagram'|'tiktok'|'twitter'|'facebook'|'4k'|'1080p'|'720p'|'mobile'|'web' };

export type Phase13Timeline = {
  mode: Phase13VideoMode;
  source?: Phase13AssetSource;
  frames: {
    items: Array<{ id: string; source: Phase13FrameSource }>;
    fps: number;
    quality: 'low'|'medium'|'high'|'ultra';
    format: Phase13VideoFormat;
    width: number;
    height: number;
  };
  pipeline: {
    trim?: { startTime: number; endTime: number };
    splices: Phase13Splice[];
    text: Phase13TextOverlay[];
    audio: Phase13AudioTrack[];
    keepOriginalAudio: boolean;
    originalVolume: number;
    durationPolicy: 'video'|'shortest'|'longest';
  };
  operations: Phase13Operation[];
  render: {
    format: Phase13VideoFormat;
    preset: 'preview'|'export';
  };
  inspect: {
    extractTimes: number[];
    thumbnails: number;
  };
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function recordFor(timeline: Phase13Timeline): VisualProjectRecord {
  return {
    id: 'video-timeline',
    kind: PHASE13_TIMELINE_KIND,
    name: 'Video timeline',
    value: clone(timeline) as unknown as Record<string, VisualValue>,
  };
}

export function defaultPhase13Timeline(): Phase13Timeline {
  return {
    mode: 'frames',
    frames: {
      items: [
        { id: 'video-frame-1', source: { kind: 'solid', color: '#0b1020', label: 'FRAME 01' } },
        { id: 'video-frame-2', source: { kind: 'solid', color: '#162b5f', label: 'FRAME 02' } },
      ],
      fps: 2,
      quality: 'medium',
      format: 'mp4',
      width: 640,
      height: 360,
    },
    pipeline: {
      splices: [],
      text: [],
      audio: [],
      keepOriginalAudio: true,
      originalVolume: 1,
      durationPolicy: 'video',
    },
    operations: [],
    render: { format: 'mp4', preset: 'preview' },
    inspect: { extractTimes: [], thumbnails: 0 },
  };
}

function asTimeline(record: VisualProjectRecord | undefined): Phase13Timeline | null {
  if (!record || record.kind !== PHASE13_TIMELINE_KIND) return null;
  if (!record.value || typeof record.value !== 'object' || Array.isArray(record.value)) return null;
  const value = record.value as unknown as Phase13Timeline;
  if (!['pipeline','frames','operations'].includes(value.mode)) return null;
  if (!value.frames || !Array.isArray(value.frames.items)) return null;
  if (!value.pipeline || !Array.isArray(value.pipeline.splices) || !Array.isArray(value.pipeline.text) || !Array.isArray(value.pipeline.audio)) return null;
  if (!Array.isArray(value.operations) || !value.render || !value.inspect || !Array.isArray(value.inspect.extractTimes)) return null;
  return value;
}

export function phase13Timeline(project: VisualProject): Phase13Timeline | null {
  return asTimeline(project.timelines.find((item) => item.kind === PHASE13_TIMELINE_KIND));
}

export function hasPhase13Authoring(project: VisualProject): boolean {
  return phase13Timeline(project) !== null;
}

export function setPhase13Timeline(project: VisualProject, timeline: Phase13Timeline): VisualProject {
  const next = clone(project);
  const index = next.timelines.findIndex((item) => item.kind === PHASE13_TIMELINE_KIND);
  const record = recordFor(timeline);
  if (index >= 0) next.timelines[index] = record;
  else next.timelines.push(record);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function ensurePhase13Timeline(project: VisualProject): VisualProject {
  return phase13Timeline(project) ? project : setPhase13Timeline(project, defaultPhase13Timeline());
}

function issue(issues: VisualProjectIssue[], code: string, path: string, message: string) {
  issues.push({ severity: 'error', code, path, message });
}
function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
function asset(assetId: unknown, issues: VisualProjectIssue[], path: string) {
  if (typeof assetId !== 'string' || !/^[A-Za-z0-9._-]{1,160}$/.test(assetId)) issue(issues,'phase13-asset',path,'Video asset id must be a valid Studio virtual-asset identifier.');
}
function nonNegative(value: unknown, issues: VisualProjectIssue[], path: string, label: string, max=14400) {
  if (!finite(value) || value < 0 || value > max) issue(issues,'phase13-range',path,label+' must be between 0 and '+max+'.');
}
function uniqueIds<T extends {id:string}>(items:T[], issues:VisualProjectIssue[], path:string) {
  const seen=new Set<string>();
  items.forEach((item,index)=>{
    if (!item.id || seen.has(item.id)) issue(issues,'phase13-id',path+'['+index+'].id','Video timeline ids must be non-empty and unique.');
    seen.add(item.id);
  });
}

export function validatePhase13Project(project: VisualProject): VisualProjectIssue[] {
  const issues: VisualProjectIssue[] = [];
  const records = project.timelines.filter((item)=>item.kind===PHASE13_TIMELINE_KIND);
  if (!records.length) return issues;
  if (records.length > 1) issue(issues,'phase13-timeline-count','timelines','Phase 13 supports one active video timeline per Visual Project.');
  const timeline=asTimeline(records[0]);
  if (!timeline) {
    issue(issues,'phase13-timeline','timelines','Video timeline has an invalid shape.');
    return issues;
  }

  if (timeline.mode !== 'frames') {
    if (!timeline.source) issue(issues,'phase13-source','timelines.video.source','Pipeline and operation modes require a source video asset.');
    else asset(timeline.source.assetId,issues,'timelines.video.source.assetId');
  }

  if (!finite(timeline.frames.fps) || timeline.frames.fps <= 0 || timeline.frames.fps > 240) issue(issues,'phase13-fps','timelines.video.frames.fps','Frame rate must be greater than 0 and at most 240.');
  if (!finite(timeline.frames.width) || timeline.frames.width < 1 || timeline.frames.width > 8192) issue(issues,'phase13-width','timelines.video.frames.width','Frame width must be between 1 and 8192.');
  if (!finite(timeline.frames.height) || timeline.frames.height < 1 || timeline.frames.height > 8192) issue(issues,'phase13-height','timelines.video.frames.height','Frame height must be between 1 and 8192.');
  if (!timeline.frames.items.length) issue(issues,'phase13-frames','timelines.video.frames.items','Frames mode requires at least one frame.');
  if (timeline.frames.items.length > 2000) issue(issues,'phase13-frames','timelines.video.frames.items','Frames mode exceeds the 2,000 frame safety limit.');
  uniqueIds(timeline.frames.items,issues,'timelines.video.frames.items');
  timeline.frames.items.forEach((frame,index)=>{
    if (frame.source.kind==='asset') asset(frame.source.assetId,issues,'timelines.video.frames.items['+index+'].source.assetId');
    else if (frame.source.kind==='solid') {
      if (typeof frame.source.color !== 'string' || !frame.source.color.trim()) issue(issues,'phase13-color','timelines.video.frames.items['+index+'].source.color','Generated frame color is required.');
    } else issue(issues,'phase13-frame-source','timelines.video.frames.items['+index+'].source.kind','Unknown video frame source.');
  });

  if (timeline.pipeline.trim) {
    nonNegative(timeline.pipeline.trim.startTime,issues,'timelines.video.pipeline.trim.startTime','Trim start');
    nonNegative(timeline.pipeline.trim.endTime,issues,'timelines.video.pipeline.trim.endTime','Trim end');
    if (finite(timeline.pipeline.trim.startTime) && finite(timeline.pipeline.trim.endTime) && timeline.pipeline.trim.endTime <= timeline.pipeline.trim.startTime) issue(issues,'phase13-trim','timelines.video.pipeline.trim','Trim end must be greater than trim start.');
  }
  uniqueIds(timeline.pipeline.splices,issues,'timelines.video.pipeline.splices');
  timeline.pipeline.splices.forEach((splice,index)=>{
    const path='timelines.video.pipeline.splices['+index+']';
    nonNegative(splice.targetStartTime,issues,path+'.targetStartTime','Splice start');
    nonNegative(splice.targetEndTime,issues,path+'.targetEndTime','Splice end');
    if (splice.targetEndTime <= splice.targetStartTime) issue(issues,'phase13-splice',path,'Splice end must be greater than start.');
    asset(splice.replacement.assetId,issues,path+'.replacement.assetId');
  });

  uniqueIds(timeline.pipeline.text,issues,'timelines.video.pipeline.text');
  timeline.pipeline.text.forEach((overlay,index)=>{
    const path='timelines.video.pipeline.text['+index+']';
    nonNegative(overlay.startTime,issues,path+'.startTime','Text start');
    nonNegative(overlay.endTime,issues,path+'.endTime','Text end');
    if (overlay.endTime <= overlay.startTime) issue(issues,'phase13-text-time',path,'Text end must be greater than start.');
    if (!overlay.text.trim()) issue(issues,'phase13-text',path+'.text','Text overlay cannot be empty.');
    if (!finite(overlay.fontSize) || overlay.fontSize <= 0 || overlay.fontSize > 512) issue(issues,'phase13-font-size',path+'.fontSize','Text font size must be between 1 and 512.');
  });

  uniqueIds(timeline.pipeline.audio,issues,'timelines.video.pipeline.audio');
  timeline.pipeline.audio.forEach((track,index)=>{
    const path='timelines.video.pipeline.audio['+index+']';
    nonNegative(track.startTime,issues,path+'.startTime','Audio start');
    if (track.type==='asset') asset(track.assetId,issues,path+'.assetId');
    if (track.type==='asset' && track.pan !== undefined && (!finite(track.pan) || track.pan < -1 || track.pan > 1)) issue(issues,'phase13-pan',path+'.pan','Audio pan must be between -1 and 1.');
  });
  if (!finite(timeline.pipeline.originalVolume) || timeline.pipeline.originalVolume < 0 || timeline.pipeline.originalVolume > 4) issue(issues,'phase13-volume','timelines.video.pipeline.originalVolume','Original audio volume must be between 0 and 4.');

  uniqueIds(timeline.operations,issues,'timelines.video.operations');
  timeline.operations.forEach((op,index)=>{
    const path='timelines.video.operations['+index+']';
    if (op.kind==='speed' && (!finite(op.speed) || op.speed <= 0 || op.speed > 16)) issue(issues,'phase13-speed',path+'.speed','Video speed must be greater than 0 and at most 16.');
    if (op.kind==='crop' && (![op.x,op.y,op.width,op.height].every(finite) || op.width <= 0 || op.height <= 0)) issue(issues,'phase13-crop',path,'Crop requires finite coordinates and positive dimensions.');
    if (op.kind==='pip') asset(op.overlayAssetId,issues,path+'.overlayAssetId');
    if (op.kind==='transition' && op.secondAssetId) asset(op.secondAssetId,issues,path+'.secondAssetId');
    if (op.kind==='freeze') { nonNegative(op.time,issues,path+'.time','Freeze time'); if (!finite(op.duration) || op.duration <= 0) issue(issues,'phase13-freeze',path+'.duration','Freeze duration must be positive.'); }
  });

  if (!['mp4','webm'].includes(timeline.render.format)) issue(issues,'phase13-format','timelines.video.render.format','Video format must be mp4 or webm.');
  if (!['preview','export'].includes(timeline.render.preset)) issue(issues,'phase13-preset','timelines.video.render.preset','Pipeline render preset must be preview or export.');
  if (!finite(timeline.inspect.thumbnails) || timeline.inspect.thumbnails < 0 || timeline.inspect.thumbnails > 100) issue(issues,'phase13-thumbnails','timelines.video.inspect.thumbnails','Thumbnail count must be between 0 and 100.');
  timeline.inspect.extractTimes.forEach((time,index)=>nonNegative(time,issues,'timelines.video.inspect.extractTimes['+index+']','Extract time'));
  return issues;
}
