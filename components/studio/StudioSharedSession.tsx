'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { StudioPreviewArtifact } from '@/components/studio/StudioArtifactPreview';
import type { OutputTab } from '@/components/studio/StudioOutputPanel';
import type { RunHistoryEntry } from '@/lib/studio/studioConfig';
import type { StudioVirtualAsset } from '@/lib/studio/runtime/assets';

type PreviewProvenance = 'browser-generated' | 'server-generated' | undefined;

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
