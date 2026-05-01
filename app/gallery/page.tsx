import dynamic from 'next/dynamic';

/** Client-only — keeps the gallery bundle out of the server graph in dev. */
const GalleryClient = dynamic(() => import('./GalleryClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-gray-400">
      <div className="h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p>Loading gallery…</p>
    </div>
  ),
});

export default function GalleryPage() {
  return <GalleryClient />;
}
