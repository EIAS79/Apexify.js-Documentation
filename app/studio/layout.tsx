import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Code studio | Apexify.js',
  description:
    'Edit Apexify.js snippets in the browser, inspect verified outputs, and use explicitly enabled trusted-local execution during development.',
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        [aria-label="Language"] > button[aria-pressed="true"],
        footer button[title="Toggle TypeScript / JavaScript"] > span.rounded-sm {
          color: var(--text-inverse) !important;
        }
      `}</style>
      {children}
    </>
  );
}
