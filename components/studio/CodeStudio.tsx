'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  CodeBracketIcon,
  CommandLineIcon,
  PhotoIcon,
  PlayIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import { GallerySnippetEditor } from '@/app/gallery/components/GallerySnippetEditor';
import { StudioPreviewZoom } from '@/components/studio/StudioPreviewZoom';
import { StudioRunnerTerminal } from '@/components/studio/StudioRunnerTerminal';
import {
  STUDIO_STARTER_JS,
  STUDIO_STARTER_TS,
  STUDIO_STORAGE_KEY,
} from '@/lib/studio/starterSnippets';

type LayoutMode = 'code' | 'split' | 'media';

type PersistedStudio = {
  ts?: string;
  js?: string;
  lang?: 'ts' | 'js';
  layout?: LayoutMode;
  autoRun?: boolean;
};

function LayoutToolbar({
  mode,
  onChange,
}: {
  mode: LayoutMode;
  onChange: (m: LayoutMode) => void;
}) {
  const pill =
    'touch-manipulation flex flex-1 select-none items-center justify-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-semibold transition-colors min-w-0 sm:flex-none sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm active:scale-[0.98]';
  const active = 'bg-blue-600 text-white shadow-md';
  const idle = 'bg-transparent text-gray-400 hover:text-white hover:bg-slate-700/80';

  return (
    <div
      className="flex w-full max-w-full gap-0.5 rounded-xl border border-slate-700/60 bg-slate-800/90 p-1 sm:max-w-md"
      role="group"
      aria-label="Layout: code, split, or preview"
    >
      <button
        type="button"
        className={`${pill} ${mode === 'code' ? active : idle}`}
        aria-pressed={mode === 'code'}
        onClick={() => onChange('code')}
        title="Code only"
      >
        <CodeBracketIcon className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
        <span className="hidden min-[360px]:inline sm:inline">Code</span>
      </button>
      <button
        type="button"
        className={`${pill} ${mode === 'split' ? active : idle}`}
        aria-pressed={mode === 'split'}
        onClick={() => onChange('split')}
        title="Code and preview"
      >
        <ViewColumnsIcon className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
        <span className="hidden min-[360px]:inline sm:inline">Split</span>
      </button>
      <button
        type="button"
        className={`${pill} ${mode === 'media' ? active : idle}`}
        aria-pressed={mode === 'media'}
        onClick={() => onChange('media')}
        title="Preview only"
      >
        <PhotoIcon className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
        <span className="hidden min-[360px]:inline sm:inline">Preview</span>
      </button>
    </div>
  );
}

