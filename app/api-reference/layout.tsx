import '@/styles/docs.css';
import '@/styles/docs-components.css';
import '@/styles/docs-api.css';
import '@/styles/docs-api-frame.css';
import { DocsFrame } from '@/components/docs/shell/DocsFrame';
import { DocsHeader } from '@/components/docs/shell/DocsHeader';

export default function ApiReferenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="apx-api-root">
      <DocsFrame>
        <a className="apx-skip-link" href="#docs-content">Skip to content</a>
        <div className="apx-doc-background" aria-hidden />
        <DocsHeader active="API" />
        {children}
      </DocsFrame>
    </div>
  );
}
