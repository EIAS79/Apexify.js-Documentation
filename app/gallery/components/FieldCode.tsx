'use client';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
export default function FieldCode({ code, language }: { code: string; language: string }) {
  return <div className="field-code-scroll" tabIndex={0} aria-label="Scrollable source code"><SyntaxHighlighter language={language === 'ts' ? 'typescript' : 'javascript'} style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, background: '#131611', fontSize: 13, lineHeight: 1.85, padding: '20px 16px' }} lineNumberStyle={{ color: '#747c6b', minWidth: '3em', paddingRight: '1.4em' }}>{code}</SyntaxHighlighter></div>;
}
