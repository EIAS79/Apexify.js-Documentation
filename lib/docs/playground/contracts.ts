export type InteractiveLanguage = 'ts' | 'js';
export type InteractiveRuntime = 'node' | 'web' | 'react' | 'next-server' | 'next-client' | 'shared';
export type DiagnosticSeverity = 'info' | 'warning' | 'error';
export type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported' | 'stale' | 'resetting';

export interface InteractiveDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  source?: string;
  line?: number;
  column?: number;
  code?: string;
  help?: string;
}

export interface InteractiveSession {
  schemaVersion: 1;
  source: string;
  language: InteractiveLanguage;
  runtime: InteractiveRuntime;
  options: Record<string, unknown>;
  selectedFile?: string;
  layout?: { activePanel?: string };
}

export interface InteractiveResourceLimits {
  executionMs: number;
  sourceChars: number;
  outputBytes: number;
  totalOutputBytes: number;
  processBufferBytes: number;
  shareStateBytes: number;
  maxOutputs: number;
}

/**
 * One DOC-8 limit model shared by the UI contracts and the current Node runner.
 * These values preserve the live runner's pre-DOC-8 source/output/process ceilings;
 * the share-state ceiling is intentionally much smaller because it can land in a URL.
 */
export const DOC8_RESOURCE_LIMITS: Readonly<InteractiveResourceLimits> = Object.freeze({
  executionMs: 55_000,
  sourceChars: 280_000,
  outputBytes: 32 * 1024 * 1024,
  totalOutputBytes: 64 * 1024 * 1024,
  processBufferBytes: 20 * 1024 * 1024,
  shareStateBytes: 64 * 1024,
  maxOutputs: 24,
});

export interface ExecutionInput {
  session: InteractiveSession;
  signal?: AbortSignal;
}

export type InteractiveArtifactKind =
  | 'image'
  | 'gif'
  | 'audio'
  | 'video'
  | 'json'
  | 'text'
  | 'binary';

export interface InteractiveArtifact {
  id: string;
  name: string;
  kind: InteractiveArtifactKind;
  mime: string;
  base64?: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionOutput {
  mime: string;
  base64?: string;
  url?: string;
  provenance?: string;
  artifacts?: InteractiveArtifact[];
  primaryArtifactId?: string;
}

export interface ExecutionResult {
  status: 'ready' | 'error' | 'unsupported';
  output?: ExecutionOutput;
  diagnostics: InteractiveDiagnostic[];
  elapsedMs?: number;
}

export interface ExecutionAdapter {
  readonly id: string;
  readonly runtime: InteractiveRuntime;
  readonly mode: 'verified-static' | 'server-backed' | 'future-browser' | 'fixture';
  run(input: ExecutionInput): Promise<ExecutionResult>;
  reset?(): Promise<void>;
  dispose?(): Promise<void>;
}

/** Shared browser-runtime contract. Studio uses the pinned @apexify/web implementation; ordinary DOC-8 examples remain independently gated. */
export interface WebRuntimeAdapter {
  mount(target: HTMLElement, session: InteractiveSession): Promise<void>;
  update(session: InteractiveSession): Promise<void>;
  diagnostics(): InteractiveDiagnostic[];
  reset(): Promise<void>;
  dispose(): Promise<void>;
  capabilities(): Readonly<Record<string, boolean | string | number>>;
}

export interface AnimationPlaybackState {
  durationMs: number;
  delayMs: number;
  easing: string;
  repeat: number;
  playbackRate: number;
  property: string;
  paused: boolean;
  positionMs: number;
  reducedMotion: boolean;
}

/** Adapter boundary only. The actual animation engine remains Phase 15+ work. */
export interface AnimationRuntimeAdapter {
  mount(target: HTMLElement, session: InteractiveSession): Promise<void>;
  update(session: InteractiveSession, playback: AnimationPlaybackState): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  diagnostics(): InteractiveDiagnostic[];
  reset(): Promise<void>;
  dispose(): Promise<void>;
  capabilities(): Readonly<Record<string, boolean | string | number>>;
}
