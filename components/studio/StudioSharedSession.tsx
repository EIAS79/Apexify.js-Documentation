'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { StudioPreviewArtifact } from '@/components/studio/StudioArtifactPreview';
import type { OutputTab } from '@/components/studio/StudioOutputPanel';
import type { RunHistoryEntry } from '@/lib/studio/studioConfig';
import {
  loadPersistedStudioAssets,
  savePersistedStudioAssets,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';

type PreviewProvenance = 'browser-generated' | 'server-generated' | undefined;

export type StudioCodeHandoff = {
  id: string;
  name: string;
  source: string;
};

export type StudioSharedSessionValue = {
  assets: StudioVirtualAsset[];
  setAssets: Dispatch<SetStateAction<StudioVirtualAsset[]>>;
  assetStorageReady: boolean;
  setAssetStorageReady: Dispatch<SetStateAction<boolean>>;
  previewArtifacts: StudioPreviewArtifact[];
  setPreviewArtifacts: Dispatch<SetStateAction<StudioPreviewArtifact[]>>;
  activeArtifactId: string | null;
  setActiveArtifactId: Dispatch<SetStateAction<string | null>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  errorExitCode: number | null;
  setErrorExitCode: Dispatch<SetStateAction<number | null>>;
  elapsedMs: number | null;
  setElapsedMs: Dispatch<SetStateAction<number | null>>;
  previewProvenance: PreviewProvenance;
  setPreviewProvenance: Dispatch<SetStateAction<PreviewProvenance>>;
  previewWarnings: string[];
  setPreviewWarnings: Dispatch<SetStateAction<string[]>>;
  outputTab: OutputTab;
  setOutputTab: Dispatch<SetStateAction<OutputTab>>;
  history: RunHistoryEntry[];
  setHistory: Dispatch<SetStateAction<RunHistoryEntry[]>>;
  codeHandoff: StudioCodeHandoff | null;
  setCodeHandoff: Dispatch<SetStateAction<StudioCodeHandoff | null>>;
};

const StudioSharedSessionContext = createContext<StudioSharedSessionValue | null>(null);

export function StudioSharedSessionProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<StudioVirtualAsset[]>([]);
  const [assetStorageReady, setAssetStorageReady] = useState(false);
  const [previewArtifacts, setPreviewArtifacts] = useState<StudioPreviewArtifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorExitCode, setErrorExitCode] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [previewProvenance, setPreviewProvenance] = useState<PreviewProvenance>(undefined);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [outputTab, setOutputTab] = useState<OutputTab>('preview');
  const [history, setHistory] = useState<RunHistoryEntry[]>([]);
  const [codeHandoff, setCodeHandoff] = useState<StudioCodeHandoff | null>(null);
  const assetPersistTimerRef = useRef<number>(0);

  // Shared assets belong to the Studio session, not to Code mode. Hydrate and
  // persist them here so uploads made in Visual mode survive reloads even when
  // the Code editor is never opened.
  useEffect(() => {
    let cancelled = false;
    void loadPersistedStudioAssets()
      .then((stored) => {
        if (cancelled) return;
        setAssets(stored);
        setAssetStorageReady(true);
      })
      .catch(() => {
        if (!cancelled) setAssetStorageReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!assetStorageReady) return;
    window.clearTimeout(assetPersistTimerRef.current);
    assetPersistTimerRef.current = window.setTimeout(() => {
      void savePersistedStudioAssets(assets).catch(() => {
        // Persistence is best-effort; keep the active in-memory Studio session usable.
      });
    }, 120);
    return () => window.clearTimeout(assetPersistTimerRef.current);
  }, [assetStorageReady, assets]);

  const value = useMemo<StudioSharedSessionValue>(() => ({
    assets,
    setAssets,
    assetStorageReady,
    setAssetStorageReady,
    previewArtifacts,
    setPreviewArtifacts,
    activeArtifactId,
    setActiveArtifactId,
    error,
    setError,
    errorExitCode,
    setErrorExitCode,
    elapsedMs,
    setElapsedMs,
    previewProvenance,
    setPreviewProvenance,
    previewWarnings,
    setPreviewWarnings,
    outputTab,
    setOutputTab,
    history,
    setHistory,
    codeHandoff,
    setCodeHandoff,
  }), [
    assets,
    assetStorageReady,
    previewArtifacts,
    activeArtifactId,
    error,
    errorExitCode,
    elapsedMs,
    previewProvenance,
    previewWarnings,
    outputTab,
    history,
    codeHandoff,
  ]);

  return (
    <StudioSharedSessionContext.Provider value={value}>
      {children}
    </StudioSharedSessionContext.Provider>
  );
}

export function useStudioSharedSession(): StudioSharedSessionValue {
  const value = useContext(StudioSharedSessionContext);
  if (!value) throw new Error('useStudioSharedSession must be used inside StudioSharedSessionProvider');
  return value;
}
