import type { Metadata } from 'next';
import '@/styles/doc7-product-accessibility.css';

export const metadata: Metadata = {
  title: 'Gallery | Apexify.js',
  description:
    'Interactive Apexify.js canvas examples — layered backgrounds, gradients, noise, blend modes, and pattern fills.',
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
