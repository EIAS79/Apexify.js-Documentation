'use client';

import {
  ClockIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  PlayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { RunHistoryEntry } from '@/lib/studio/studioConfig';
import { InteractivePreview } from '@/components/docs/playground/InteractivePreview';
import { DiagnosticsPanel } from '@/components/docs/playground/DiagnosticsPanel';
import {
  StudioArtifactPreview,
  type StudioPreviewArtifact,
} from './StudioArtifactPreview';

export type OutputTab = 'preview' | 'terminal' | 'history';

type PreviewProvenance = 'browser-generated' | 'server-generated' | undefined;

type Props = {
  tab: OutputTab;
  onTabChange: (next: OutputTab) => void;
  running: boolean;
  previewArtifacts: StudioPreviewArtifact[];
  activeArtifactId: string | null;
  onArtifactSelect: (id: string) => void;
  previewProvenance: PreviewProvenance;
  notices: string[];
  error: string | null;
  errorExitCode: number | null;
  elapsedMs: number | null;
  history: RunHistoryEntry[];
  onReplayHistory: (entry: RunHistoryEntry) => void;
  onClearHistory: () => void;
};

const formatTs = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function Tab({
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
  badge?: number;
  status?: 'ok' | 'warning' | 'error' | 'idle';
}) {
  const statusColor =
    status === 'ok'
      ? 'var(--success)'
      : status === 'warning'
        ? 'var(--warning)'
        : status === 'error'
          ? 'var(--danger)'
          : 'var(--border-strong)';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="studio-output-tab inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
      data-active={active || undefined}
    >
      {status ? <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} /> : null}
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
      {badge !== undefined ? <span className="studio-output-tab__badge">{badge}</span> : null}
    </button>
  );
}

function ArtifactStrip({
  artifacts,
  activeId,
  onSelect,
}: {
  artifacts: StudioPreviewArtifact[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (artifacts.length <= 1) return null;

  return (
    <div
      className="flex shrink-0 gap-1.5 overflow-x-auto px-2 py-2"
      style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-sunken)' }}
      aria-label="Generated artifacts"
    >
      {artifacts.map((artifact, index) => {
        const active = artifact.id === activeId;
        return (
          <button
            key={artifact.id}
            type="button"
            onClick={() => onSelect(artifact.id)}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-left"
            style={{
              border: active ? '1px solid var(--studio-blue-2)' : '1px solid var(--border-default)',
              background: active ? 'var(--bg-raised)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
            title={artifact.mime}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              {artifact.kind} {index + 1}
            </span>
            <span className="block max-w-40 truncate text-xs font-semibold">{artifact.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StudioOutputPanel({
  tab,
  onTabChange,
  running,
  previewArtifacts,
  activeArtifactId,
  onArtifactSelect,
  previewProvenance,
  notices,
  error,
  errorExitCode,
  elapsedMs,
  history,
  onReplayHistory,
  onClearHistory,
}: Props) {
  const diagnostics = error
    ? [{
        id: 'studio-execution-error',
        severity: 'error' as const,
        message: error,
        code: errorExitCode == null ? undefined : `EXIT_${errorExitCode}`,
        help: 'Fix the source or return the generated Apexify artifact from main().',
      }]
    : [];

  const diagnosticStatus = error ? 'error' : notices.length ? 'warning' : 'idle';
  const activeArtifact =
    previewArtifacts.find((artifact) => artifact.id === activeArtifactId) ??
    previewArtifacts[0] ??
    null;

  return (
    <section className="studio-output-panel flex min-h-[200px] flex-col overflow-hidden md:min-h-0">
      <div
        role="tablist"
        aria-label="Output panel"
        className="studio-output-tabs flex shrink-0 flex-wrap items-center gap-1.5 px-2 py-2"
      >
        <Tab
          active={tab === 'preview'}
          onClick={() => onTabChange('preview')}
          Icon={PhotoIcon}
          label="Preview"
          badge={previewArtifacts.length > 1 ? previewArtifacts.length : undefined}
          status={error ? 'error' : activeArtifact ? 'ok' : 'idle'}
        />
        <Tab
          active={tab === 'terminal'}
          onClick={() => onTabChange('terminal')}
          Icon={CommandLineIcon}
          label="Diagnostics"
          badge={notices.length || undefined}
          status={diagnosticStatus}
        />
        <Tab
          active={tab === 'history'}
          onClick={() => onTabChange('history')}
          Icon={ClockIcon}
          label="History"
          badge={history.length}
        />
        <span className="ml-auto text-[11px]" style={{ color: running ? 'var(--success)' : 'var(--text-tertiary)' }}>
          {running ? 'Rendering…' : elapsedMs != null ? `${elapsedMs} ms` : ''}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === 'preview' ? (
          <>
            <ArtifactStrip
              artifacts={previewArtifacts}
              activeId={activeArtifact?.id ?? null}
              onSelect={onArtifactSelect}
            />
            <InteractivePreview
              status={running ? 'loading' : error ? 'error' : activeArtifact ? 'ready' : 'idle'}
              label="Studio output preview"
              provenance={activeArtifact ? previewProvenance : undefined}
            >
              {activeArtifact && !error ? (
                <StudioArtifactPreview
                  artifact={activeArtifact}
                  artifacts={previewArtifacts}
                  onArtifactSelect={onArtifactSelect}
                />
              ) : null}
            </InteractivePreview>
          </>
        ) : null}

        {tab === 'terminal' ? (
          <div className="studio-diagnostics min-h-0 flex-1 overflow-auto p-3">
            <DiagnosticsPanel diagnostics={diagnostics} />

            {notices.length ? (
              <div className="studio-diagnostics__notice mt-3">
                <div>
                  <ExclamationTriangleIcon className="h-4 w-4" aria-hidden />
                  <strong>Studio notes</strong>
                </div>
                <ul>
                  {notices.map((notice) => <li key={notice}>{notice}</li>)}
                </ul>
              </div>
            ) : null}

            {!error && notices.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No execution diagnostics{elapsedMs != null ? ` · last run ${elapsedMs} ms` : ''}.
              </p>
            ) : null}
          </div>
        ) : null}

        {tab === 'history' ? (
          <HistoryTab history={history} onReplay={onReplayHistory} onClear={onClearHistory} />
        ) : null}
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
  if (!history.length) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Recent renders land here.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 py-2 text-xs" style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
        <span>Last {history.length} render{history.length === 1 ? '' : 's'}</span>
        <button type="button" onClick={onClear} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2" style={{ border: '1px solid var(--border-default)' }}>
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
              className="studio-history-card flex min-h-16 w-full items-center gap-3 rounded-lg p-2 text-left"
            >
              {entry.thumbDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.thumbDataUrl} alt="" className="h-14 w-20 rounded object-cover" />
              ) : (
                <CommandLineIcon className="h-5 w-5" style={{ color: entry.ok ? 'var(--success)' : 'var(--danger)' }} aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{entry.bufferName}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {entry.ok ? 'OK' : 'ERROR'} · {entry.lang.toUpperCase()} · {formatTs(entry.ts)}
                </span>
              </span>
              <PlayIcon className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
