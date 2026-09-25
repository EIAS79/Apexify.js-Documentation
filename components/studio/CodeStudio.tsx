'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createApexifyWebRuntime, type ApexifyWebRuntime } from '@apexify/web';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { GallerySnippetEditor } from '@/app/gallery/components/GallerySnippetEditor';
import { StudioAssetShelf } from '@/components/studio/StudioAssetShelf';
import { StudioCommandPalette } from '@/components/studio/StudioCommandPalette';
import { StudioFileTabs } from '@/components/studio/StudioFileTabs';
import { StudioOutputPanel } from '@/components/studio/StudioOutputPanel';
import type { StudioPreviewArtifact } from '@/components/studio/StudioArtifactPreview';
import { StudioResizableSplit } from '@/components/studio/StudioResizableSplit';
import { StudioShortcutOverlay } from '@/components/studio/StudioShortcutOverlay';
import { StudioStatusBar } from '@/components/studio/StudioStatusBar';
import { StudioTopBar } from '@/components/studio/StudioTopBar';
import type { StudioMode } from '@/components/studio/StudioModeSwitch';
import { useStudioSharedSession } from '@/components/studio/StudioSharedSession';
import { createInteractiveSession } from '@/lib/docs/playground/session';
import type { InteractiveArtifact } from '@/lib/docs/playground/contracts';
import {
  currentNodeServerExecutionAdapter,
  getServerExecutionAvailability,
} from '@/lib/docs/playground/serverClientAdapter';
import {
  LayoutMode,
  RunHistoryEntry,
  STUDIO_STARTER_JS,
  STUDIO_STARTER_TS,
  StudioActionId,
  StudioBuffer,
  StudioLang,
  StudioTemplate,
  bufferFromTemplate,
  createBlankBuffer,
  makeId,
} from '@/lib/studio/studioConfig';
import { planStudioExecution } from '@/lib/studio/runtime/capabilities';
import { studioWorkspaceFileName, type StudioWorkspaceFile } from '@/lib/studio/runtime/workspace';
import {
  bootstrapStudio,
  encodeShareLink,
  loadRunHistory,
  pushRunHistory,
  saveRunHistory,
  savePersistedStudio,
} from '@/lib/studio/studioStorage';

type Toast = { kind: 'info' | 'success' | 'warning'; text: string } | null;

