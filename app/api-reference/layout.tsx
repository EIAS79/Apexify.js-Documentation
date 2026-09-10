import '@/styles/docs-tokens.css';
import '@/styles/docs-shell.css';
import '@/styles/docs-prose.css';
import '@/styles/docs-components.css';
import '@/styles/docs-api.css';
import { DocsHeader } from '@/components/docs/shell/DocsHeader';

export default function ApiReferenceLayout({children}:{children:React.ReactNode}){
  return <div className="apx-doc-root apx-api-root">
    <a className="apx-skip-link" href="#docs-content">Skip to content</a>
    <div className="apx-doc-background" aria-hidden />
    <DocsHeader />
    {children}
  </div>;
}
