'use client';

interface TableProps {
  children: React.ReactNode;
}

export function Table({ children }: TableProps) {
  return (
    <div className="my-6 sm:my-8 overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-slate-800/60 shadow-lg">
      <table className="min-w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gradient-to-r from-slate-800 to-slate-800/90">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="bg-slate-900/50 divide-y divide-slate-800/60">
      {children}
    </tbody>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="hover:bg-slate-800/40 transition-colors duration-150">
      {children}
    </tr>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-blue-300 uppercase tracking-wider border-b-2 border-blue-500/30">
      {children}
    </th>
  );
}

export function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">
      {children}
    </td>
  );
}


