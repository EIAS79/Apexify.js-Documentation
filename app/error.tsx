'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Apexify docs] route error', error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-16" id="main-content">
      <section className="w-full max-w-xl border-y py-10" style={{ borderColor: 'var(--border)' }}>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--danger)' }}>RENDER / ERROR</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]" style={{ color: 'var(--text)' }}>This route could not be rendered.</h1>
        <p className="mt-3 max-w-lg text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
          Retry the current page. If the problem continues, return to the documentation entry point.
        </p>
        {error.digest ? <p className="mt-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>Reference: {error.digest}</p> : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/docs/getting-started" className="btn btn-secondary">Open documentation</Link>
        </div>
      </section>
    </main>
  );
}
