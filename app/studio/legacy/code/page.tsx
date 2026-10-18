import type { Metadata } from 'next';
import '@/styles/studio-calm.css';
import StudioShell from '@/components/studio/StudioShell';

export const metadata: Metadata = {
  title: 'Legacy Code Studio | Apexify.js',
  description: 'Preserved Apexify.js Code Studio while Unified Workspace Studio is built and verified.',
  robots: { index: false, follow: true },
};

export default function LegacyCodeStudioPage() {
  return <StudioShell initialMode="code" legacy />;
}
