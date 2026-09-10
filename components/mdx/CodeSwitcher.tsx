'use client';

import { Tabs } from './DocsTabs';

interface CodeSwitcherProps {
  ts?: string;
  js?: string;
  tsLabel?: string;
  jsLabel?: string;
  children?: React.ReactNode;
  className?: string;
  docsStudio?: boolean;
}

export function CodeSwitcher({ ts, js, tsLabel = 'TypeScript', jsLabel = 'JavaScript', className = 'my-4' }: CodeSwitcherProps) {
  const items = [
    ts ? { label: tsLabel, content: ts, language: 'typescript' } : null,
    js ? { label: jsLabel, content: js, language: 'javascript' } : null,
  ].filter((item): item is { label: string; content: string; language: string } => item !== null);
  return <div className={className} data-doc3-compatibility="CodeSwitcher"><Tabs items={items} ariaLabel="Language" /></div>;
}
