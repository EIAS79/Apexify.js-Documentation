import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Studio | Apexify.js',
  description:
    'Author Apexify.js visuals with a live browser canvas preview, reusable templates, diagnostics, run history, and optional trusted-local Node execution.',
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
