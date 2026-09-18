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
    <section className="apx-gallery-scope" aria-label="Source trust and runtime">
      <div className="apx-gallery-scope__copy">
        <span className="apx-gallery-label">SOURCE TRUST</span>
        <p>
          <strong>Verified source</strong> points to repository-controlled executable evidence.
          <strong> Curated demo</strong> means the piece is preserved product showcase material,
          not execution proof.
        </p>
      </div>

      <div className="apx-gallery-scope__groups">
        <ScopeGroup label="Trust">
          <ScopeButton active={evidence === 'all'} onClick={() => onEvidenceChange('all')}>
            <CircleStackIcon /> All
          </ScopeButton>
          <ScopeButton active={evidence === 'verified'} onClick={() => onEvidenceChange('verified')}>
            <CheckBadgeIcon /> Verified {verifiedCount}
          </ScopeButton>
          <ScopeButton active={evidence === 'legacy'} onClick={() => onEvidenceChange('legacy')}>
            <CircleStackIcon /> Curated {legacyCount}
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
      </div>
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
