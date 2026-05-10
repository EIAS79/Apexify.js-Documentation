'use client';

import { parseStudioRunnerOutput } from '@/lib/studio/studioRunnerTerminal';

export function StudioRunnerTerminal({
  rawMessage,
  exitCode,
}: {
  rawMessage: string;
  /** Server process exit code, or `null` when the client failed before a process exit (e.g. network). */
  exitCode: number | null;
}) {
  const { headline, hints, terminalBody } = parseStudioRunnerOutput(rawMessage);
  const exitLabel =
    exitCode !== null && exitCode !== undefined ? (
      <span style={{ color: 'var(--danger)' }}>exit {exitCode}</span>
    ) : (
      <span style={{ color: 'var(--warning)' }}>client error</span>
    );

  return (
    <div
      className="mx-1 mb-1.5 mt-0.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg sm:mx-2 sm:mb-2 sm:mt-1 sm:rounded-xl md:mx-3"
      style={{
        backgroundColor: 'var(--bg-base)',
        border: '1px solid color-mix(in srgb, var(--danger) 38%, transparent)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 32px -16px color-mix(in srgb, var(--danger) 60%, transparent)',
      }}
    >
      <div
        className="flex shrink-0 items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2"
        style={{
          backgroundColor: 'var(--bg-sunken)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ff5f56' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#27c93f' }} />
        </span>
        <span
          className="text-[11px] font-mono truncate"
          style={{ color: 'var(--text-tertiary)' }}
        >
          apexify-runner — {exitLabel}
        </span>
      </div>

      <div
        className="shrink-0 px-2 py-2 sm:px-3 sm:py-2.5"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--danger) 10%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
        }}
      >
        <p
          className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider sm:mb-1 sm:text-[10px]"
          style={{ color: 'var(--danger)' }}
        >
          What went wrong
        </p>
        <p
          className="text-xs font-medium leading-snug sm:text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {headline}
        </p>
        {hints.length > 0 && (
          <ul
            className="mt-1.5 list-none space-y-1 text-[10px] leading-relaxed sm:mt-2 sm:space-y-1.5 sm:text-[11px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {hints.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 font-mono text-[10px] mt-0.5" style={{ color: 'var(--accent-amber)' }}>
                  ›
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 92%, black)' }}
      >
        <div
          className="shrink-0 px-2 py-1 sm:px-3 sm:py-1.5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <span
            className="text-[9px] font-mono uppercase tracking-wider sm:text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            stderr / stack trace
          </span>
        </div>
        <pre
          className="flex-1 overflow-auto break-words p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap sm:p-3 sm:text-[11px]"
          tabIndex={0}
          role="log"
          aria-label="Full error output from runner"
          style={{ color: 'var(--success)' }}
        >
          {terminalBody || '(empty)'}
        </pre>
      </div>
    </div>
  );
}
