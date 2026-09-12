import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import AmbientBackground from '@/components/home/AmbientBackground';
import ScrollTopButton from '@/components/home/ScrollTopButton';
import {
  CapabilitySection,
  EcosystemFooter,
  FeatureTracks,
  ProductHero,
  RoadmapSection,
  VerifiedExamples,
} from '@/components/home/ProductHome';
import { getProductExperienceModel } from '@/lib/product/catalog';

export const metadata: Metadata = {
  title: 'Apexify.js — Programmatic visuals for Node.js',
  description:
    'Apexify.js is a TypeScript-first Node/server rendering and media toolkit. Explore verified examples, the current API surface, and explicitly labelled future roadmap work.',
  alternates: { canonical: 'https://apexifyjs.vercel.app/' },
};

export default function Home() {
  const model = getProductExperienceModel();

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-lg px-4 py-2 font-semibold focus:not-sr-only"
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
      >
        Skip to content
      </a>
      <AmbientBackground />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <ProductHero model={model} />
        <CapabilitySection model={model} />
        <FeatureTracks model={model} />
        <VerifiedExamples model={model} />
        <RoadmapSection model={model} />
      </main>
      <EcosystemFooter model={model} />
      <ScrollTopButton />
    </div>
  );
}
