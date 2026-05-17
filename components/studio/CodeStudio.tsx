'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { GallerySnippetEditor } from '@/app/gallery/components/GallerySnippetEditor';
import { StudioCommandPalette } from '@/components/studio/StudioCommandPalette';
import { StudioFileTabs } from '@/components/studio/StudioFileTabs';
import { StudioOutputPanel, OutputTab } from '@/components/studio/StudioOutputPanel';
import { StudioResizableSplit } from '@/components/studio/StudioResizableSplit';
import { StudioShortcutOverlay } from '@/components/studio/StudioShortcutOverlay';
import { StudioStatusBar } from '@/components/studio/StudioStatusBar';
import { StudioTopBar } from '@/components/studio/StudioTopBar';
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
import {
  bootstrapStudio,
  encodeShareLink,
  loadRunHistory,
  pushRunHistory,
  saveRunHistory,
  savePersistedStudio,
} from '@/lib/studio/studioStorage';

type Toast = { kind: 'info' | 'success' | 'warning'; text: string } | null;

export default function CodeStudio() {
  const [hydrated, setHydrated] = useState(false);
  const [buffers, setBuffers] = useState<StudioBuffer[]>([]);
  const [activeBufferId, setActiveBufferId] = useState<string>('');
  const [lang, setLang] = useState<StudioLang>('ts');
  const [layout, setLayout] = useState<LayoutMode>('split');
  const [autoRun, setAutoRun] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);

  const [runnerEnabled, setRunnerEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorExitCode, setErrorExitCode] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const [outputTab, setOutputTab] = useState<OutputTab>('preview');
  const [history, setHistory] = useState<RunHistoryEntry[]>([]);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const previewObjectUrlRef = useRef<string | null>(null);
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

  /* ---------- runner availability probe ---------- */

  useEffect(() => {
    let cancelled = false;
    fetch('/api/gallery/run')
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => {
        if (!cancelled) setRunnerEnabled(Boolean(d.enabled));
      })
      .catch(() => {
        if (!cancelled) setRunnerEnabled(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- helpers ---------- */

  const flashToast = useCallback((kind: 'info' | 'success' | 'warning', text: string) => {
    setToast({ kind, text });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const revokePreview = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, []);

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

  /* ---------- run pipeline ---------- */

  const runCode = useCallback(async () => {
    if (!activeBuffer) return;
    const code = lang === 'ts' ? activeBuffer.ts : activeBuffer.js;
    if (!runnerEnabled || !code.trim() || running) return;

    setRunning(true);
    setError(null);
    setErrorExitCode(null);
    const t0 = performance.now();

    try {
      const res = await fetch('/api/gallery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, lang, context: 'studio' }),
      });

      let data: {
        ok?: boolean;
        mime?: string;
        base64?: string;
        error?: string;
        stderr?: string;
        exitCode?: number;
        elapsedMs?: number;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        const message = `Run failed (HTTP ${res.status}) — response was not JSON.`;
        setPreviewUrl(null);
        setError(message);
        setErrorExitCode(null);
        setElapsedMs(null);
        setOutputTab('terminal');
        setHistory((cur) =>
          pushRunHistory(
            historyEntry(activeBuffer, lang, false, null, null, message, null, null, code),
            cur
          )
        );
        return;
      }

      if (!res.ok || !data.ok) {
        setPreviewUrl(null);
        const stderr = typeof data.stderr === 'string' ? data.stderr.trim() : '';
        let message = typeof data.error === 'string' ? data.error.trim() : '';
        if (stderr && message && !message.includes(stderr.slice(0, Math.min(100, stderr.length)))) {
          message = `${message}\n\n━━ stderr ━━\n${stderr}`;
        } else if (stderr && !message) {
          message = stderr;
        }
        const exitCode = typeof data.exitCode === 'number' ? data.exitCode : 1;
        setError(message || `Run failed (HTTP ${res.status})`);
        setErrorExitCode(exitCode);
        setElapsedMs(typeof data.elapsedMs === 'number' ? data.elapsedMs : null);
        setOutputTab('terminal');
        setHistory((cur) =>
          pushRunHistory(
            historyEntry(activeBuffer, lang, false, typeof data.elapsedMs === 'number' ? data.elapsedMs : null, exitCode, message || `Run failed (HTTP ${res.status})`, null, null, code),
            cur
          )
        );
        return;
      }

      const mime = data.mime ?? 'image/png';
      const base64 = data.base64 ?? '';
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      revokePreview();
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      previewObjectUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewMime(mime);
      setErrorExitCode(null);
      const elapsed = typeof data.elapsedMs === 'number' ? data.elapsedMs : Math.round(performance.now() - t0);
      setElapsedMs(elapsed);
      setOutputTab('preview');

      const thumb = await makeThumbnail(mime, base64);
      setHistory((cur) =>
        pushRunHistory(
          historyEntry(activeBuffer, lang, true, elapsed, null, null, thumb, mime, code),
          cur
        )
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Network error';
      setError(message);
      setErrorExitCode(null);
      setPreviewUrl(null);
      setElapsedMs(null);
      setOutputTab('terminal');
      setHistory((cur) =>
        pushRunHistory(
          historyEntry(activeBuffer, lang, false, null, null, message, null, null, code),
          cur
        )
      );
    } finally {
      setRunning(false);
    }
  }, [activeBuffer, lang, runnerEnabled, running, revokePreview, makeThumbnail]);

  const runCodeRef = useRef(runCode);
  runCodeRef.current = runCode;

  const scheduleAutoRun = useCallback(() => {
    if (!autoRun || !runnerEnabled) return;
    window.clearTimeout(autoRunTimerRef.current);
    autoRunTimerRef.current = window.setTimeout(() => void runCodeRef.current(), 1300);
  }, [autoRun, runnerEnabled]);

  /** Initial run after hydrate + sandbox probe — same UX as old studio. */
  useEffect(() => {
    if (!hydrated || !runnerEnabled || !activeBuffer) return;
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
  }, [hydrated, runnerEnabled, activeBuffer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const b = createBlankBuffer(`Untitled ${buffers.length + 1}`);
    setBuffers((cur) => [...cur, b]);
    setActiveBufferId(b.id);
    setOutputTab('preview');
  }, [buffers.length]);

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
    /** Auto-run the freshly loaded template after one frame. */
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
    if (!previewUrl) return flashToast('warning', 'Run the snippet first to download output');
    const a = document.createElement('a');
    a.href = previewUrl;
    const ext = previewMime?.includes('gif') ? 'gif' : previewMime?.includes('webp') ? 'webp' : 'png';
    a.download = `${(activeBuffer?.name ?? 'apexify').replace(/[^a-z0-9-_]/gi, '-').toLowerCase()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    flashToast('success', `Saved ${a.download}`);
  }, [previewUrl, previewMime, activeBuffer, flashToast]);

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
      previewUrl={previewUrl}
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
      className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden overscroll-none"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Backdrop — twilight gradient + soft aurora glows + grid */}
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
        layout={layout}
        onLayoutChange={setLayout}
        lang={lang}
        onLangChange={setLang}
        running={running}
        runnerEnabled={runnerEnabled}
        autoRun={autoRun}
        onAutoRunChange={setAutoRun}
        onRun={() => void runCode()}
        onReset={resetActiveToStarter}
        onLoadTemplate={loadTemplate}
        onCopyShareLink={copyShareLink}
        shareCopied={shareCopied}
        onDownloadOutput={downloadOutput}
        hasOutput={!!previewUrl}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {!runnerEnabled && (
        <div
          className="flex shrink-0 items-center gap-2 px-3 py-2 text-xs sm:px-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--warning) 14%, transparent)',
            borderBottom: '1px solid color-mix(in srgb, var(--warning) 35%, transparent)',
            color: 'var(--text-primary)',
          }}
        >
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--warning)' }} aria-hidden />
          <span>
            Code execution is disabled on this deployment (
            <code style={{ color: 'var(--warning)' }}>DISABLE_GALLERY_CODE_RUN</code>
            ). Remove it to enable Studio runs.
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
        runnerEnabled={runnerEnabled}
        running={running}
        lastError={!!error}
        elapsedMs={elapsedMs}
        hasOutput={!!previewUrl}
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

/* ----------------------------------------------------------------- *
 *  small helpers
 * ----------------------------------------------------------------- */

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
