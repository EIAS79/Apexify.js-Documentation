'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import CodeStudio from '@/components/studio/CodeStudio';
import type { StudioMode } from '@/components/studio/StudioModeSwitch';
import { StudioSharedSessionProvider } from '@/components/studio/StudioSharedSession';

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

export default function StudioShell({
  initialMode = 'code',
  legacy = false,
}: {
  initialMode?: StudioMode;
  legacy?: boolean;
} = {}) {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [visualVisited, setVisualVisited] = useState(initialMode === 'visual');

  useEffect(() => {
    // Explicit legacy deep links must not be overridden by last-used /studio mode.
    if (legacy) return;
    try {
      const persisted = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (persisted === 'visual') {
        setMode('visual');
        setVisualVisited(true);
      }
    } catch {}
  }, [legacy]);

  const chooseMode = (next: StudioMode) => {
    setMode(next);
    if (next === 'visual') setVisualVisited(true);
    if (!legacy) {
      try {
        window.localStorage.setItem(MODE_STORAGE_KEY, next);
      } catch {}
    }
  };

  return (
    <StudioSharedSessionProvider>
    <div
      className="apx-studio-shell apx-studio-night flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden"
      data-studio-shell
      data-studio-mode={mode}
      data-legacy-studio={legacy ? 'true' : undefined}
      style={{ background: '#0d1118', color: '#eef2f6' }}
    >
      {legacy ? (
        <nav
          aria-label="Legacy Studio access"
          className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-2 text-xs sm:px-5"
          style={{ borderColor: 'var(--border-default)', background: '#1b211a', color: '#edf3e7' }}
        >
          <strong style={{ color: '#d5ff5f' }}>Legacy Studio</strong>
          <span>Preserved Code and Visual workspaces while the unified Studio is developed.</span>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/studio/legacy/code" aria-current={initialMode === 'code' ? 'page' : undefined}>Code</Link>
            <Link href="/studio/legacy/visual" aria-current={initialMode === 'visual' ? 'page' : undefined}>Visual</Link>
            <Link href="/studio">Studio home</Link>
          </div>
        </nav>
      ) : null}
      <section
        className="min-h-0 flex-1"
        id="studio-code-panel"
        role="tabpanel"
        aria-label="Code Studio"
        hidden={mode !== 'code'}
        data-studio-code-panel
      >
        <CodeStudio embedded mode={mode} onModeChange={chooseMode} />
      </section>

      {visualVisited ? (
        <section
          className="min-h-0 flex-1"
          id="studio-visual-panel"
          role="tabpanel"
          aria-label="Visual Studio"
          hidden={mode !== 'visual'}
          data-studio-visual-panel
        >
          <VisualStudio active={mode === 'visual'} mode={mode} onModeChange={chooseMode} />
        </section>
      ) : null}
    </div>
    </StudioSharedSessionProvider>
  );
}
