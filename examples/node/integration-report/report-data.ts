export interface ReportEntry {
  label: string;
  value: number;
  color: string;
}

export const reportEntries: ReportEntry[] = [
  { label: 'Docs', value: 80, color: '#6366f1' },
  { label: 'API', value: 60, color: '#8b5cf6' },
  { label: 'Gallery', value: 40, color: '#ec4899' },
];
