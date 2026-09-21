'use client';

import dynamic from 'next/dynamic';
import { CodeBracketIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import CodeStudio from '@/components/studio/CodeStudio';

export type StudioMode = 'code' | 'visual';

const VisualStudio = dynamic(() => import('@/components/studio/visual/VisualStudio'), {
  ssr: false,
  loading: () => (
    <div
      className="grid h-full min-h-0 place-items-center text-sm"
      style={{ color: 'var(--text-tertiary)', background: 'var(--bg-base)' }}
      role="status"
    >
      Loading Visual Studio…
    </div>
  ),
});

const MODE_STORAGE_KEY = 'apexify-studio-mode-v1';

export default function StudioShell() {
  const [mode, setMode] = useState<StudioMode>('code');
  const [visualVisited, setVisualVisited] = useState(false);

  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (persisted === 'visual') {
        setMode('visual');
        setVisualVisited(true);
      }
    } catch {}
  }, []);

  const chooseMode = (next: StudioMode) => {
    setMode(next);
    if (next === 'visual') setVisualVisited(true);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {}
  };

  return (
    <div
      className="apx-studio-shell flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden"
      data-studio-shell
      data-studio-mode={mode}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <div
        className="relative z-50 flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 sm:px-4"
        style={{
          borderBottom: '1px solid var(--border-default)',
          background: 'color-mix(in srgb, var(--bg-raised) 95%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--text-tertiary)' }}>
            Apexify.js
          </p>
          <p className="truncate text-sm font-bold">Studio</p>
        </div>

        <div
          className="ml-auto flex items-center rounded-lg p-1"
          role="tablist"
          aria-label="Studio authoring mode"
          style={{ border: '1px solid var(--border-default)', background: 'var(--bg-sunken)' }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'code'}
            data-studio-mode-tab="code"
            onClick={() => chooseMode('code')}
            className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors"
            style={{
              background: mode === 'code' ? 'var(--studio-blue)' : 'transparent',
              color: mode === 'code' ? 'var(--studio-action-ink)' : 'var(--text-secondary)',
            }}
          >
            <CodeBracketIcon className="h-4 w-4" aria-hidden />
            Code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'visual'}
            data-studio-mode-tab="visual"
            onClick={() => chooseMode('visual')}
            className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors"
            style={{
              background: mode === 'visual' ? 'var(--studio-blue)' : 'transparent',
              color: mode === 'visual' ? 'var(--studio-action-ink)' : 'var(--text-secondary)',
            }}
          >
            <PaintBrushIcon className="h-4 w-4" aria-hidden />
            Visual
          </button>
        </div>
      </div>

      <section
        className="min-h-0 flex-1"
        role="tabpanel"
        aria-label="Code Studio"
        hidden={mode !== 'code'}
        data-studio-code-panel
      >
        <CodeStudio embedded />
      </section>

      {visualVisited ? (
        <section
          className="min-h-0 flex-1"
          role="tabpanel"
          aria-label="Visual Studio"
          hidden={mode !== 'visual'}
          data-studio-visual-panel
        >
          <VisualStudio active={mode === 'visual'} />
        </section>
      ) : null}
    </div>
  );
}
