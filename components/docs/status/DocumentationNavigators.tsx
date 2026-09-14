export interface NavigatorEntry {
  id: string;
  label: string;
  href: string | null;
  status?: string;
}

function Navigator({ label, entries, current }: { label: string; entries: NavigatorEntry[]; current?: string }) {
  return <nav aria-label={label} data-doc10-navigator={label.toLowerCase().replace(/\s+/g, '-')} className="flex flex-wrap gap-2">{entries.map((entry) => entry.href ? <a key={entry.id} href={entry.href} aria-current={entry.id === current ? 'page' : undefined} className="apx-badge"><span>{entry.label}</span>{entry.status ? <span className="sr-only"> {entry.status}</span> : null}</a> : <span key={entry.id} aria-disabled="true" className="apx-badge" data-unavailable="true">{entry.label} · unavailable</span>)}</nav>;
}

export function RuntimeNavigator(props: { entries: NavigatorEntry[]; current?: string }) {
  return <Navigator label="Runtime navigator" {...props} />;
}

export function PackageNavigator(props: { entries: NavigatorEntry[]; current?: string }) {
  return <Navigator label="Package navigator" {...props} />;
}

/** Readiness surface only: callers decide when real versions exist. */
export function VersionSelector({ entries, current, enabled = false }: { entries: NavigatorEntry[]; current?: string; enabled?: boolean }) {
  return <div data-doc10-version-selector data-enabled={enabled}><label htmlFor="doc-version-selector">Version</label><select id="doc-version-selector" value={current ?? entries[0]?.id ?? ''} disabled={!enabled} readOnly>{entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}{entry.status ? ` · ${entry.status}` : ''}</option>)}</select>{!enabled ? <p>Version switching remains inactive until multiple real versions exist.</p> : null}</div>;
}
