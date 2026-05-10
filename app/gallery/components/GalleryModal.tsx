'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  XMarkIcon,
  CodeBracketIcon,
  PhotoIcon,
  ViewColumnsIcon,
  PlayIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShareIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { GallerySnippetEditor } from './GallerySnippetEditor';
import { CATEGORY_CONFIG } from './galleryConfig';
import { type GalleryItem, primaryBadgeCategory } from './galleryHelpers';
import { inferMediaKind, buildGalleryHash } from '@/lib/gallery/core/galleryDocLink';
import { STUDIO_INCOMING_SNIPPET_KEY } from '@/lib/studio/studioConfig';
import GalleryZoomablePreview from './GalleryZoomablePreview';

type ModalLayoutMode = 'code' | 'split' | 'media';

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
      {children}
    </strong>
  ),
  code: ({ children }) => (
    <code
      className="rounded-md px-1.5 py-0.5 font-mono text-[12.5px]"
      style={{
        backgroundColor: 'var(--bg-sunken)',
        color: 'var(--accent-magenta)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {children}
    </code>
  ),
};

async function decodeDataUrlForDraw(src: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => reject(new Error('Preview image failed to decode'));
    img.src = src;
  });
}

function waitPaintTwice(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export default function GalleryModal({
  item,
  itemIndex,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: GalleryItem;
  itemIndex: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const router = useRouter();
  const cfg = CATEGORY_CONFIG[primaryBadgeCategory(item)];
  const Icon = cfg.icon;
  const hasTs = Boolean(item.code?.ts?.trim());
  const hasJs = Boolean(item.code?.js?.trim());
  const hasCode = hasTs || hasJs;
  const modalMediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);
  const sandboxEligible = hasCode && modalMediaKind !== 'video';

  const [layoutMode, setLayoutMode] = useState<ModalLayoutMode>(hasCode ? 'split' : 'media');
  const [codeLang, setCodeLang] = useState<'ts' | 'js'>(hasTs ? 'ts' : 'js');
  const [editedCode, setEditedCode] = useState('');
  const [sandboxDataUrl, setSandboxDataUrl] = useState<string | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [drawMs, setDrawMs] = useState<number | null>(null);
  const [runProgress, setRunProgress] = useState(0);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [runnerEnabled, setRunnerEnabled] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const sandboxProgressRafRef = useRef(0);

  const codeText = codeLang === 'ts' ? item.code?.ts ?? '' : item.code?.js ?? '';

  // Reset transient state when item or language changes
  useEffect(() => {
    setLayoutMode(hasCode ? 'split' : 'media');
    setCodeLang(hasTs ? 'ts' : 'js');
  }, [item.id, hasTs, hasCode]);

  useEffect(() => {
    setEditedCode(codeText);
    setSandboxDataUrl(null);
    setSandboxError(null);
    setDrawMs(null);
    setRunProgress(0);
  }, [item.id, codeLang, codeText]);

  // Fetch runner status
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

  // Cancel raf on unmount
  useEffect(() => {
    return () => {
      if (sandboxProgressRafRef.current) {
        cancelAnimationFrame(sandboxProgressRafRef.current);
        sandboxProgressRafRef.current = 0;
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && total > 1) onPrev();
      if (e.key === 'ArrowRight' && total > 1) onNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext, total]);

  const stopProgressLoop = () => {
    if (sandboxProgressRafRef.current) {
      cancelAnimationFrame(sandboxProgressRafRef.current);
      sandboxProgressRafRef.current = 0;
    }
  };
  const startProgressLoop = () => {
    const loop = () => {
      setRunProgress((p) => (p >= 92 ? p : Math.min(p + (92 - p) * 0.06 + 0.35, 92)));
      sandboxProgressRafRef.current = requestAnimationFrame(loop);
    };
    sandboxProgressRafRef.current = requestAnimationFrame(loop);
  };

  const resetSandbox = () => {
    stopProgressLoop();
    setEditedCode(codeText);
    setSandboxDataUrl(null);
    setSandboxError(null);
    setDrawMs(null);
    setRunProgress(0);
  };

  const runSandbox = async () => {
    if (!sandboxEligible || !editedCode.trim() || sandboxRunning) return;
    const tClick = performance.now();
    stopProgressLoop();
    setSandboxRunning(true);
    setSandboxError(null);
    setDrawMs(null);
    setRunProgress(0);
    startProgressLoop();

    try {
      const res = await fetch('/api/gallery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editedCode, lang: codeLang }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mime?: string;
        base64?: string;
        error?: string;
      };
      stopProgressLoop();

      if (!res.ok || !data.ok) {
        setSandboxDataUrl(null);
        setSandboxError(data.error ?? `Run failed (${res.status})`);
        setDrawMs(null);
        setRunProgress(0);
        return;
      }

      setRunProgress(100);
      const mime = data.mime ?? 'image/png';
      const dataUrl = `data:${mime};base64,${data.base64 ?? ''}`;
      await decodeDataUrlForDraw(dataUrl);
      setSandboxDataUrl(dataUrl);
      await waitPaintTwice();
      setDrawMs(Math.round(performance.now() - tClick));
      window.setTimeout(() => setRunProgress(0), 550);
    } catch (e) {
      stopProgressLoop();
      setSandboxError(e instanceof Error ? e.message : 'Network error');
      setSandboxDataUrl(null);
      setDrawMs(null);
      setRunProgress(0);
    } finally {
      stopProgressLoop();
      setSandboxRunning(false);
    }
  };

  const copyCode = () => {
    if (!editedCode.trim()) return;
    void navigator.clipboard.writeText(editedCode).then(() => {
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1800);
    });
  };

  const shareLink = () => {
    const hash = `#${encodeURIComponent(buildGalleryHash(item))}`;
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    void navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    });
  };

  const openInStudio = () => {
    if (!hasCode) return;
    try {
      /**
       * Send the user's edits for the language they're actively viewing,
       * and keep the original for the other language. If they never typed,
       * `editedCode` still equals the original `codeText` so this is a no-op.
       * Studio picks this payload up on mount, opens it as a new tab, and
       * clears the slot.
       */
      const liveCode = editedCode || codeText;
      const payload = {
        name: item.title || 'Gallery snippet',
        ts: codeLang === 'ts' ? liveCode : item.code?.ts ?? '',
        js: codeLang === 'js' ? liveCode : item.code?.js ?? '',
        lang: codeLang,
      };
      localStorage.setItem(STUDIO_INCOMING_SNIPPET_KEY, JSON.stringify(payload));
    } catch {
      /* localStorage may be blocked — silently continue */
    }
    router.push('/studio');
  };

  const showCode = hasCode && layoutMode !== 'media';
  const showMedia = layoutMode !== 'code';
  const previewSrc = sandboxEligible && sandboxDataUrl ? sandboxDataUrl : item.thumbnail;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] backdrop-blur-md transition-opacity"
        style={{ backgroundColor: 'var(--bg-overlay)' }}
        onClick={onClose}
        aria-hidden
      />

      <div
        className="fixed inset-0 z-[101] flex flex-col p-0 sm:p-3 md:p-6 lg:p-10 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
        aria-describedby="gallery-modal-about"
      >
        <div
          className="pointer-events-auto flex flex-col flex-1 min-h-0 max-h-[100dvh] sm:max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-3rem)] w-full max-w-7xl mx-auto rounded-none sm:rounded-2xl lg:rounded-3xl overflow-hidden surface-elevated"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* HEADER */}
          <div
            className="flex-shrink-0 px-4 sm:px-6 py-4 border-b"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-raised)',
            }}
          >
            {/* Top row — close + nav + tools */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-sunken)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  aria-label="Close"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                {total > 1 && (
                  <div
                    className="hidden sm:flex items-center gap-1 px-1 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-sunken)',
                      borderColor: 'var(--border-default)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={onPrev}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                      aria-label="Previous (←)"
                      title="Previous (←)"
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                    </button>
                    <span
                      className="text-[11px] font-mono tabular-nums px-1"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {itemIndex + 1} / {total}
                    </span>
                    <button
                      type="button"
                      onClick={onNext}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                      aria-label="Next (→)"
                      title="Next (→)"
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {hasCode && (
                  <button
                    type="button"
                    onClick={openInStudio}
                    className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-semibold border transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-sunken)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-iris)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }}
                    title="Send this snippet to the Studio"
                  >
                    <RocketLaunchIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent-iris)' }} />
                    Open in Studio
                  </button>
                )}
                <button
                  type="button"
                  onClick={shareLink}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-semibold border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-sunken)',
                    borderColor: 'var(--border-default)',
                    color: shareCopied ? 'var(--success)' : 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!shareCopied) e.currentTarget.style.borderColor = 'var(--accent-magenta)';
                  }}
                  onMouseLeave={(e) => {
                    if (!shareCopied) e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                  title="Copy link to this item"
                >
                  {shareCopied ? <CheckIcon className="h-3.5 w-3.5" /> : <ShareIcon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Title row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="shrink-0 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: cfg.accent,
                  boxShadow: `0 0 26px -6px ${cfg.accent}`,
                }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: cfg.accent }}
                  >
                    {cfg.label}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    · {item.id}
                  </span>
                </div>
                <h2
                  id="gallery-modal-title"
                  className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight tracking-tight break-words"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.title}
                </h2>
              </div>
              {hasCode && (
                <ModalLayoutToolbar mode={layoutMode} onChange={setLayoutMode} />
              )}
            </div>

            {/* About */}
            <div
              id="gallery-modal-about"
              className="mt-4 px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-sunken)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                About this example
              </p>
              <div className="text-[13.5px] leading-relaxed">
                <ReactMarkdown components={MARKDOWN_COMPONENTS}>{item.description}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto overflow-x-hidden lg:overflow-hidden">
            {/* Code pane */}
            <div
              className={[
                'flex flex-col min-h-0 min-w-0',
                showCode ? 'border-b lg:border-b-0 lg:border-r' : 'hidden',
                showCode &&
                  layoutMode === 'split' &&
                  'w-full shrink-0 min-h-[min(52vh,420px)] lg:min-h-0 lg:flex-1 lg:w-1/2 lg:flex-none lg:max-w-[50%]',
                showCode && layoutMode === 'code' && 'flex-1 w-full min-h-[min(42vh,340px)] lg:min-h-0',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <div className="flex flex-1 min-h-0 min-w-0 h-full flex-col p-3 sm:p-4">
                {hasCode ? (
                  <>
                    {modalMediaKind === 'video' && (
                      <div
                        className="mb-3 rounded-lg px-3 py-2 text-[11px] leading-snug border"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--accent-amber) 10%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--accent-amber) 35%, transparent)',
                          color: 'var(--accent-amber)',
                        }}
                      >
                        MP4 examples are encoded with FFmpeg. Use the preview above and copy the source below to run locally with Node + FFmpeg if needed.
                      </div>
                    )}
                    <CodeWindow
                      code={editedCode}
                      onCodeChange={setEditedCode}
                      editable={sandboxEligible}
                      codeLang={codeLang}
                      hasTs={hasTs}
                      hasJs={hasJs}
                      onLangChange={setCodeLang}
                      sandboxEligible={sandboxEligible}
                      runnerEnabled={runnerEnabled}
                      onRunSandbox={runSandbox}
                      onResetSandbox={resetSandbox}
                      sandboxRunning={sandboxRunning}
                      runProgress={runProgress}
                      drawMs={drawMs}
                      onCopyCode={copyCode}
                      codeCopied={codeCopied}
                    />
                  </>
                ) : (
                  <div
                    className="flex items-center justify-center min-h-[200px] rounded-xl border"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-sunken)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    No source listing for this item.
                  </div>
                )}
              </div>
            </div>

            {/* Media pane */}
            <div
              className={[
                'flex flex-col min-h-0 min-w-0',
                !showMedia && 'hidden',
                showMedia &&
                  layoutMode === 'split' &&
                  'w-full shrink-0 min-h-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:flex-1 lg:min-h-0 lg:w-1/2 lg:flex-none lg:max-w-[50%] lg:pb-0',
                showMedia && layoutMode === 'media' && 'flex-1 min-h-0 w-full',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ backgroundColor: 'var(--bg-canvas)' }}
            >
              <div className="flex flex-1 min-h-0 min-w-0 flex-col p-3 sm:p-4 max-lg:min-h-[min(44vh,280px)]">
                {modalMediaKind === 'video' ? (
                  <div className="flex flex-1 min-h-0 flex-col items-center justify-center">
                    <video
                      src={item.thumbnail}
                      className="max-w-full max-h-[min(78vh,880px)] rounded-xl"
                      style={{ boxShadow: 'var(--shadow-lg)' }}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <>
                    {sandboxEligible && sandboxDataUrl && (
                      <p
                        className="mb-3 shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium leading-snug border"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--success) 12%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--success) 35%, transparent)',
                          color: 'var(--success)',
                        }}
                      >
                        Preview shows your last sandbox run (PNG/GIF buffer). Reset code clears this overlay.
                      </p>
                    )}
                    <GalleryZoomablePreview
                      src={previewSrc}
                      alt={
                        sandboxEligible && sandboxDataUrl
                          ? `${item.title} — sandbox output`
                          : item.title
                      }
                    />
                    {sandboxError && sandboxEligible && (
                      <div
                        role="alert"
                        className="mt-3 shrink-0 rounded-lg px-3 py-2.5 text-[12px] leading-relaxed border whitespace-pre-wrap"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)',
                          color: 'var(--danger)',
                        }}
                      >
                        {sandboxError}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =====================================================================
   Layout toolbar (Code / Split / Preview)
   ===================================================================== */

