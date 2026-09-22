'use client';

import type { InteractiveDiagnostic } from '@/lib/docs/playground/contracts';

function severityColor(severity: InteractiveDiagnostic['severity']): string {
  if (severity === 'error') return 'var(--apx-status-deprecated-fg)';
  if (severity === 'warning') return 'var(--apx-status-experimental-fg)';
  return 'var(--apx-status-preview-fg)';
}

export function DiagnosticsPanel({ diagnostics, onClear }: { diagnostics: InteractiveDiagnostic[]; onClear?: () => void }) {
  return (
    <section data-doc8-primitive="diagnostics" aria-label="Diagnostics" className="min-h-0 overflow-auto rounded-lg" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-sunken)' }}>
      <div className="flex items-center justify-between gap-3 px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-secondary)' }}>Diagnostics</h3>
        {onClear && diagnostics.length ? <button type="button" onClick={onClear} className="rounded-md px-2 py-1 text-xs" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>Clear</button> : null}
      </div>
      {diagnostics.length === 0 ? <p className="px-3 py-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>No diagnostics.</p> : (
        <ul className="divide-y" aria-live="polite" style={{ borderColor: 'var(--border-subtle)' }}>
          {diagnostics.map((item) => <li key={item.id} className="px-3 py-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: severityColor(item.severity), border: '1px solid currentColor' }}>{item.severity}</span>
              <div className="min-w-0"><p style={{ color: 'var(--text-primary)' }}>{item.message}</p>{item.source || item.line ? <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{item.source ?? 'source'}{item.line ? `:${item.line}${item.column ? `:${item.column}` : ''}` : ''}</p> : null}{item.help ? <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{item.help}</p> : null}</div>
            </div>
          </li>)}
        </ul>
      )}
    </section>
  );
}
