'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { getGalleryItemById, plainGalleryDescription } from '@/lib/gallery/docs/galleryRegistry';
import { galleryDeepLink } from '@/lib/gallery/core/galleryDocLink';
import { GalleryPreview } from './GalleryPreview';
import { CodeSwitcher } from './CodeSwitcher';

type DocPreviewTab = 'both' | 'preview' | 'code';

export function PreviewWithCode({ id }: { id: string }) {
  const [tab, setTab] = useState<DocPreviewTab>('both');

  const item = getGalleryItemById(id);
  if (!item || !item.code) {
    return (
      <div className="my-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        Preview unavailable — this gallery item has no runnable sample on file.
      </div>
    );
  }

  const href = galleryDeepLink(item);
  const ts = item.code.ts?.trim();
  const js = item.code.js?.trim();

  const showPreview = tab === 'both' || tab === 'preview';
  const showCode = tab === 'both' || tab === 'code';

  const tabs: { key: DocPreviewTab; label: string }[] = [
    { key: 'both', label: 'Both' },
    { key: 'preview', label: 'Preview' },
    { key: 'code', label: 'Code' },
  ];

  return (
    <div className="my-8 rounded-2xl border border-slate-700/60 bg-slate-950/60 overflow-hidden">
      <div className="border-b border-slate-700/60 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between bg-slate-900/50">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{plainGalleryDescription(item.description, 180)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="inline-flex rounded-lg border border-slate-600/80 bg-slate-950/80 p-0.5"
            role="group"
            aria-label="Preview and code display mode"
          >
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  tab === key
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-sky-300"
          >
            Gallery
            <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Stacked layout: full-width preview, full-width code — avoids ultra-tall narrow code columns on split view */}
      <div className="p-4 flex flex-col gap-6">
        {showPreview ? (
          <div className="min-w-0 w-full">
            <GalleryPreview src={item.thumbnail} alt={item.title} thumbnailMedia={item.thumbnailMedia} />
          </div>
        ) : null}
        {showCode ? (
          <div className="min-w-0 w-full">
            <CodeSwitcher ts={ts} js={js} tsLabel="TypeScript" jsLabel="JavaScript" className="my-0" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
