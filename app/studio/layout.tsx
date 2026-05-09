import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Code studio | Apexify.js',
  description:
    'Try Apexify.js in the browser with a live editor and server-side preview — same sandbox as the gallery.',
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
