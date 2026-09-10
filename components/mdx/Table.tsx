import type { ReactNode, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';

export function Table({ children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <div className="my-6 sm:my-8 overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--apx-border-default)' }} tabIndex={0} role="group" aria-label="Documentation table"><table {...props} className="min-w-full border-collapse">{children}</table></div>;
}
export function TableHead({ children }: { children: ReactNode }) { return <thead style={{ background: 'var(--apx-surface-sunken)' }}>{children}</thead>; }
export function TableBody({ children }: { children: ReactNode }) { return <tbody style={{ background: 'var(--apx-surface-raised)' }}>{children}</tbody>; }
export function TableRow({ children }: { children: ReactNode }) { return <tr>{children}</tr>; }
export function TableHeader({ children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) { return <th {...props} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--apx-text-primary)', borderBottom: '1px solid var(--apx-border-default)' }}>{children}</th>; }
export function TableCell({ children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) { return <td {...props} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm" style={{ color: 'var(--apx-text-secondary)', borderBottom: '1px solid var(--apx-border-subtle)' }}>{children}</td>; }
