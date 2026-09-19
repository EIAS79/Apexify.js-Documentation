'use client';

import { useRef } from 'react';
import {
  ClipboardDocumentIcon,
  FolderOpenIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { StudioAsset } from '@/lib/studio/runtime/assets';
import {
  STUDIO_ASSET_LIMITS,
  studioAssetPath,
} from '@/lib/studio/runtime/assets';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StudioAssetsPanel({
  open,
  assets,
  onClose,
  onFiles,
  onRemove,
  onClear,
  onCopyPath,
}: {
  open: boolean;
  assets: StudioAsset[];
  onClose: () => void;
  onFiles: (files: FileList) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopyPath: (asset: StudioAsset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/45 backdrop-blur-[2px]" role="presentation" onMouseDown={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col"
        style={{ background: 'var(--bg-raised)', borderLeft: '1px solid var(--border-default)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Studio assets"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-4 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div>
            <div className="flex items-center gap-2">
              <FolderOpenIcon className="h-4 w-4" aria-hidden style={{ color: 'var(--studio-blue-2)' }} />
              <h2 className="text-sm font-bold">Session assets</h2>
            </div>
            <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>
              Uploaded files are temporary. Full-runtime snippets can read them from <code>assets/&lt;filename&gt;</code>.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2" aria-label="Close assets">
            <XMarkIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,audio/*,video/*,.ttf,.otf,.woff,.woff2,.json,.txt"
            onChange={(event) => {
              if (event.target.files?.length) onFiles(event.target.files);
              event.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
            style={{ background: 'var(--studio-action)', color: 'var(--studio-action-ink)' }}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            Add files
          </button>
          {assets.length ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
              style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <TrashIcon className="h-4 w-4" aria-hidden />
              Clear
            </button>
          ) : null}
          <span className="ml-auto text-[10px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
            {assets.length}/{STUDIO_ASSET_LIMITS.maxAssets} · {formatBytes(totalBytes)}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {!assets.length ? (
            <div
              className="grid min-h-48 place-items-center rounded-xl border border-dashed p-6 text-center"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}
            >
              <div>
                <FolderOpenIcon className="mx-auto h-7 w-7" aria-hidden />
                <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No uploaded assets</p>
                <p className="mt-1 text-xs leading-5">Add an image, audio clip, video, font, JSON, or text file.</p>
              </div>
            </div>
          ) : (
            <ul className="grid gap-2">
              {assets.map((asset) => (
                <li
                  key={asset.id}
                  className="rounded-xl p-3"
                  style={{ border: '1px solid var(--border-default)', background: 'var(--bg-sunken)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{asset.name}</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {asset.mime} · {formatBytes(asset.size)}
                      </p>
                      <code className="mt-2 block truncate text-[11px]" style={{ color: 'var(--studio-mint)' }}>
                        {studioAssetPath(asset)}
                      </code>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1.5"
                      onClick={() => onRemove(asset.id)}
                      aria-label={`Remove ${asset.name}`}
                      title="Remove asset"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopyPath(asset)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
                    style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" aria-hidden />
                    Copy virtual path
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 text-[10px] leading-5" style={{ borderTop: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}>
          Limits: {STUDIO_ASSET_LIMITS.maxAssets} files · {Math.round(STUDIO_ASSET_LIMITS.maxAssetBytes / 1024 / 1024)} MiB each · {Math.round(STUDIO_ASSET_LIMITS.maxTotalBytes / 1024 / 1024)} MiB total.
        </div>
      </aside>
    </div>
  );
}
