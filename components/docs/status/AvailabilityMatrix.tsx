import type { AvailabilityRow } from '@/lib/docs/future-readiness';
import { CapabilityBadge } from './DocsBadges';

export function AvailabilityMatrix({ columns, rows, label = 'Availability matrix' }: { columns: string[]; rows: AvailabilityRow[]; label?: string }) {
  return (
    <div className="apx-api-option-table-wrap" tabIndex={0} role="group" aria-label={label} data-doc10-component="AvailabilityMatrix">
      <table>
        <caption className="sr-only">{label}</caption>
        <thead><tr><th scope="col">Feature</th>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.feature}><th scope="row">{row.feature}</th>{columns.map((column) => {
          const cell = row.values[column] ?? { state: 'unknown' as const, label: 'Unknown' };
          return <td key={column} data-availability={cell.state}><span>{cell.label}</span>{cell.capability ? <><span className="sr-only"> Requires capability </span><CapabilityBadge value={cell.capability} /></> : null}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>
  );
}
