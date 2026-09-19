import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Studio | Apexify.js',
  description:
    'Author Apexify.js visuals with the first-party @apexify/web browser runtime, isolated full-runtime execution, reusable templates, diagnostics, assets, and run history.',
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