export default function CodeStudio({ embedded = false, mode = 'code', onModeChange }: { embedded?: boolean; mode?: StudioMode; onModeChange?: (mode: StudioMode) => void }) {
  const [hydrated, setHydrated] = useState(false);
  const [buffers, setBuffers] = useState<StudioBuffer[]>([]);
  const [activeBufferId, setActiveBufferId] = useState<string>('');
  const [lang, setLang] = useState<StudioLang>('ts');
  const [layout, setLayout] = useState<LayoutMode>('split');
  const [autoRun, setAutoRun] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const {
    assets,
    setAssets,
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
  } = useStudioSharedSession();
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [editorInsertRequest, setEditorInsertRequest] = useState<{ id: number; text: string } | null>(null);

  const [runnerEnabled, setRunnerEnabled] = useState(false);
  const [running, setRunning] = useState(false);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const previewObjectUrlsRef = useRef<string[]>([]);
  const webRuntimeRef = useRef<ApexifyWebRuntime | null>(null);
  const autoRunTimerRef = useRef<number>(0);
  const toastTimerRef = useRef<number>(0);

  const activeBuffer = useMemo(
    () => buffers.find((b) => b.id === activeBufferId) ?? buffers[0],
    [buffers, activeBufferId]
  );
  const activeCode = useMemo(
    () => (activeBuffer ? (lang === 'ts' ? activeBuffer.ts : activeBuffer.js) : ''),
    [activeBuffer, lang]
  );
  const executionPlan = useMemo(() => planStudioExecution(activeCode), [activeCode]);
  const executionTarget: 'browser' | 'node' =
    executionPlan.backend === 'browser' ? 'browser' : 'node';

  /* ---------- bootstrap (storage + share-link + incoming) ---------- */

  /**
   * Strict-mode guard. `bootstrapStudio` has destructive side effects —
   * it consumes (and removes) the incoming gallery snippet from
   * localStorage and rewrites the URL hash for share-link payloads.
   * In dev React fires this effect twice; without the ref the second
   * run sees an empty localStorage and reverts the buffer back to
   * the default starter, losing the gallery handoff.
   */
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const boot = bootstrapStudio();
    setBuffers(boot.buffers);
    setActiveBufferId(boot.activeBufferId);
    setLang(boot.lang);
    setLayout(boot.layout ?? 'split');
    setAutoRun(boot.autoRun);
    setSplitRatio(boot.splitRatio);
    setHistory(loadRunHistory());
    setHydrated(true);

    if (boot.source === 'share') {
      flashToast('info', 'Loaded snippet from share link');
    } else if (boot.source === 'incoming') {
      flashToast('info', 'Loaded snippet from gallery');
    }
  }, []);

  /* ---------- persist on change ---------- */

  useEffect(() => {
    if (!hydrated) return;
    savePersistedStudio({
      buffers,
      activeBufferId,
      lang,
      layout,
      autoRun,
      splitRatio,
    });
  }, [hydrated, buffers, activeBufferId, lang, layout, autoRun, splitRatio]);

  useEffect(() => {
    return () => {
      webRuntimeRef.current?.dispose();
      webRuntimeRef.current = null;
    };
  }, []);

  /* ---------- execution-adapter availability probe ---------- */

  useEffect(() => {
    const controller = new AbortController();
    void getServerExecutionAvailability(controller.signal).then(
      (availability) => setRunnerEnabled(availability.enabled),
      () => setRunnerEnabled(false),
    );
    return () => controller.abort();
  }, []);

  /* ---------- helpers ---------- */

  const flashToast = useCallback((kind: 'info' | 'success' | 'warning', text: string) => {
    setToast({ kind, text });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    if (!hydrated || !codeHandoff) return;
    const generatedBuffer: StudioBuffer = {
      id: makeId('visual'),
      name: codeHandoff.name,
      ts: codeHandoff.source,
      js: codeHandoff.source,
    };
    setBuffers((current) => [...current, generatedBuffer]);
    setActiveBufferId(generatedBuffer.id);
    setLang('ts');
    setLayout('split');
    setCodeHandoff(null);
    flashToast('success', 'Generated Visual code opened in a new Code Studio buffer');
  }, [codeHandoff, hydrated, flashToast, setCodeHandoff]);

  const revokePreview = useCallback(() => {
    for (const url of previewObjectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    previewObjectUrlsRef.current = [];
    setPreviewArtifacts([]);
    setActiveArtifactId(null);
  }, []);

  const showServerArtifacts = useCallback(
    (
      rawArtifacts: InteractiveArtifact[],
      provenance: 'server-generated' = 'server-generated',
    ) => {
      revokePreview();

      const resolved: StudioPreviewArtifact[] = rawArtifacts.map((artifact) => {
        let url: string | null = null;
        if (artifact.base64) {
          const bin = atob(artifact.base64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
          url = URL.createObjectURL(new Blob([bytes], { type: artifact.mime }));
          previewObjectUrlsRef.current.push(url);
        }
        return { ...artifact, url };
      });

      setPreviewArtifacts(resolved);
      const primary = resolved[0] ?? null;
      setActiveArtifactId(primary?.id ?? null);
      setPreviewProvenance(primary ? provenance : undefined);
      return resolved;
    },
    [revokePreview],
  );

  const selectPreviewArtifact = useCallback(
    (id: string) => {
      const artifact = previewArtifacts.find((item) => item.id === id);
      if (!artifact) return;
      setActiveArtifactId(artifact.id);
    },
    [previewArtifacts],
  );

  /** Render the response into a 256×144-ish thumbnail data URL for run history. */
  const makeThumbnail = useCallback(async (mime: string, base64: string): Promise<string | null> => {
    if (!mime.startsWith('image/')) return null;
    try {
      const dataUrl = `data:${mime};base64,${base64}`;
      const img = new Image();
      const ready = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('thumb load'));
      });
      img.src = dataUrl;
      await ready;
      const maxW = 256;
      const ratio = img.width > 0 ? img.width / img.height : 16 / 9;
      const w = Math.min(maxW, img.width);
      const h = Math.max(40, Math.round(w / ratio));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/jpeg', 0.72);
    } catch {
      return null;
    }
  }, []);

  /* ---------- run pipeline: automatic browser/full-runtime routing ---------- */

  const runCode = useCallback(async () => {
    if (!activeBuffer) return;
    const code = lang === 'ts' ? activeBuffer.ts : activeBuffer.js;
    if (!code.trim() || running) return;

    const plan = planStudioExecution(code);
    const target: 'browser' | 'node' = plan.backend === 'browser' ? 'browser' : 'node';

    setRunning(true);
    setError(null);
    setErrorExitCode(null);
    setPreviewWarnings([]);

    try {
      if (plan.excludedOperations.length > 0) {
        const labels = plan.excludedOperations.map((operation) => operation.label).join(', ');
        const reasons = [...new Set(plan.excludedOperations.map((operation) => operation.reason))].join(' ');
        const message =
          'Studio does not execute contract-excluded operations (' +
          labels +
          '). ' +
          reasons +
          ' Return the generated local artifact from main() and use the Studio download action when you need a local copy.';
        revokePreview();
        setPreviewProvenance(undefined);
        setError(message);
        setElapsedMs(null);
        setOutputTab('terminal');
        return;
      }

      if (target === 'browser') {
        const webRuntime =
          webRuntimeRef.current ?? (webRuntimeRef.current = createApexifyWebRuntime());
        const fontResults = await webRuntime.registerFonts(assets);
        const failedFonts = fontResults.filter((font) => !font.ok);

        const result = await webRuntime.renderStudioSource(code, assets);

        if (!result.ok) {
          revokePreview();
          setPreviewProvenance(undefined);
          setError(result.error);
          setElapsedMs(result.elapsedMs);
          setOutputTab('terminal');
          setHistory((cur) =>
            pushRunHistory(
              historyEntry(activeBuffer, lang, false, result.elapsedMs, null, result.error, null, null, code),
              cur,
            ),
          );
          return;
        }

        revokePreview();
        const browserArtifact: StudioPreviewArtifact = {
          id: 'browser-preview',
          name: '@apexify/web output.png',
          kind: 'image',
          mime: result.mime,
          url: result.dataUrl,
          metadata: {
            width: result.width,
            height: result.height,
          },
        };
        setPreviewArtifacts([browserArtifact]);
        setActiveArtifactId(browserArtifact.id);
        setPreviewProvenance('browser-generated');
        setPreviewWarnings([
          ...failedFonts.map((font) => `Studio could not register uploaded font ${font.name} in this browser.`),
          ...result.warnings,
        ]);
        setElapsedMs(result.elapsedMs);
        setOutputTab('preview');

        const base64 = result.dataUrl.split(',')[1] ?? '';
        const thumb = base64 ? await makeThumbnail(result.mime, base64) : null;
        setHistory((cur) =>
          pushRunHistory(
            historyEntry(activeBuffer, lang, true, result.elapsedMs, null, null, thumb, result.mime, code),
            cur,
          ),
        );

        if (result.warnings.length > 0) {
          flashToast(
            'warning',
            `@apexify/web rendered with ${result.warnings.length} note${result.warnings.length === 1 ? '' : 's'}`,
          );
        }
        return;
      }

      if (!runnerEnabled) {
        const details = plan.reasons.length ? ' ' + plan.reasons.join(' ') : '';
        const message =
          'This snippet requires the full Apexify runtime, but the built-in same-origin isolated runtime is unavailable on this deployment.' +
          details;
        revokePreview();
        setPreviewProvenance(undefined);
        setError(message);
        setElapsedMs(null);
        setOutputTab('terminal');
        return;
      }

      const studioFiles: StudioWorkspaceFile[] = buffers
        .filter((buffer) => buffer.id !== activeBuffer.id)
        .map((buffer) => ({
          name: studioWorkspaceFileName(buffer.name, lang),
          source: lang === 'ts' ? buffer.ts : buffer.js,
          language: lang,
        }));

      const result = await currentNodeServerExecutionAdapter.run({
        session: createInteractiveSession({
          source: code,
          language: lang,
          runtime: 'node',
          options: { studioAssets: assets, studioFiles },
          selectedFile: studioWorkspaceFileName(activeBuffer.name, lang),
          layout: { activePanel: 'editor' },
        }),
      });

      if (result.status !== 'ready' || !result.output) {
        revokePreview();
        setPreviewProvenance(undefined);
        const primary = result.diagnostics[0];
        const message = primary?.message ?? 'Execution is unavailable.';
        const exitCode = primary?.code?.startsWith('EXIT_')
          ? Number(primary.code.slice('EXIT_'.length))
          : null;
        setError(message);
        setErrorExitCode(Number.isFinite(exitCode) ? exitCode : null);
        setElapsedMs(result.elapsedMs ?? null);
        setOutputTab('terminal');
        setHistory((cur) =>
          pushRunHistory(
            historyEntry(
              activeBuffer,
              lang,
              false,
              result.elapsedMs ?? null,
              Number.isFinite(exitCode) ? exitCode : null,
              message,
              null,
              null,
              code,
            ),
            cur,
          ),
        );
        return;
      }

      const rawArtifacts =
        result.output.artifacts && result.output.artifacts.length > 0
          ? result.output.artifacts
          : result.output.base64
            ? [{
                id: 'primary-output',
                name: 'Apexify output',
                kind:
                  result.output.mime === 'image/gif'
                    ? 'gif' as const
                    : result.output.mime.startsWith('image/')
                      ? 'image' as const
                      : result.output.mime.startsWith('audio/')
                        ? 'audio' as const
                        : result.output.mime.startsWith('video/')
                          ? 'video' as const
                          : 'binary' as const,
                mime: result.output.mime,
                base64: result.output.base64,
              }]
            : [];

      if (rawArtifacts.length === 0) {
        throw new Error('The full Apexify runtime completed without a previewable artifact.');
      }

      showServerArtifacts(rawArtifacts);
      setErrorExitCode(null);
      const elapsed = result.elapsedMs ?? null;
      setElapsedMs(elapsed);
      setOutputTab('preview');

      const thumbSource = rawArtifacts.find(
        (artifact) => artifact.base64 && artifact.mime.startsWith('image/'),
      );
      const thumb = thumbSource?.base64
        ? await makeThumbnail(thumbSource.mime, thumbSource.base64)
        : null;
      const primary = rawArtifacts[0]!;
      setHistory((cur) =>
        pushRunHistory(
          historyEntry(activeBuffer, lang, true, elapsed, null, null, thumb, primary.mime, code),
          cur,
        ),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Preview failed';
      revokePreview();
      setError(message);
      setErrorExitCode(null);
      setPreviewProvenance(undefined);
      setElapsedMs(null);
      setOutputTab('terminal');
      setHistory((cur) =>
        pushRunHistory(
          historyEntry(activeBuffer, lang, false, null, null, message, null, null, code),
          cur,
        ),
      );
    } finally {
      setRunning(false);
    }
  }, [
    activeBuffer,
    buffers,
    lang,
    assets,
    runnerEnabled,
    running,
    revokePreview,
    showServerArtifacts,
    makeThumbnail,
    flashToast,
  ]);
  const runCodeRef = useRef(runCode);
  runCodeRef.current = runCode;

  const scheduleAutoRun = useCallback(() => {
    if (!autoRun) return;
    window.clearTimeout(autoRunTimerRef.current);
    autoRunTimerRef.current = window.setTimeout(() => void runCodeRef.current(), 900);
  }, [autoRun]);

  /** Initial preview uses the same automatic runtime planner as manual Run. */
  useEffect(() => {
    if (!hydrated || !activeBuffer) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) void runCodeRef.current();
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [hydrated, activeBuffer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => revokePreview(), [revokePreview]);
  useEffect(
    () => () => {
      window.clearTimeout(autoRunTimerRef.current);
      window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  /* ---------- buffer mutation helpers ---------- */

  const updateActiveCode = useCallback(
    (next: string) => {
      setBuffers((cur) =>
        cur.map((b) =>
          b.id === activeBufferId ? { ...b, [lang]: next } : b
        )
      );
      scheduleAutoRun();
    },
    [activeBufferId, lang, scheduleAutoRun]
  );

  const newBuffer = useCallback(() => {
    const b = createBlankBuffer(`untitled-${buffers.length + 1}.${lang}`);
    setBuffers((cur) => [...cur, b]);
    setActiveBufferId(b.id);
    setOutputTab('preview');
  }, [buffers.length, lang]);

  const closeBuffer = useCallback(
    (id: string) => {
      setBuffers((cur) => {
        if (cur.length <= 1) return cur;
        const next = cur.filter((b) => b.id !== id);
        if (id === activeBufferId) {
          const closingIdx = cur.findIndex((b) => b.id === id);
          const fallback = next[Math.max(0, Math.min(next.length - 1, closingIdx))];
          if (fallback) setActiveBufferId(fallback.id);
        }
        return next;
      });
    },
    [activeBufferId]
  );

  const renameBuffer = useCallback(
    (id: string, name: string) => {
      setBuffers((cur) => cur.map((b) => (b.id === id ? { ...b, name } : b)));
    },
    []
  );

  const duplicateBuffer = useCallback(() => {
    if (!activeBuffer) return;
    const dup: StudioBuffer = {
      id: makeId(),
      name: `${activeBuffer.name} copy`,
      ts: activeBuffer.ts,
      js: activeBuffer.js,
    };
    setBuffers((cur) => [...cur, dup]);
    setActiveBufferId(dup.id);
  }, [activeBuffer]);

  const loadTemplate = useCallback((template: StudioTemplate) => {
    const buf = bufferFromTemplate(template);
    setBuffers((cur) => [...cur, buf]);
    setActiveBufferId(buf.id);
    setOutputTab('preview');
    flashToast('success', `Loaded template · ${template.name}`);
    requestAnimationFrame(() => requestAnimationFrame(() => void runCodeRef.current()));
  }, [flashToast]);

  const replayHistory = useCallback(
    (entry: RunHistoryEntry) => {
      const buf: StudioBuffer = {
        id: makeId(),
        name: `${entry.bufferName} · replay`,
        ts: entry.lang === 'ts' ? entry.snippet : activeBuffer?.ts ?? STUDIO_STARTER_TS,
        js: entry.lang === 'js' ? entry.snippet : activeBuffer?.js ?? STUDIO_STARTER_JS,
      };
      setBuffers((cur) => [...cur, buf]);
      setActiveBufferId(buf.id);
      setLang(entry.lang);
      setOutputTab('preview');
      requestAnimationFrame(() => requestAnimationFrame(() => void runCodeRef.current()));
    },
    [activeBuffer]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveRunHistory([]);
    flashToast('info', 'Run history cleared');
  }, [flashToast]);

  const resetActiveToStarter = useCallback(() => {
    setBuffers((cur) =>
      cur.map((b) =>
        b.id === activeBufferId ? { ...b, ts: STUDIO_STARTER_TS, js: STUDIO_STARTER_JS } : b
      )
    );
    setError(null);
    setErrorExitCode(null);
    flashToast('info', 'Reset to starter snippet');
  }, [activeBufferId, flashToast]);

  /* ---------- share / download ---------- */

  const copyShareLink = useCallback(() => {
    if (!activeBuffer) return;
    try {
      const encoded = encodeShareLink({
        name: activeBuffer.name,
        ts: activeBuffer.ts,
        js: activeBuffer.js,
        lang,
      });
      const url = `${window.location.origin}${window.location.pathname}#snippet=${encodeURIComponent(encoded)}`;
      void navigator.clipboard.writeText(url).then(
        () => {
          setShareCopied(true);
          flashToast('success', 'Share link copied to clipboard');
          window.setTimeout(() => setShareCopied(false), 1800);
        },
        () => flashToast('warning', 'Clipboard blocked — copy from the URL bar')
      );
    } catch {
      flashToast('warning', 'Could not generate share link');
    }
  }, [activeBuffer, lang, flashToast]);

  const downloadOutput = useCallback(() => {
    const artifact =
      previewArtifacts.find((item) => item.id === activeArtifactId) ??
      previewArtifacts[0];

    if (!artifact) {
      return flashToast('warning', 'Run the snippet first to download output');
    }

    let href = artifact.url;
    let temporaryUrl: string | null = null;

    if (!href && artifact.text !== undefined) {
      temporaryUrl = URL.createObjectURL(new Blob([artifact.text], { type: artifact.mime }));
      href = temporaryUrl;
    }

    if (!href) {
      return flashToast('warning', 'This artifact has no downloadable payload');
    }

    const a = document.createElement('a');
    a.href = href;
    a.download =
      artifact.name ||
      `${(activeBuffer?.name ?? 'apexify').replace(/[^a-z0-9-_]/gi, '-').toLowerCase()}.bin`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    flashToast('success', `Downloaded ${a.download}`);
  }, [previewArtifacts, activeArtifactId, activeBuffer, flashToast]);

  const copyActiveCode = useCallback(() => {
    if (!activeCode) return;
    void navigator.clipboard.writeText(activeCode).then(
      () => flashToast('success', 'Snippet copied to clipboard'),
      () => flashToast('warning', 'Clipboard blocked')
    );
  }, [activeCode, flashToast]);

  /* ---------- command-palette dispatch ---------- */

  const dispatchAction = useCallback(
    (id: StudioActionId) => {
      switch (id) {
        case 'run':
          void runCode();
          break;
        case 'reset':
          resetActiveToStarter();
          break;
        case 'newBuffer':
          newBuffer();
          break;
        case 'closeBuffer':
          if (activeBuffer) closeBuffer(activeBuffer.id);
          break;
        case 'duplicateBuffer':
          duplicateBuffer();
          break;
        case 'renameBuffer':
          flashToast('info', 'Double-click any tab to rename it');
          break;
        case 'toggleAutoRun':
          setAutoRun((v) => !v);
          break;
        case 'toggleLang':
          setLang((l) => (l === 'ts' ? 'js' : 'ts'));
          break;
        case 'layoutCode':
          setLayout('code');
          break;
        case 'layoutSplit':
          setLayout('split');
          break;
        case 'layoutMedia':
          setLayout('media');
          break;
        case 'copyCode':
          copyActiveCode();
          break;
        case 'copyShareLink':
          copyShareLink();
          break;
        case 'downloadOutput':
          downloadOutput();
          break;
        case 'openShortcuts':
          setShortcutsOpen(true);
          break;
        case 'gotoGallery':
          window.location.href = '/gallery';
          break;
        case 'gotoDocs':
          window.location.href = '/docs';
          break;
        case 'clearHistory':
          clearHistory();
          break;
      }
    },
    [
      runCode,
      resetActiveToStarter,
      newBuffer,
      activeBuffer,
      closeBuffer,
      duplicateBuffer,
      flashToast,
      copyActiveCode,
      copyShareLink,
      downloadOutput,
      clearHistory,
    ]
  );

  /* ---------- global keyboard shortcuts ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      const editorFocused = !!target?.closest?.('.cm-editor');
      const cmd = e.ctrlKey || e.metaKey;

      if (cmd && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (cmd && e.key === 'Enter') {
        e.preventDefault();
        void runCode();
        return;
      }
      if (cmd && e.key.toLowerCase() === 't') {
        e.preventDefault();
        newBuffer();
        return;
      }
      if (cmd && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeBuffer) closeBuffer(activeBuffer.id);
        return;
      }
      if (cmd && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setLang((l) => (l === 'ts' ? 'js' : 'ts'));
        return;
      }
      if (cmd && e.key === '1') {
        e.preventDefault();
        setLayout('code');
        return;
      }
      if (cmd && e.key === '2') {
        e.preventDefault();
        setLayout('split');
        return;
      }
      if (cmd && e.key === '3') {
        e.preventDefault();
        setLayout('media');
        return;
      }
      if (cmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        copyShareLink();
        return;
      }
      if (cmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        downloadOutput();
        return;
      }
      if (!cmd && e.key === '?' && !isTextInput && !editorFocused) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runCode, newBuffer, closeBuffer, activeBuffer, copyShareLink, downloadOutput]);

  /* ---------- derived display values ---------- */

  const lineCount = activeCode ? activeCode.split('\n').length : 0;
  const charCount = activeCode ? new Blob([activeCode]).size : 0;
  const showCode = layout !== 'media';
  const showPreview = layout !== 'code';
  const splitEnabled = layout === 'split';

  const codeSection = activeBuffer ? (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StudioFileTabs
        buffers={buffers}
        activeId={activeBufferId}
        onSelect={(id) => {
          setActiveBufferId(id);
          setOutputTab('preview');
        }}
        onClose={closeBuffer}
        onRename={renameBuffer}
        onNew={newBuffer}
      />
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-canvas)' }}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden px-1 py-1 sm:px-2 sm:py-2">
          <GallerySnippetEditor
            fillParent
            value={activeCode}
            codeLang={lang}
            onChange={updateActiveCode}
            insertRequest={editorInsertRequest}
          />
        </div>
      </div>
    </div>
  ) : null;

  const previewSection = (
    <StudioOutputPanel
      tab={outputTab}
      onTabChange={setOutputTab}
      running={running}
      previewArtifacts={previewArtifacts}
      activeArtifactId={activeArtifactId}
      onArtifactSelect={selectPreviewArtifact}
      previewProvenance={previewProvenance}
      notices={previewWarnings}
      error={error}
      errorExitCode={errorExitCode}
      elapsedMs={elapsedMs}
      history={history}
      onReplayHistory={replayHistory}
      onClearHistory={clearHistory}
    />
  );

  return (
    <div
      className={`apx-studio-root relative flex min-h-0 flex-col overflow-hidden overscroll-none ${embedded ? 'h-full max-h-full' : 'h-dvh max-h-dvh'}`}
      data-execution-target={executionTarget}
      data-node-runner={runnerEnabled ? 'enabled' : 'disabled'}
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'var(--gradient-twilight)',
          }}
        />
        <div
          className="absolute -left-[20%] -top-[20%] h-[55vh] w-[55vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, color-mix(in srgb, var(--accent-iris) 38%, transparent), transparent 70%)',
            opacity: 0.7,
          }}
        />
        <div
          className="absolute -right-[18%] top-[35%] h-[48vh] w-[48vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, color-mix(in srgb, var(--accent-magenta) 32%, transparent), transparent 70%)',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--border-subtle) 100%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border-subtle) 100%, transparent) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            opacity: 0.55,
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      <StudioTopBar
        mode={mode}
        onModeChange={onModeChange}
        layout={layout}
        onLayoutChange={setLayout}
        lang={lang}
        onLangChange={setLang}
        running={running}
        nodeRunnerEnabled={runnerEnabled}
        executionTarget={executionTarget}
        autoRun={autoRun}
        onAutoRunChange={setAutoRun}
        onRun={() => void runCode()}
        onReset={resetActiveToStarter}
        onLoadTemplate={loadTemplate}
        onCopyShareLink={copyShareLink}
        shareCopied={shareCopied}
        onDownloadOutput={downloadOutput}
        hasOutput={previewArtifacts.length > 0}
        assetCount={assets.length}
        assetsOpen={assetsOpen}
        onToggleAssets={() => setAssetsOpen((open) => !open)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {assetsOpen ? (
        <StudioAssetShelf
          assets={assets}
          onChange={setAssets}
          onInsertReference={(text) =>
            setEditorInsertRequest({ id: Date.now() + Math.random(), text })
          }
          onNotice={flashToast}
        />
      ) : null}

      {!runnerEnabled && executionTarget === 'node' && (
        <div
          className="studio-runtime-note flex shrink-0 items-start gap-2 px-3 py-2 text-xs sm:px-4"
          role="status"
          aria-live="polite"
        >
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>This source needs the full Apexify runtime.</strong> Studio now uses a
            same-origin isolated backend automatically, but that built-in runtime is unavailable on
            this deployment. Browser-direct Canvas/Image/Text/Chart snippets continue to run in Live Canvas.
          </span>
        </div>
      )}

      <main
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-2 pb-studio-safe sm:p-3 lg:p-4"
        tabIndex={-1}
      >
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl shadow-[var(--shadow-md)] sm:rounded-2xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-raised) 92%, transparent)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid var(--border-default)',
          }}
        >
          {showCode && showPreview ? (
            <StudioResizableSplit
              ratio={splitRatio}
              onRatioChange={setSplitRatio}
              enabled={splitEnabled}
              left={codeSection}
              right={previewSection}
            />
          ) : showCode ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{codeSection}</div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{previewSection}</div>
          )}
        </div>
      </main>

      <StudioStatusBar
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'ts' ? 'js' : 'ts'))}
        bufferName={activeBuffer?.name ?? '—'}
        lineCount={lineCount}
        charCount={charCount}
        autoRun={autoRun}
        onToggleAutoRun={() => setAutoRun((v) => !v)}
        nodeRunnerEnabled={runnerEnabled}
        executionTarget={executionTarget}
        running={running}
        lastError={!!error}
        elapsedMs={elapsedMs}
        hasOutput={previewArtifacts.length > 0}
      />

      <StudioCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAction={dispatchAction}
        onLoadTemplate={loadTemplate}
      />

      <StudioShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.text}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="pointer-events-auto fixed bottom-12 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-[var(--shadow-lg)]"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <span
              className="grid h-5 w-5 place-items-center rounded-full"
              style={{
                background:
                  toast.kind === 'success'
                    ? 'var(--success)'
                    : toast.kind === 'warning'
                      ? 'var(--warning)'
                      : 'var(--gradient-iris)',
                color: 'white',
              }}
              aria-hidden
            >
              <InformationCircleIcon className="h-3 w-3" />
            </span>
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function historyEntry(
  buffer: StudioBuffer,
  lang: StudioLang,
  ok: boolean,
  elapsedMs: number | null,
  exitCode: number | null,
  error: string | null,
  thumbDataUrl: string | null,
  mime: string | null,
  snippet: string
): RunHistoryEntry {
  return {
    id: makeId('run'),
    bufferId: buffer.id,
    bufferName: buffer.name,
    lang,
    ok,
    elapsedMs,
    exitCode,
    error,
    thumbDataUrl,
    mime,
    ts: Date.now(),
    snippet,
  };
}
