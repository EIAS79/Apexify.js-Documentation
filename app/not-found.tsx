import Link from 'next/link';
import { BrandIcon } from '@/components/Brand';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16" id="main-content">
      <section className="w-full max-w-xl border-y py-10" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8"><BrandIcon /></span>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--accent)' }}>HTTP / 404</p>
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em]" style={{ color: 'var(--text)' }}>Page not found.</h1>
        <p className="mt-3 max-w-md text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
          The requested route does not exist or has moved. Use the current documentation entry point or return home.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/docs/getting-started" className="btn btn-primary">Open docs</Link>
          <Link href="/" className="btn btn-secondary">Back home</Link>
        </div>
      </section>
    </main>
  );
}
