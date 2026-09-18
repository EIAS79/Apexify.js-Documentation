import type { Metadata } from 'next';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeAmbientBackground from '@/components/home/HomeAmbientBackground';
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
  title: 'Apexify.js — Programmable rendering for JavaScript',
  description:
    'Apexify.js is a TypeScript-first rendering and media toolkit for images, text, charts, scenes, templates, GIF/video workflows, audio, and programmatic output on Node/server runtimes.',
  alternates: { canonical: 'https://apexifyjs.vercel.app/' },
};

export default function Home() {
  const model = getProductExperienceModel();

  return (
    <div className="apx-home-root relative min-h-screen overflow-x-hidden">
      <a href="#main-content" className="apx-home-skip">Skip to content</a>
      <HomeAmbientBackground />
      <HomeNavbar />
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