function ModalLayoutToolbar({
  mode,
  onChange,
}: {
  mode: ModalLayoutMode;
  onChange: (m: ModalLayoutMode) => void;
}) {
  const buttons: { id: ModalLayoutMode; label: string; Icon: typeof CodeBracketIcon }[] = [
    { id: 'code', label: 'Code', Icon: CodeBracketIcon },
    { id: 'split', label: 'Split', Icon: ViewColumnsIcon },
    { id: 'media', label: 'Preview', Icon: PhotoIcon },
  ];
  return (
    <div
      className="hidden sm:flex shrink-0 rounded-lg border p-0.5"
      style={{
        backgroundColor: 'var(--bg-sunken)',
        borderColor: 'var(--border-default)',
      }}
      role="group"
      aria-label="Layout"
    >
      {buttons.map((b) => {
        const active = mode === b.id;
        const Icon = b.Icon;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onChange(b.id)}
            aria-pressed={active}
            className="px-2 sm:px-2.5 py-1.5 rounded-md text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors"
            style={
              active
                ? {
                    backgroundImage: 'var(--gradient-sunset)',
                    color: 'white',
                  }
                : { color: 'var(--text-secondary)' }
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{b.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =====================================================================
   Code window with TS/JS tabs, run, reset, copy, progress
   ===================================================================== */

const galleryMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

function CodeWindow({
  code,
  onCodeChange,
  editable,
  codeLang,
  hasTs,
  hasJs,
  onLangChange,
  sandboxEligible,
  runnerEnabled,
  onRunSandbox,
  onResetSandbox,
  sandboxRunning,
  runProgress,
  drawMs,
  onCopyCode,
  codeCopied,
}: {
  code: string;
  onCodeChange?: (next: string) => void;
  editable: boolean;
  codeLang: 'ts' | 'js';
  hasTs: boolean;
  hasJs: boolean;
  onLangChange: (lang: 'ts' | 'js') => void;
  sandboxEligible: boolean;
  runnerEnabled: boolean;
  onRunSandbox: () => void;
  onResetSandbox: () => void;
  sandboxRunning: boolean;
  runProgress: number;
  drawMs: number | null;
  onCopyCode: () => void;
  codeCopied: boolean;
}) {
  const prismLang = codeLang === 'ts' ? 'typescript' : 'javascript';
  const fileLabel = codeLang === 'ts' ? 'snippet.ts' : 'snippet.js';
  const showSandboxBar = editable && sandboxEligible;

  return (
    <div
      className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full rounded-lg overflow-hidden border"
      style={{
        backgroundColor: '#0d1117',
        borderColor: 'var(--border-default)',
        fontFamily: galleryMono,
      }}
    >
      {/* Top bar — file label + lang tabs + copy */}
      <div
        className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 py-2 border-b"
        style={{
          backgroundColor: '#161b22',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <CodeBracketIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-iris-soft)' }} aria-hidden />
        <span className="text-xs font-semibold truncate min-w-0" style={{ color: '#e6edf3' }}>
          {fileLabel}
        </span>
        <span
          className="text-[10px] font-medium shrink-0 uppercase tracking-wide"
          style={{ color: '#8b949e' }}
        >
          {codeLang.toUpperCase()}
        </span>
        <span className="flex-1 min-w-2" />
        {hasTs && hasJs && (
          <div
            className="flex rounded-md p-0.5 shrink-0 border"
            style={{
              backgroundColor: '#0d1117',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
            role="tablist"
            aria-label="Language"
          >
            {(['ts', 'js'] as const).map((l) => {
              const active = codeLang === l;
              return (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onLangChange(l)}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold transition-colors"
                  style={
                    active
                      ? {
                          backgroundImage: 'var(--gradient-sunset)',
                          color: 'white',
                        }
                      : { color: '#8b949e' }
                  }
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={onCopyCode}
          title={codeCopied ? 'Copied' : 'Copy code'}
          aria-label={codeCopied ? 'Copied' : 'Copy code'}
          className="shrink-0 inline-flex h-7 px-2 items-center justify-center rounded-md text-xs font-medium transition-colors border"
          style={{
            backgroundColor: '#0d1117',
            borderColor: 'rgba(255,255,255,0.08)',
            color: codeCopied ? 'var(--success)' : '#e6edf3',
          }}
        >
          {codeCopied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Sandbox toolbar */}
      {showSandboxBar && (
        <div
          className="flex-shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b"
          style={{
            backgroundColor: '#161b22',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <button
            type="button"
            onClick={onRunSandbox}
            disabled={!runnerEnabled || sandboxRunning || !code.trim()}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 transition-shadow"
            style={{
              backgroundImage: 'var(--gradient-sunset)',
              boxShadow: !runnerEnabled || sandboxRunning ? 'none' : 'var(--glow-magenta)',
            }}
          >
            <PlayIcon className="h-3.5 w-3.5" />
            {sandboxRunning ? 'Running…' : 'Run'}
          </button>
          <button
            type="button"
            onClick={onResetSandbox}
            disabled={sandboxRunning}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium border transition-colors disabled:opacity-45"
            style={{
              backgroundColor: '#0d1117',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#e6edf3',
            }}
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Reset
          </button>
          {drawMs != null && (
            <span className="text-[11px] tabular-nums" style={{ color: '#8b949e' }}>
              {drawMs} ms <span style={{ color: '#6e7681' }}>to preview</span>
            </span>
          )}
          {!runnerEnabled && (
            <span className="text-[11px]" style={{ color: 'var(--accent-amber)' }}>
              Sandbox runner disabled.
            </span>
          )}
          <span className="flex-1 min-w-[2rem]" />
          {(sandboxRunning || runProgress > 0) && (
            <div
              className="h-1 w-full sm:w-32 rounded-full overflow-hidden shrink-0"
              style={{ backgroundColor: '#0d1117' }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-150 ease-out"
                style={{
                  width: `${Math.min(100, runProgress)}%`,
                  backgroundImage: 'var(--gradient-sunset)',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Source */}
      <div
        className="flex-1 min-h-0 overflow-hidden overscroll-contain touch-pan-y flex flex-col"
        style={{ backgroundColor: '#0d1117' }}
      >
        {editable && onCodeChange ? (
          <div className="flex-1 min-h-[220px] flex flex-col p-2 sm:p-3">
            <GallerySnippetEditor value={code} codeLang={codeLang} onChange={onCodeChange} />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto [scrollbar-gutter:stable]">
            <div className="p-3 sm:p-4 min-w-0">
              <SyntaxHighlighter
                language={prismLang}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  fontSize: 'clamp(11px, 2.4vw, 13px)',
                  lineHeight: 1.55,
                }}
                showLineNumbers
                lineNumberStyle={{
                  color: 'rgba(235,235,245,0.22)',
                  paddingRight: '0.85rem',
                  minWidth: '2.35em',
                  userSelect: 'none',
                }}
                codeTagProps={{
                  style: { fontFamily: galleryMono, background: 'transparent' },
                }}
                PreTag="div"
              >
                {code || ' '}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
