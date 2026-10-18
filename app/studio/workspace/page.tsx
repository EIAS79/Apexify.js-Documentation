import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '@/styles/studio-calm.css';
import '@/styles/workspace-studio-neon.css';
import NeonWorkspaceStudio from '@/components/studio/workspace/NeonWorkspaceStudio';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Workspace Studio Preview | Apexify.js',
  description: 'Neon Workspace Studio preview with source, actual artifact rendering and responsive panels.',
  robots: { index: false, follow: false },
};

export default function WorkspaceStudioPreviewPage() {
  // Explicit opt-in. Preview has no independent project persistence or new
  // graph backend yet, so it must never be mistaken for the production /studio.
  if (process.env.APEX_WORKSPACE_STUDIO_PREVIEW !== '1') notFound();
  return <NeonWorkspaceStudio />;
}
