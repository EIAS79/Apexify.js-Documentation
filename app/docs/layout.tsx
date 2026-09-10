import '@/styles/docs-tokens.css';
import '@/styles/docs-shell.css';
import '@/styles/docs-prose.css';
import '@/styles/docs-components.css';
import { DocsHeader } from '@/components/docs/shell/DocsHeader';
import { LegacyDocsRedirectIsland } from '@/components/docs/shell/LegacyDocsRedirectIsland';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="apx-doc-root">
      <a className="apx-skip-link" href="#docs-content">Skip to content</a>
      <div className="apx-doc-background" aria-hidden />
      <LegacyDocsRedirectIsland />
      <DocsHeader />
      {children}
    </div>
  );
}
