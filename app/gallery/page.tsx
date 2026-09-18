import type { Metadata } from 'next';
import '@/styles/gallery-calm.css';
import GalleryClient from './components/GalleryClient';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Gallery | Apexify.js',
  description: 'Browse Apexify.js visual output across composition, image, typography, data, motion, surface, and advanced rendering studies.',
  alternates: { canonical: absoluteSiteUrl('/gallery') },
  openGraph: {
    type: 'website',
    title: 'Apexify.js Gallery',
    description: 'A curated Apexify.js output library with visual lenses, source trust, code, and previews.',
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
