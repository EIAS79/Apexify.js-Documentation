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
      <span className="text-red-400/90">exit {exitCode}</span>
    ) : (
      <span className="text-amber-400/85">client error</span>
    );

  return (
    <div className="mx-1 mb-1.5 mt-0.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-red-500/35 bg-[#0d0d0d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:mx-2 sm:mb-2 sm:mt-1 sm:rounded-xl md:mx-3">
      {/* Terminal chrome */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#161616] px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </span>
        <span className="text-[11px] font-mono text-slate-500 truncate">
          apexify-runner — {exitLabel}
        </span>
      </div>

      {/* Plain-language summary */}
      <div className="shrink-0 border-b border-red-500/20 bg-red-950/25 px-2 py-2 sm:px-3 sm:py-2.5">
        <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-400/80 sm:mb-1 sm:text-[10px]">
          What went wrong
        </p>
        <p className="text-xs font-medium leading-snug text-red-100 sm:text-sm">{headline}</p>
        <ul className="mt-1.5 list-none space-y-1 text-[10px] leading-relaxed text-amber-100/85 sm:mt-2 sm:space-y-1.5 sm:text-[11px]">
          {hints.map((h, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-amber-500/90 shrink-0 font-mono text-[10px] mt-0.5">›</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Full stderr / stack — terminal colors */}
      <div className="flex min-h-0 flex-1 flex-col bg-black/40">
        <div className="shrink-0 border-b border-white/[0.06] px-2 py-1 sm:px-3 sm:py-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 sm:text-[10px]">
            stderr / stack trace
          </span>
        </div>
        <pre
          className="flex-1 overflow-auto break-words p-2 font-mono text-[10px] leading-relaxed text-emerald-400/95 whitespace-pre-wrap selection:bg-white/15 sm:p-3 sm:text-[11px]"
          tabIndex={0}
          role="log"
          aria-label="Full error output from runner"
        >
          {terminalBody || '(empty)'}
        </pre>
      </div>
    </div>
  );
}
