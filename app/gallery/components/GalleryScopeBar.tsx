'use client';

import type { ReactNode } from 'react';
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
    <section className="apx-gallery-scope" aria-label="Gallery source trust and runtime">
      <ScopeGroup label="Source trust">
        <ScopeButton active={evidence === 'all'} onClick={() => onEvidenceChange('all')}>
          <CircleStackIcon /> All <small>{verifiedCount + legacyCount}</small>
        </ScopeButton>
        {verifiedCount > 0 ? (
          <ScopeButton active={evidence === 'verified'} onClick={() => onEvidenceChange('verified')}>
            <CheckBadgeIcon /> Verified <small>{verifiedCount}</small>
          </ScopeButton>
        ) : null}
        <ScopeButton active={evidence === 'legacy'} onClick={() => onEvidenceChange('legacy')}>
          <CircleStackIcon /> Curated <small>{legacyCount}</small>
        </ScopeButton>
      </ScopeGroup>

      <ScopeGroup label="Runtime">
        <ScopeButton active={runtime === 'all'} onClick={() => onRuntimeChange('all')}>
          <CircleStackIcon /> All
        </ScopeButton>
        <ScopeButton active={runtime === 'node'} onClick={() => onRuntimeChange('node')}>
          <ServerStackIcon /> Node
        </ScopeButton>
      </ScopeGroup>

      <p className="apx-gallery-scope__note">
        Verified examples include source-backed Peak Lab renders. Curated contains finished showcase films where source is intentionally not displayed.
      </p>
    </section>
  );
}

function ScopeGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="apx-gallery-scope__group">
      <legend>{label}</legend>
      <div>{children}</div>
    </fieldset>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} data-active={active || undefined}>
      {children}
    </button>
  );
}
