import type { Metadata } from 'next';
import '@/styles/studio-calm.css';
import CodeStudio from '@/components/studio/CodeStudio';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Studio | Apexify.js',
  description: 'Explore the Apexify.js Studio interactive authoring surface and run supported verified examples in a controlled environment.',
  alternates: { canonical: absoluteSiteUrl('/studio') },
  openGraph: {
    type: 'website',
    title: 'Apexify.js Studio',
    description: 'Interactive Apexify.js authoring and verified example execution.',
    url: absoluteSiteUrl('/studio'),
  },
};

export default function StudioPage() {
  return (
    <>
      <h1 className="sr-only">Apexify.js Studio</h1>
      <CodeStudio />
    </>
  );
}
