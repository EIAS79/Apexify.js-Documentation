'use client';

import type { InteractiveArtifact } from '@/lib/docs/playground/contracts';
import { StudioPreviewZoom } from './StudioPreviewZoom';

export type StudioPreviewArtifact = InteractiveArtifact & {
  url: string | null;
};

export function StudioArtifactPreview({ artifact }: { artifact: StudioPreviewArtifact }) {
  if ((artifact.kind === 'image' || artifact.kind === 'gif') && artifact.url) {
    return <StudioPreviewZoom src={artifact.url} alt={artifact.name || 'Generated Studio output'} />;
  }

  if (artifact.kind === 'audio' && artifact.url) {
    return (
      <div className="grid h-full min-h-[220px] place-items-center p-6">
        <div
          className="w-full max-w-xl rounded-2xl p-5"
          style={{ border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}
        >
          <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {artifact.name}
          </p>
          <audio className="w-full" controls preload="metadata" src={artifact.url}>
            Your browser does not support audio playback.
          </audio>
          <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{artifact.mime}</p>
        </div>
      </div>
    );
  }

  if (artifact.kind === 'video' && artifact.url) {
    return (
      <div className="grid h-full min-h-[260px] place-items-center overflow-auto p-4">
        <video
          className="max-h-full max-w-full rounded-xl"
          style={{ border: '1px solid var(--border-default)', background: '#000' }}
          controls
          playsInline
          preload="metadata"
          src={artifact.url}
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (artifact.kind === 'json' || artifact.kind === 'text') {
    return (
      <div className="h-full min-h-[220px] overflow-auto p-4">
        <pre
          className="min-h-full whitespace-pre-wrap break-words rounded-xl p-4 text-xs leading-6"
          style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
        >
          {artifact.text ?? ''}
        </pre>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-[220px] place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{artifact.name}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {artifact.mime || 'application/octet-stream'} · binary output
        </p>
      </div>
    </div>
  );
}
