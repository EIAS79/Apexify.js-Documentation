'use client';

import type { ComponentType, ReactNode } from 'react';
import {
  CheckBadgeIcon,
  CircleStackIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';
import type { GalleryEvidenceFilter, GalleryRuntimeFilter } from './galleryHelpers';

export default function GalleryScopeBar({
  runtime,
  evidence,
  verifiedCount,
  legacyCount,
  onRuntimeChange,
  onEvidenceChange,
}: {
  runtime: GalleryRuntimeFilter;
  evidence: GalleryEvidenceFilter;
  verifiedCount: number;
  legacyCount: number;
  onRuntimeChange: (value: GalleryRuntimeFilter) => void;
  onEvidenceChange: (value: GalleryEvidenceFilter) => void;
}) {
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{ borderColor: 'var(--border-default)', backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 88%, transparent)' }}
      aria-label="Gallery provenance and runtime filters"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckBadgeIcon className="h-4 w-4" style={{ color: 'var(--success)' }} />
            <h2 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Know what you are looking at</h2>
          </div>
          <p className="max-w-3xl text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Verified examples</strong> are generated from DOC-5 repository-controlled source and output evidence.
            <strong> Legacy gallery</strong> items are curated product demos retained from the earlier Gallery and are not labelled as DOC-5 execution proof.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <FilterGroup label="Runtime">
            <ScopeButton active={runtime === 'all'} onClick={() => onRuntimeChange('all')} icon={CircleStackIcon}>All</ScopeButton>
            <ScopeButton active={runtime === 'node'} onClick={() => onRuntimeChange('node')} icon={ServerStackIcon}>Node</ScopeButton>
          </FilterGroup>
          <FilterGroup label="Evidence">
            <ScopeButton active={evidence === 'all'} onClick={() => onEvidenceChange('all')} icon={CircleStackIcon}>All</ScopeButton>
            <ScopeButton active={evidence === 'verified'} onClick={() => onEvidenceChange('verified')} icon={CheckBadgeIcon}>Verified {verifiedCount}</ScopeButton>
            <ScopeButton active={evidence === 'legacy'} onClick={() => onEvidenceChange('legacy')} icon={CircleStackIcon}>Legacy {legacyCount}</ScopeButton>
          </FilterGroup>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--text-tertiary)' }}>{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function ScopeButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition-colors"
      style={{
        borderColor: active ? 'color-mix(in srgb, var(--accent-iris) 45%, var(--border-default))' : 'var(--border-subtle)',
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        backgroundColor: active ? 'color-mix(in srgb, var(--accent-iris) 12%, transparent)' : 'transparent',
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
