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

/** Readiness surface only: this remains deliberately disabled until multiple real versions exist. */
export function VersionSelector({ entries, current }: { entries: NavigatorEntry[]; current?: string; enabled?: false }) {
  return <div data-doc10-version-selector data-enabled="false"><label htmlFor="doc-version-selector">Version</label><select id="doc-version-selector" defaultValue={current ?? entries[0]?.id ?? ''} disabled>{entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}{entry.status ? ` · ${entry.status}` : ''}</option>)}</select><p>Version switching remains inactive until multiple real versions exist.</p></div>;
}
