'use client';

import DocHeader from '@/components/DocHeader';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Twilight backdrop — matches home / studio */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{ background: 'var(--gradient-twilight)' }}
        />
        <div
          className="absolute -left-[20%] -top-[15%] h-[60vh] w-[55vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, color-mix(in srgb, var(--accent-iris) 28%, transparent), transparent 70%)',
            opacity: 0.55,
          }}
        />
        <div
          className="absolute right-[-15%] top-[25%] h-[50vh] w-[45vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, color-mix(in srgb, var(--accent-magenta) 25%, transparent), transparent 70%)',
            opacity: 0.45,
          }}
        />
        <div
          className="absolute left-[10%] bottom-[-10%] h-[40vh] w-[45vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, color-mix(in srgb, var(--accent-amber) 18%, transparent), transparent 70%)',
            opacity: 0.4,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--border-subtle) 100%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border-subtle) 100%, transparent) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            opacity: 0.45,
            maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          }}
        />
      </div>

      <DocHeader />
      {children}
    </div>
  );
}
