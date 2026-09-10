import type { ReactNode } from 'react';
import { Callout, type CalloutTone } from './RichDocsComponents';

interface AlertProps {
  type?: 'warning' | 'info' | 'error' | 'success' | 'tip';
  title?: string;
  children: ReactNode;
}

export function Alert({ type = 'info', title, children }: AlertProps) {
  const tone: CalloutTone = type === 'error' ? 'danger' : type;
  return <Callout tone={tone} title={title}>{children}</Callout>;
}
