'use client';

import { StudioLang } from '@/lib/studio/studioConfig';

type Props = {
  lang: StudioLang;
  onToggleLang: () => void;
  bufferName: string;
  lineCount: number;
  charCount: number;
  autoRun: boolean;
  onToggleAutoRun: () => void;
  runnerEnabled: boolean;
  running: boolean;
  lastError: boolean;
  elapsedMs: number | null;
  hasOutput: boolean;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function StudioStatusBar(props: Props) {
  const {
    lang,
    onToggleLang,
    bufferName,
    lineCount,
    charCount,
    autoRun,
    onToggleAutoRun,
    runnerEnabled,
    running,
    lastError,
    elapsedMs,
    hasOutput,
  } = props;

  const sandboxLabel = !runnerEnabled
    ? 'Sandbox · disabled'
    : running
      ? 'Sandbox · running'
      : lastError
        ? 'Sandbox · error'
        : 'Sandbox · ready';
  const sandboxColor = !runnerEnabled
    ? 'var(--warning)'
    : running
      ? 'var(--info)'
      : lastError
        ? 'var(--danger)'
        : 'var(--success)';

  return (
    <footer
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 text-[10px] sm:gap-x-4 sm:px-4 sm:text-[11px]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-sunken) 85%, transparent)',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-tertiary)',
      }}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: sandboxColor }}
          aria-hidden
        />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{sandboxLabel}</span>
      </span>

      <span aria-hidden style={{ color: 'var(--border-strong)' }}>·</span>

      <button
        type="button"
        onClick={onToggleLang}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-[var(--bg-raised)]"
        title="Toggle TypeScript / JavaScript"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span
          className="rounded-sm px-1 py-0.5 text-[9px] font-bold tracking-wide"
          style={{ backgroundColor: 'var(--accent-iris)', color: 'white' }}
        >
          {lang.toUpperCase()}
        </span>
        <span className="hidden sm:inline">snippet</span>
      </button>

      <span className="truncate" style={{ color: 'var(--text-secondary)' }} title={bufferName}>
        <span style={{ color: 'var(--text-tertiary)' }}>tab:</span> {bufferName}
      </span>

      <span aria-hidden style={{ color: 'var(--border-strong)' }} className="hidden sm:inline">·</span>
      <span className="hidden tabular-nums sm:inline">
        {lineCount} line{lineCount === 1 ? '' : 's'}
      </span>
      <span aria-hidden style={{ color: 'var(--border-strong)' }} className="hidden sm:inline">·</span>
      <span className="hidden tabular-nums sm:inline">{formatBytes(charCount)}</span>

      <span aria-hidden className="ml-auto" />

      <button
        type="button"
        onClick={onToggleAutoRun}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-[var(--bg-raised)]"
        title="Toggle auto-run on edit"
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: autoRun ? 'var(--accent-iris)' : 'var(--border-strong)' }}
          aria-hidden
        />
        <span style={{ color: 'var(--text-secondary)' }}>Auto-run {autoRun ? 'on' : 'off'}</span>
      </button>

      {hasOutput && (
        <>
          <span aria-hidden style={{ color: 'var(--border-strong)' }}>·</span>
          <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            Last: {elapsedMs != null ? `${elapsedMs} ms` : '—'}
          </span>
        </>
      )}
    </footer>
  );
}
