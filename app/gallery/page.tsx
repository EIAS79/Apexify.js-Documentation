import type { Metadata } from 'next';
import GalleryClient from './components/GalleryClient';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Gallery | Apexify.js',
  description: 'Browse verified Apexify.js rendering examples and inspect the source behind representative outputs.',
  alternates: { canonical: absoluteSiteUrl('/gallery') },
  openGraph: {
    type: 'website',
    title: 'Apexify.js Gallery',
    description: 'Verified Apexify.js rendering examples with source and output previews.',
    url: absoluteSiteUrl('/gallery'),
  },
};

/**
 * Static import avoids `next/dynamic` async chunks in dev. On Windows those chunks are often orphaned
 * during HMR (`Cannot find module './276.js'`) even when webpack `splitChunks` is disabled.
 */
export default function GalleryPage() {
  return <GalleryClient />;
}
