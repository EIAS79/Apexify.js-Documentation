import type { Metadata } from 'next';
import FrameHome from '@/components/home/FrameHome';
import { getProductExperienceModel } from '@/lib/product/catalog';

export const metadata: Metadata = {
  title: 'Apexify.js — Every frame. Yours to create.',
  description: 'Turn code into images, typography, charts, scenes and media. Explore the TypeScript-first Node rendering toolkit, visual Studio and generated showcases.',
  alternates: { canonical: 'https://apexifyjs.vercel.app/' },
};

export default function Home() {
  const { package: packageInfo, capabilities, roadmap, heroExample } = getProductExperienceModel();
  return <FrameHome model={{ package: packageInfo, capabilities, roadmap, heroExample }} />;
}
