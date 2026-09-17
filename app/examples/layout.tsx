import type { ReactNode } from 'react';
import '@/styles/docs.css';
import '@/styles/docs-components.css';
import '@/styles/docs-api.css';
import { DocsHeader } from '@/components/docs/shell/DocsHeader';

export default function ExamplesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="apx-doc-root apx-examples-root">
      <a className="apx-skip-link" href="#docs-content">Skip to content</a>
      <div className="apx-doc-background" aria-hidden />
      <DocsHeader />
      {children}
    </div>
  );
}
