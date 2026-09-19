'use client';

import { useEffect, useMemo, useState } from 'react';
import type { InteractiveArtifact } from '@/lib/docs/playground/contracts';
import { StudioPreviewZoom } from './StudioPreviewZoom';

export type StudioPreviewArtifact = InteractiveArtifact & {
  url: string | null;
};

function numberMeta(artifact: StudioPreviewArtifact, key: string): number | null {
  const value = artifact.metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringMeta(artifact: StudioPreviewArtifact, key: string): string | null {
  const value = artifact.metadata?.[key];
  return typeof value === 'string' && value ? value : null;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds < 0) return null;
  if (seconds < 10) return `${seconds.toFixed(2)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function formatBytes(bytes: number | null): string | null {
  if (bytes == null || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MetadataBar({
  artifact,
  runtime,
}: {
  artifact: StudioPreviewArtifact;
  runtime?: { width?: number; height?: number; duration?: number };
}) {
  const width = runtime?.width ?? numberMeta(artifact, 'width');
  const height = runtime?.height ?? numberMeta(artifact, 'height');
  const duration = runtime?.duration ?? numberMeta(artifact, 'duration');
  const frameCount = numberMeta(artifact, 'frameCount');
  const sampleRate = numberMeta(artifact, 'sampleRate');
  const channels = numberMeta(artifact, 'channels');
  const bytes = numberMeta(artifact, 'bytes');
  const frameTime = numberMeta(artifact, 'time');
  const frameNumber = numberMeta(artifact, 'frameNumber');

  const items = [
    width && height ? `${width}×${height}` : null,
    formatDuration(duration),
    frameCount ? `${frameCount} frame${frameCount === 1 ? '' : 's'}` : null,
    sampleRate ? `${Math.round(sampleRate / 100) / 10} kHz` : null,
    channels ? `${channels} ch` : null,
    frameNumber != null ? `frame ${frameNumber}` : null,
    frameTime != null ? `t=${frameTime.toFixed(3)}s` : null,
    formatBytes(bytes),
  ].filter((value): value is string => Boolean(value));

  if (!items.length) return null;

  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-1.5 px-3 py-2 text-[10px]"
      style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
    >
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md px-2 py-1"
          style={{ border: '1px solid var(--border-default)', background: 'var(--bg-sunken)' }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function FrameSequenceRail({
  artifact,
  artifacts,
  onSelect,
}: {
  artifact: StudioPreviewArtifact;
  artifacts: StudioPreviewArtifact[];
  onSelect?: (id: string) => void;
}) {
  const collectionId = stringMeta(artifact, 'collectionId');
  if (!collectionId) return null;

  const frames = artifacts
    .filter((item) => stringMeta(item, 'collectionId') === collectionId)
    .sort(
      (a, b) =>
        (numberMeta(a, 'sequenceIndex') ?? 0) - (numberMeta(b, 'sequenceIndex') ?? 0),
    );

  if (frames.length <= 1) return null;

  return (
    <div
      className="flex shrink-0 gap-2 overflow-x-auto px-3 py-2"
      style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-sunken)' }}
      aria-label="Frame sequence"
    >
      {frames.map((frame, index) => (
        <button
          key={frame.id}
          type="button"
          onClick={() => onSelect?.(frame.id)}
          className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg text-left"
          style={{
            border:
              frame.id === artifact.id
                ? '1px solid var(--studio-blue-2)'
                : '1px solid var(--border-default)',
            background: 'var(--bg-raised)',
          }}
          title={`Frame ${index + 1} of ${frames.length}`}
        >
          {frame.url && (frame.kind === 'image' || frame.kind === 'gif') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={frame.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-[10px]">Frame {index + 1}</span>
          )}
          <span
            className="absolute bottom-1 right-1 rounded px-1 text-[9px]"
            style={{ background: 'rgba(0,0,0,.68)', color: '#fff' }}
          >
            {index + 1}/{frames.length}
          </span>
        </button>
      ))}
    </div>
  );
}

export function StudioArtifactPreview({
  artifact,
  artifacts = [],
  onArtifactSelect,
}: {
  artifact: StudioPreviewArtifact;
  artifacts?: StudioPreviewArtifact[];
  onArtifactSelect?: (id: string) => void;
}) {
  const [runtimeMetadata, setRuntimeMetadata] = useState<{
    width?: number;
    height?: number;
    duration?: number;
  }>({});

  const mediaKey = useMemo(() => `${artifact.id}:${artifact.url ?? ''}`, [artifact.id, artifact.url]);

  useEffect(() => {
    setRuntimeMetadata({});
  }, [mediaKey]);

  if ((artifact.kind === 'image' || artifact.kind === 'gif') && artifact.url) {
    return (
      <div key={mediaKey} className="flex h-full min-h-0 flex-col">
        <MetadataBar artifact={artifact} />
        <div className="min-h-0 flex-1">
          <StudioPreviewZoom src={artifact.url} alt={artifact.name || 'Generated Studio output'} />
        </div>
        <FrameSequenceRail artifact={artifact} artifacts={artifacts} onSelect={onArtifactSelect} />
      </div>
    );
  }

  if (artifact.kind === 'audio' && artifact.url) {
    return (
      <div key={mediaKey} className="flex h-full min-h-0 flex-col">
        <MetadataBar artifact={artifact} runtime={runtimeMetadata} />
        <div className="grid min-h-[220px] flex-1 place-items-center p-6">
          <div
            className="w-full max-w-xl rounded-2xl p-5"
            style={{ border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}
          >
            <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {artifact.name}
            </p>
            <audio
              className="w-full"
              controls
              preload="metadata"
              src={artifact.url}
              onLoadedMetadata={(event) => {
                const duration = event.currentTarget.duration;
                setRuntimeMetadata({
                  duration: Number.isFinite(duration) ? duration : undefined,
                });
              }}
            >
              Your browser does not support audio playback.
            </audio>
            <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{artifact.mime}</p>
          </div>
        </div>
      </div>
    );
  }

  if (artifact.kind === 'video' && artifact.url) {
    return (
      <div key={mediaKey} className="flex h-full min-h-0 flex-col">
        <MetadataBar artifact={artifact} runtime={runtimeMetadata} />
        <div className="grid min-h-[260px] flex-1 place-items-center overflow-auto p-4">
          <video
            className="max-h-full max-w-full rounded-xl"
            style={{ border: '1px solid var(--border-default)', background: '#000' }}
            controls
            playsInline
            preload="metadata"
            src={artifact.url}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              setRuntimeMetadata({
                width: video.videoWidth || undefined,
                height: video.videoHeight || undefined,
                duration: Number.isFinite(video.duration) ? video.duration : undefined,
              });
            }}
          >
            Your browser does not support video playback.
          </video>
        </div>
      </div>
    );
  }

  if (artifact.kind === 'json' || artifact.kind === 'text') {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MetadataBar artifact={artifact} />
        <div className="min-h-[220px] flex-1 overflow-auto p-4">
          <pre
            className="min-h-full whitespace-pre-wrap break-words rounded-xl p-4 text-xs leading-6"
            style={{
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            {artifact.text ?? ''}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MetadataBar artifact={artifact} />
      <div className="grid min-h-[220px] flex-1 place-items-center p-6 text-center">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{artifact.name}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {artifact.mime || 'application/octet-stream'} · binary output
          </p>
        </div>
      </div>
    </div>
  );
}
