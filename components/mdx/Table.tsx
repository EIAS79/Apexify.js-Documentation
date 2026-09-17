import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';

export function Table({ children, className = '', ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div
      className="apx-doc-table-wrap my-6 sm:my-8"
      tabIndex={0}
      role="region"
      aria-label="Scrollable documentation table"
      data-doc3-component="Table"
    >
      <table {...props} className={`apx-doc-table ${className}`.trim()}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className="apx-doc-table__head">{children}</thead>;
}

export function TableBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} className="apx-doc-table__body">{children}</tbody>;
}

export function TableRow({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props}>{children}</tr>;
}

export function TableHeader({ children, className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th {...props} className={`apx-doc-table__header ${className}`.trim()}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={`apx-doc-table__cell ${className}`.trim()}>
      {children}
    </td>
  );
}

export type DocumentationTableProps = {
  children: ReactNode;
};
