'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '@/components/ThemeToggle';

const FrameTheme = createContext<{ light: boolean; toggle: () => void } | null>(null);

export function DocsFrame({ children }: { children: ReactNode }) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    try { setLight(localStorage.getItem('apexify.docs.frame.theme') === 'light'); } catch { /* Optional preference. */ }
  }, []);
  function toggle() {
    setLight(current => {
      try { localStorage.setItem('apexify.docs.frame.theme', current ? 'dark' : 'light'); } catch { /* Optional preference. */ }
      return !current;
    });
  }
  return <FrameTheme.Provider value={{ light, toggle }}><div className="apx-doc-root" data-frame-theme={light ? 'light' : 'dark'}>{children}</div></FrameTheme.Provider>;
}

export function DocsFrameThemeToggle() {
  const frame = useContext(FrameTheme);
  if (!frame) return <ThemeToggle />;
  return <button type="button" className="apx-icon-button frame-doc-theme" aria-label={frame.light ? 'Use dark documentation theme' : 'Use light documentation theme'} onClick={frame.toggle}>{frame.light ? <MoonIcon /> : <SunIcon />}</button>;
}
