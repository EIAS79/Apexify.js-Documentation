import GalleryClient from './components/GalleryClient';

/**
 * Static import avoids `next/dynamic` async chunks in dev. On Windows those chunks are often orphaned
 * during HMR (`Cannot find module './276.js'`) even when webpack `splitChunks` is disabled.
 */
export default function GalleryPage() {
  return <GalleryClient />;
}
