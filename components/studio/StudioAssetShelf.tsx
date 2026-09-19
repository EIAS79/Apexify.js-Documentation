'use client';

import { useRef, useState } from 'react';
import {
  ArrowUpTrayIcon,
  ClipboardDocumentIcon,
  DocumentIcon,
  MusicalNoteIcon,
  PhotoIcon,
  TrashIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import {
  STUDIO_ASSET_LIMITS,
  fileToStudioAsset,
  studioAssetQuotedReference,
  totalStudioAssetBytes,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';

type Props = {
  assets: StudioVirtualAsset[];
  onChange: (next: StudioVirtualAsset[]) => void;
  onNotice: (kind: 'info' | 'success' | 'warning', text: string) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <PhotoIcon className="h-4 w-4" aria-hidden />;
  if (mime.startsWith('audio/')) return <MusicalNoteIcon className="h-4 w-4" aria-hidden />;
  if (mime.startsWith('video/')) return <VideoCameraIcon className="h-4 w-4" aria-hidden />;
  return <DocumentIcon className="h-4 w-4" aria-hidden />;
}

export function StudioAssetShelf({ assets, onChange, onNotice }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (!incoming.length) return;

    if (assets.length + incoming.length > STUDIO_ASSET_LIMITS.maxCount) {
      onNotice('warning', `Studio accepts at most ${STUDIO_ASSET_LIMITS.maxCount} virtual assets per session.`);
      return;
    }

    try {
      const created: StudioVirtualAsset[] = [];
      let total = totalStudioAssetBytes(assets);

      for (const file of incoming) {
        const asset = await fileToStudioAsset(file);
        total += asset.size;
        if (total > STUDIO_ASSET_LIMITS.maxTotalBytes) {
          throw new Error('Combined Studio assets exceed the 24 MiB session limit.');
        }
        created.push(asset);
      }

      onChange([...assets, ...created]);
      onNotice(
        'success',
        `Added ${created.length} Studio asset${created.length === 1 ? '' : 's'}.`,
      );
    } catch (error) {
      onNotice('warning', error instanceof Error ? error.message : 'Could not add Studio asset.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const copyReference = (asset: StudioVirtualAsset) => {
    const reference = studioAssetQuotedReference(asset);
    void navigator.clipboard.writeText(reference).then(
      () => onNotice('success', `Copied ${reference}`),
      () => onNotice('warning', 'Clipboard access was blocked.'),
    );
  };

  return (
    <section
      className="studio-assets shrink-0 px-3 py-2 sm:px-4"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'color-mix(in srgb, var(--bg-sunken) 82%, transparent)',
      }}
      aria-label="Studio virtual assets"
    >
      <div className="mx-auto flex max-w-[1800px] items-stretch gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void addFiles(event.dataTransfer.files);
          }}
          className="flex min-w-[185px] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold"
          style={{
            border: `1px ${dragging ? 'solid var(--studio-mint)' : 'dashed var(--border-strong)'}`,
            background: dragging
              ? 'color-mix(in srgb, var(--studio-mint) 10%, var(--bg-raised))'
              : 'var(--bg-raised)',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowUpTrayIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Add media
            <small className="mt-0.5 block font-normal" style={{ color: 'var(--text-tertiary)' }}>
              image · audio · video · font
            </small>
          </span>
          <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            accept="image/*,audio/*,video/*,.ttf,.otf,.woff,.woff2"
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
            }}
          />
        </button>

        {assets.length === 0 ? (
          <div
            className="flex min-w-[260px] items-center rounded-xl px-3 py-2 text-xs"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}
          >
            Upload a file, copy its <code className="mx-1">studio://asset/…</code> reference, and use
            that string anywhere Apexify accepts the matching media source.
          </div>
        ) : (
          assets.map((asset) => (
            <article
              key={asset.id}
              className="flex min-w-[230px] max-w-[310px] shrink-0 items-center gap-2 rounded-xl px-3 py-2"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ background: 'var(--bg-sunken)', color: 'var(--studio-blue-2)' }}
              >
                <AssetIcon mime={asset.mime} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs" title={asset.name}>
                  {asset.name}
                </strong>
                <span className="block truncate text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {asset.mime} · {formatBytes(asset.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => copyReference(asset)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                title="Copy Studio asset reference"
                aria-label={`Copy reference for ${asset.name}`}
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              >
                <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChange(assets.filter((item) => item.id !== asset.id))}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                title="Remove asset"
                aria-label={`Remove ${asset.name}`}
                style={{ color: 'var(--text-tertiary)' }}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
              </button>
            </article>
          ))
        )}

        <div
          className="ml-auto flex shrink-0 items-center px-2 text-[10px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {assets.length}/{STUDIO_ASSET_LIMITS.maxCount} · {formatBytes(totalStudioAssetBytes(assets))}
        </div>
      </div>
    </section>
  );
}
