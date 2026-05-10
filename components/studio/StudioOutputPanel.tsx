'use client';

import {
  ClockIcon,
  CommandLineIcon,
  PhotoIcon,
  TrashIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { StudioPreviewZoom } from './StudioPreviewZoom';
import { StudioRunnerTerminal } from './StudioRunnerTerminal';
import { RunHistoryEntry } from '@/lib/studio/studioConfig';

export type OutputTab = 'preview' | 'terminal' | 'history';

type Props = {
  tab: OutputTab;
  onTabChange: (next: OutputTab) => void;
  running: boolean;
  previewUrl: string | null;
  error: string | null;
  errorExitCode: number | null;
  elapsedMs: number | null;
  history: RunHistoryEntry[];
  onReplayHistory: (entry: RunHistoryEntry) => void;
  onClearHistory: () => void;
};

function formatTs(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function TabPill({
  active,
  onClick,
  Icon,
  label,
  badge,
  status,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof PhotoIcon;
  label: string;
  badge?: string | number;
  status?: 'ok' | 'error' | 'idle';
}) {
  const statusColor =
    status === 'ok'
      ? 'var(--success)'
      : status === 'error'
        ? 'var(--danger)'
        : 'var(--border-strong)';
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:text-xs"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        background: active ? 'var(--bg-raised)' : 'transparent',
        boxShadow: active ? 'inset 0 0 0 1px var(--border-default)' : 'none',
      }}
    >
      {status && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
      )}
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
          style={{
            backgroundColor: active ? 'var(--accent-iris)' : 'var(--border-default)',
            color: active ? 'white' : 'var(--text-tertiary)',
          }}
        >
          {badge}
        </span>
      )}
      {active && (
        <span
          aria-hidden
          className="absolute -bottom-px left-2 right-2 h-[2px] rounded-full"
          style={{ background: 'var(--gradient-sunset)' }}
        />
      )}
    </button>
  );
}

export function StudioOutputPanel(props: Props) {
  const {
    tab,
    onTabChange,
    running,
    previewUrl,
    error,
    errorExitCode,
    elapsedMs,
    history,
    onReplayHistory,
    onClearHistory,
  } = props;

  const previewStatus: 'ok' | 'error' | 'idle' = error ? 'error' : previewUrl ? 'ok' : 'idle';

  return (
    <section
      className="flex min-h-[200px] flex-col overflow-hidden min-[380px]:min-h-[220px] md:min-h-0"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      <div
        className="flex shrink-0 flex-wrap items-center gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        role="tablist"
        aria-label="Output panel"
      >
        <TabPill
          active={tab === 'preview'}
          onClick={() => onTabChange('preview')}
          Icon={PhotoIcon}
          label="Preview"
          status={previewStatus}
        />
        <TabPill
          active={tab === 'terminal'}
          onClick={() => onTabChange('terminal')}
          Icon={CommandLineIcon}
          label="Terminal"
          status={error ? 'error' : 'idle'}
        />
        <TabPill
          active={tab === 'history'}
          onClick={() => onTabChange('history')}
          Icon={ClockIcon}
          label="History"
          badge={history.length}
        />

        <span aria-hidden className="ml-auto" />
        {running && (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: 'var(--success)' }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--success)' }}
              aria-hidden
            />
            Running…
          </span>
        )}
        {!running && elapsedMs != null && (
          <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
            {elapsedMs} ms
          </span>
        )}
      </div>

      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-canvas)' }}
      >
        {running && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-base) 40%, transparent)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              className="h-10 w-10 animate-spin rounded-full"
              style={{
                border: '2px solid color-mix(in srgb, var(--accent-iris) 30%, transparent)',
                borderTopColor: 'var(--accent-iris)',
              }}
            />
          </div>
        )}

        {tab === 'preview' && (
          <>
            {error ? (
              <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6">
                <div className="text-center">
                  <p
                    className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: 'var(--danger)' }}
                  >
                    Run failed
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    See the <strong>Terminal</strong> tab for details.
                  </p>
                  <button
                    type="button"
                    onClick={() => onTabChange('terminal')}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-raised)',
                    }}
                  >
                    <CommandLineIcon className="h-3.5 w-3.5" aria-hidden />
                    Open terminal
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <StudioPreviewZoom src={previewUrl} alt="Rendered output from your snippet" />
            ) : !running ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Run your code (<kbd className="kbd">⌘</kbd> <kbd className="kbd">↵</kbd>) to see PNG / GIF output here.
                </p>
              </div>
            ) : null}
          </>
        )}

        {tab === 'terminal' && (
          <>
            {error ? (
              <StudioRunnerTerminal rawMessage={error} exitCode={errorExitCode} />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                  No errors. Last run completed cleanly
                  {elapsedMs != null ? ` in ${elapsedMs} ms.` : '.'}
                </p>
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <HistoryTab history={history} onReplay={onReplayHistory} onClear={onClearHistory} />
        )}
      </div>
    </section>
  );
}

function HistoryTab({
  history,
  onReplay,
  onClear,
}: {
  history: RunHistoryEntry[];
  onReplay: (entry: RunHistoryEntry) => void;
  onClear: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <ClockIcon
            className="mx-auto mb-3 h-9 w-9"
            style={{ color: 'var(--text-muted)' }}
            aria-hidden
          />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Recent runs land here. Hit <kbd className="kbd">⌘</kbd> <kbd className="kbd">↵</kbd> to start.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span>Last {history.length} run{history.length === 1 ? '' : 's'}</span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-raised)',
          }}
          title="Clear run history"
        >
          <TrashIcon className="h-3 w-3" aria-hidden />
          Clear
        </button>
      </div>

      <ul className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
        {history.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onReplay(entry)}
              className="group flex w-full items-stretch gap-3 overflow-hidden rounded-lg p-2 text-left transition-all hover:-translate-y-[1px]"
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--bg-raised)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span
                className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-md"
                style={{
                  backgroundColor: 'var(--bg-sunken)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {entry.thumbDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- run-history thumbnail
                  <img
                    src={entry.thumbDataUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <CommandLineIcon
                    className="h-5 w-5"
                    style={{ color: entry.ok ? 'var(--success)' : 'var(--danger)' }}
                    aria-hidden
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: entry.ok
                        ? 'color-mix(in srgb, var(--success) 14%, transparent)'
                        : 'color-mix(in srgb, var(--danger) 14%, transparent)',
                      color: entry.ok ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {entry.ok ? 'OK' : entry.exitCode != null ? `EXIT ${entry.exitCode}` : 'ERR'}
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--accent-iris)',
                      color: 'white',
                    }}
                  >
                    {entry.lang.toUpperCase()}
                  </span>
                  {entry.elapsedMs != null && (
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                      {entry.elapsedMs} ms
                    </span>
                  )}
                </span>
                <span className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {entry.bufferName}
                </span>
                <span className="flex items-center justify-between gap-2 text-[10px]">
                  <span style={{ color: 'var(--text-muted)' }}>{formatTs(entry.ts)}</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 opacity-0 transition group-hover:opacity-100"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <PlayIcon className="h-3 w-3" aria-hidden />
                    Replay
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
