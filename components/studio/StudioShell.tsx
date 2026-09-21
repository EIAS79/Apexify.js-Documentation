'use client';

import dynamic from 'next/dynamic';
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
    <StudioSharedSessionProvider>
    <div
      className="apx-studio-shell apx-studio-night flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden"
      data-studio-shell
      data-studio-mode={mode}
      style={{ background: '#0d1118', color: '#eef2f6' }}
    >
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
