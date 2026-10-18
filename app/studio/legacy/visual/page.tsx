import type { Metadata } from 'next';
import '@/styles/studio-calm.css';
import StudioShell from '@/components/studio/StudioShell';

export const metadata: Metadata = {
  title: 'Legacy Visual Studio | Apexify.js',
  description: 'Preserved Apexify.js Visual Studio while Unified Workspace Studio is built and verified.',
  robots: { index: false, follow: true },
};

export default function LegacyVisualStudioPage() {
  return <StudioShell initialMode="visual" legacy />;
}
