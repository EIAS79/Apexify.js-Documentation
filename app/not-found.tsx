import Link from 'next/link';

/** Minimal server-only UI — avoids heavy shared chunks during error rendering on Windows dev. */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">404</p>
      <h1 className="text-2xl font-bold text-slate-100">Page not found</h1>
      <p className="max-w-md text-slate-400 text-sm">The page you requested does not exist or was moved.</p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
