import type { ReactNode } from 'react';
import { Details } from './RichDocsComponents';

interface DropdownProps { title: string; children: ReactNode; defaultOpen?: boolean }
export function Dropdown({ title, children, defaultOpen = false }: DropdownProps) {
  return <Details summary={title} open={defaultOpen}>{children}</Details>;
}
