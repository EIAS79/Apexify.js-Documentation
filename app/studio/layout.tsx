import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Code studio | Apexify.js',
  description:
    'Edit Apexify.js snippets in the browser, inspect verified outputs, and use explicitly enabled trusted-local execution during development.',
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
