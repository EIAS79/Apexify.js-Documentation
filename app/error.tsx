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
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 py-16 text-center" id="main-content">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Something went wrong</p>
      <h1 className="text-2xl font-bold text-slate-100">This page could not be rendered</h1>
      <p className="max-w-lg text-slate-400 text-sm">
        Retry the current page. If the problem continues, return to the documentation entry point.
      </p>
      {error.digest ? <p className="text-xs text-slate-500">Reference: {error.digest}</p> : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          Try again
        </button>
        <Link
          href="/docs/getting-started"
          className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          Open documentation
        </Link>
      </div>
    </main>
  );
}
