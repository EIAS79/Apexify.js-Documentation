import type { DocumentationPage } from '@/lib/docs/schema';

export function StabilityBadge({ value }: { value: DocumentationPage['stability'] }) {
  return <span className="apx-badge" data-status={value}>{value}</span>;
}

export function RuntimeBadge({ value }: { value: DocumentationPage['runtime'][number] }) {
  return <span className="apx-badge" data-kind="runtime">Runtime: {value}</span>;
}

export function PackageBadge({ value }: { value: DocumentationPage['package'] }) {
  return <span className="apx-badge" data-kind="package">{value}</span>;
}

export function SinceBadge({ value }: { value: string }) {
  return <span className="apx-badge" data-kind="since">Since {value}</span>;
}