export default function CodeStudio() {
  const [codeTs, setCodeTs] = useState(STUDIO_STARTER_TS);
  const [codeJs, setCodeJs] = useState(STUDIO_STARTER_JS);
  const [codeLang, setCodeLang] = useState<'ts' | 'js'>('ts');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [autoRun, setAutoRun] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [runnerEnabled, setRunnerEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorExitCode, setErrorExitCode] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const previewObjectUrlRef = useRef<string | null>(null);
  const autoRunTimerRef = useRef<number>(0);

  const activeCode = codeLang === 'ts' ? codeTs : codeJs;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDIO_STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as PersistedStudio;
      if (typeof p.ts === 'string' && p.ts.trim()) setCodeTs(p.ts);
      if (typeof p.js === 'string' && p.js.trim()) setCodeJs(p.js);
      if (p.lang === 'js' || p.lang === 'ts') setCodeLang(p.lang);
      if (p.layout === 'code' || p.layout === 'split' || p.layout === 'media') setLayoutMode(p.layout);
      if (typeof p.autoRun === 'boolean') setAutoRun(p.autoRun);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedStudio = {
      ts: codeTs,
      js: codeJs,
      lang: codeLang,
      layout: layoutMode,
      autoRun,
    };
    try {
      localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota */
    }
  }, [hydrated, codeTs, codeJs, codeLang, layoutMode, autoRun]);

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

  const revokePreview = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, []);

  const runCode = useCallback(async () => {
    const code = codeLang === 'ts' ? codeTs : codeJs;
    if (!runnerEnabled || !code.trim() || running) return;

    setRunning(true);
    setError(null);
    setErrorExitCode(null);
    const t0 = performance.now();

    try {
      const res = await fetch('/api/gallery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, lang: codeLang }),
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
        setPreviewUrl(null);
        setError(`Run failed (HTTP ${res.status}) — response was not JSON.`);
        setErrorExitCode(null);
        setElapsedMs(null);
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
        setError(message || `Run failed (HTTP ${res.status})`);
        setErrorExitCode(typeof data.exitCode === 'number' ? data.exitCode : 1);
        setElapsedMs(typeof data.elapsedMs === 'number' ? data.elapsedMs : null);
        return;
      }

      const mime = data.mime ?? 'image/png';
      const bin = atob(data.base64 ?? '');
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      revokePreview();
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      previewObjectUrlRef.current = url;
      setPreviewUrl(url);
      setErrorExitCode(null);
      setElapsedMs(typeof data.elapsedMs === 'number' ? data.elapsedMs : Math.round(performance.now() - t0));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setErrorExitCode(null);
      setPreviewUrl(null);
      setElapsedMs(null);
    } finally {
      setRunning(false);
    }
  }, [codeTs, codeJs, codeLang, runnerEnabled, running, revokePreview]);

  const runCodeRef = useRef(runCode);
  runCodeRef.current = runCode;

  const scheduleDebouncedRun = useCallback(() => {
    if (!autoRun || !runnerEnabled) return;
    window.clearTimeout(autoRunTimerRef.current);
    autoRunTimerRef.current = window.setTimeout(() => void runCodeRef.current(), 1300);
  }, [autoRun, runnerEnabled]);

  const handleCodeChange = useCallback(
    (next: string) => {
      if (codeLang === 'ts') setCodeTs(next);
      else setCodeJs(next);
      scheduleDebouncedRun();
    },
    [codeLang, scheduleDebouncedRun]
  );

  useEffect(() => () => revokePreview(), [revokePreview]);

  useEffect(
    () => () => {
      window.clearTimeout(autoRunTimerRef.current);
    },
    []
  );

  /** Initial preview: after localStorage hydrate + runner GET, run starter or restored code once */
  useEffect(() => {
    if (!hydrated || !runnerEnabled) return;
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
  }, [hydrated, runnerEnabled]);

  const resetToStarter = () => {
    setCodeTs(STUDIO_STARTER_TS);
    setCodeJs(STUDIO_STARTER_JS);
    setError(null);
    setErrorExitCode(null);
  };

  const showCode = layoutMode !== 'media';
  const showPreview = layoutMode !== 'code';

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void runCode();
    }
  };

  return (
    <div
      className="relative flex min-h-0 h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-black text-white"
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 50% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              #000000
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <Navbar />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-studio-safe pt-[calc(4.5rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pt-28 md:pt-[7.25rem] lg:px-8">
        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden">
          <header className="mb-3 flex shrink-0 flex-col gap-3 sm:mb-5 md:mb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500 sm:mb-2 sm:text-xs">
                Playground
              </p>
              <h1 className="text-2xl font-black tracking-tight text-transparent sm:text-3xl md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text">
                Code studio
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-400 line-clamp-4 sm:mt-2 sm:text-sm md:line-clamp-none">
                Edit Apexify.js; preview runs on the same server sandbox as the gallery (
                <code className="text-sky-300/90">main()</code> → PNG/GIF <code className="text-sky-300/90">Buffer</code>
                ). Video/FFmpeg is not available here — canvas/image flows are.
              </p>
            </div>
            <div className="shrink-0 lg:max-w-[min(100%,28rem)] lg:self-end">
              <LayoutToolbar mode={layoutMode} onChange={setLayoutMode} />
            </div>
          </header>

          {!runnerEnabled && (
            <div className="mb-3 shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2.5 text-xs text-amber-100 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
              Code execution is disabled on this deployment (<code className="text-amber-200/90">DISABLE_GALLERY_CODE_RUN</code>
              ). Remove it on Vercel to enable Studio runs.
            </div>
          )}

          <div
            className={`flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/80 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] sm:gap-4 md:gap-0 md:rounded-2xl ${
              layoutMode === 'split' ? 'md:flex-row' : 'md:flex-col'
            }`}
          >
            {showCode && (
            <section
              className={`flex min-h-[200px] flex-col overflow-hidden border-white/[0.06] min-[380px]:min-h-[220px] md:min-h-0 ${
                layoutMode === 'split'
                  ? 'md:w-1/2 md:flex-1 md:border-r md:border-white/[0.06]'
                  : 'flex-1'
              }`}
            >
              <div className="flex shrink-0 flex-col gap-2 border-b border-white/[0.06] bg-[#0d1117]/95 px-2 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-3 sm:py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-slate-700/60 bg-slate-800/90 p-0.5">
                    <button
                      type="button"
                      className={`touch-manipulation rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors active:scale-[0.98] sm:px-3 sm:py-1.5 sm:text-xs ${
                        codeLang === 'ts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      onClick={() => setCodeLang('ts')}
                    >
                      TS
                    </button>
                    <button
                      type="button"
                      className={`touch-manipulation rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors active:scale-[0.98] sm:px-3 sm:py-1.5 sm:text-xs ${
                        codeLang === 'js' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      onClick={() => setCodeLang('js')}
                    >
                      JS
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void runCode()}
                    disabled={running || !runnerEnabled}
                    className="touch-manipulation inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] sm:min-h-0 sm:py-1.5"
                  >
                    <PlayIcon className="h-4 w-4 shrink-0" aria-hidden />
                    Run
                  </button>

                  <button
                    type="button"
                    onClick={resetToStarter}
                    className="touch-manipulation inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 active:scale-[0.98] sm:min-h-0 sm:py-1.5"
                  >
                    <ArrowPathIcon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="hidden min-[380px]:inline">Reset sample</span>
                    <span className="min-[380px]:hidden">Reset</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                  <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[11px] text-slate-400 sm:text-xs">
                    <input
                      type="checkbox"
                      className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      checked={autoRun}
                      onChange={(e) => setAutoRun(e.target.checked)}
                    />
                    <span>
                      Auto-run · <span className="text-slate-500">debounced</span>
                    </span>
                  </label>

                  <span className="hidden items-center gap-1 text-[11px] text-slate-500 md:inline-flex">
                    <CommandLineIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 font-mono">⌘</kbd>
                    <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 font-mono">↵</kbd>
                  </span>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d1117]">
                <div className="mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden px-1.5 py-1.5 sm:max-w-4xl sm:px-4 sm:py-3">
                  <GallerySnippetEditor
                    fillParent
                    value={activeCode}
                    codeLang={codeLang}
                    onChange={handleCodeChange}
                  />
                </div>
              </div>
            </section>
            )}

            {showPreview && (
            <section
              className={`flex min-h-[200px] flex-col overflow-hidden bg-slate-900/50 min-[380px]:min-h-[220px] md:min-h-0 ${
                layoutMode === 'split' ? 'md:w-1/2 md:flex-1' : 'flex-1'
              }`}
            >
              <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-2 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
                  {error ? 'Terminal' : 'Preview'}
                </span>
                {elapsedMs != null && (
                  <span className="text-[10px] text-slate-500 tabular-nums sm:text-[11px]">{elapsedMs} ms</span>
                )}
                {running && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                    Running…
                  </span>
                )}
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[length:20px_20px] bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[0_0,0_10px,10px_-10px,-10px_0px] bg-slate-950/90">
                {running && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                    <div className="h-10 w-10 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                  </div>
                )}

                {error && (
                  <div className="relative z-[5] flex-1 min-h-0 flex flex-col">
                    <StudioRunnerTerminal rawMessage={error} exitCode={errorExitCode} />
                  </div>
                )}

                {previewUrl && !error && <StudioPreviewZoom src={previewUrl} alt="Rendered output from your snippet" />}

                {!previewUrl && !error && !running && (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-sm text-slate-500 text-center px-4">
                      Run your code to see PNG or GIF output here.
                    </p>
                  </div>
                )}
              </div>
            </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
