import Link from 'next/link';

/** Minimal server-only UI — avoids heavy shared chunks during error rendering on Windows dev. */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">404</p>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="max-w-md text-sm text-slate-700 dark:text-slate-300">The page you requested does not exist or was moved.</p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400"
      >
        Back to home
      </Link>
    </div>
  );
}
