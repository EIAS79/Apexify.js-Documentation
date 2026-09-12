'use client';

import type { ReactNode } from 'react';
import type { PreviewStatus } from '@/lib/docs/playground/contracts';

export function InteractivePreview({
  status,
  label,
  provenance,
  children,
}: {
  status: PreviewStatus;
  label: string;
  provenance?: 'verified' | 'server-generated' | 'static';
  children?: ReactNode;
}) {
  const truthLabel = provenance === 'verified' ? 'Verified output' : provenance === 'server-generated' ? 'Server-generated output' : provenance === 'static' ? 'Static preview' : null;
  return (
    <section
      data-doc8-primitive="preview"
      data-preview-status={status}
      aria-label={label}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ background: 'var(--bg-canvas)' }}
    >
      {truthLabel ? (
        <div className="shrink-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
          {truthLabel}
        </div>
      ) : null}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {status === 'loading' || status === 'resetting' ? (
          <div role="status" className="grid min-h-[180px] flex-1 place-items-center p-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {status === 'loading' ? 'Preparing preview…' : 'Resetting preview…'}
          </div>
        ) : children ? children : (
          <div className="grid min-h-[180px] flex-1 place-items-center p-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {status === 'unsupported' ? 'Preview is not available for this runtime.' : status === 'error' ? 'Preview failed. See diagnostics for details.' : 'No preview is available yet.'}
          </div>
        )}
      </div>
    </section>
  );
}
