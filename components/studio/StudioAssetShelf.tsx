'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowDownOnSquareIcon,
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
  isStudioFontAsset,
  studioAssetDataUrl,
  studioAssetFontFamily,
  studioAssetQuotedReference,
  totalStudioAssetBytes,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';

type Props = {
  assets: StudioVirtualAsset[];
  onChange: (next: StudioVirtualAsset[]) => void;
  onInsertReference: (text: string) => void;
  onNotice: (kind: 'info' | 'success' | 'warning', text: string) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(value: number | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function metadataLabel(asset: StudioVirtualAsset): string {
  const bits = [asset.mime, formatBytes(asset.size)];
  if (asset.metadata?.width && asset.metadata?.height) {
    bits.push(`${asset.metadata.width}×${asset.metadata.height}`);
  }
  const duration = formatDuration(asset.metadata?.duration);
  if (duration) bits.push(duration);
  if (isStudioFontAsset(asset)) bits.push(`family: ${studioAssetFontFamily(asset)}`);
  return bits.join(' · ');
}

function AssetIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <PhotoIcon className="h-4 w-4" aria-hidden />;
  if (mime.startsWith('audio/')) return <MusicalNoteIcon className="h-4 w-4" aria-hidden />;
  if (mime.startsWith('video/')) return <VideoCameraIcon className="h-4 w-4" aria-hidden />;
  return <DocumentIcon className="h-4 w-4" aria-hidden />;
}

function AssetPreview({ asset }: { asset: StudioVirtualAsset }) {
  const dataUrl = useMemo(() => studioAssetDataUrl(asset), [asset]);

  if (asset.mime.startsWith('image/')) {
    return (
      <img
        src={dataUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
        style={{ border: '1px solid var(--border-default)', background: 'var(--bg-sunken)' }}
      />
    );
  }

  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
      style={{ background: 'var(--bg-sunken)', color: 'var(--studio-blue-2)' }}
    >
      <AssetIcon mime={asset.mime} />
    </span>
  );
}

export function StudioAssetShelf({
  assets,
  onChange,
  onInsertReference,
  onNotice,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (!incoming.length) return;

    if (assets.length + incoming.length > STUDIO_ASSET_LIMITS.maxCount) {
      onNotice(
        'warning',
        `Studio accepts at most ${STUDIO_ASSET_LIMITS.maxCount} virtual assets per session.`,
      );
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
    const value = isStudioFontAsset(asset)
      ? JSON.stringify(studioAssetFontFamily(asset))
      : studioAssetQuotedReference(asset);
    void navigator.clipboard.writeText(value).then(
      () => onNotice('success', `Copied ${value}`),
      () => onNotice('warning', 'Clipboard access was blocked.'),
    );
  };

  const insertReference = (asset: StudioVirtualAsset) => {
    const value = isStudioFontAsset(asset)
      ? JSON.stringify(studioAssetFontFamily(asset))
      : studioAssetQuotedReference(asset);
    onInsertReference(value);
    onNotice(
      'success',
      isStudioFontAsset(asset)
        ? `Inserted font family ${studioAssetFontFamily(asset)}.`
        : 'Inserted Studio asset reference at the cursor.',
    );
  };

  return (
    <section
      className="studio-assets relative shrink-0 px-3 py-2 sm:px-4"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: dragging
          ? 'color-mix(in srgb, var(--studio-mint) 8%, var(--bg-sunken))'
          : 'color-mix(in srgb, var(--bg-sunken) 82%, transparent)',
      }}
      aria-label="Studio virtual assets"
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepthRef.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepthRef.current = 0;
        setDragging(false);
        void addFiles(event.dataTransfer.files);
      }}
    >
      {dragging ? (
        <div
          className="pointer-events-none absolute inset-1 z-10 grid place-items-center rounded-xl text-sm font-bold"
          style={{
            border: '2px dashed var(--studio-mint)',
            background: 'color-mix(in srgb, var(--bg-base) 82%, transparent)',
            color: 'var(--studio-mint)',
          }}
        >
          Drop media into Studio
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1800px] items-stretch gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-w-[185px] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold"
          style={{
            border: '1px dashed var(--border-strong)',
            background: 'var(--bg-raised)',
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
            className="flex min-w-[300px] items-center rounded-xl px-3 py-2 text-xs"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}
          >
            Upload or drop media here. Assets persist in this browser and expose stable{' '}
            <code className="mx-1">studio://asset/…</code> references. Uploaded fonts register
            automatically under their filename family.
          </div>
        ) : (
          assets.map((asset) => (
            <article
              key={asset.id}
              className="flex min-w-[285px] max-w-[370px] shrink-0 items-center gap-2 rounded-xl px-3 py-2"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}
            >
              <AssetPreview asset={asset} />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs" title={asset.name}>
                  {asset.name}
                </strong>
                <span
                  className="block truncate text-[10px]"
                  title={metadataLabel(asset)}
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {metadataLabel(asset)}
                </span>
              </span>

              <button
                type="button"
                onClick={() => insertReference(asset)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                title={isStudioFontAsset(asset) ? 'Insert font family at cursor' : 'Insert asset reference at cursor'}
                aria-label={`Insert ${asset.name} into editor`}
                style={{ color: 'var(--studio-mint)', border: '1px solid var(--border-default)' }}
              >
                <ArrowDownOnSquareIcon className="h-4 w-4" aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => copyReference(asset)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                title={isStudioFontAsset(asset) ? 'Copy font family' : 'Copy Studio asset reference'}
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
