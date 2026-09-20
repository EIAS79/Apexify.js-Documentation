/** Shared Gallery card shape. The visual shell is retained even when the visible catalog is empty. */

export type GalleryMediaKind = 'image' | 'gif' | 'video';

export type GalleryLens =
  | 'composition'
  | 'image'
  | 'typography'
  | 'data'
  | 'motion'
  | 'surface'
  | 'advanced';

export type GalleryCodeTabs = {
  ts?: string;
  js?: string;
};

export type GalleryCodePage = {
  label: string;
  language: 'ts' | 'js';
  code: string;
};

export type GalleryMediaAsset = {
  src: string;
  label: string;
  media?: GalleryMediaKind;
};

export interface GalleryCardBase {
  id: string;
  title: string;
  description: string;
  /** Grid + modal hero — URL under `public/`. */
  thumbnail: string;
  /** How to render `thumbnail` (inferred from extension when omitted). */
  thumbnailMedia?: GalleryMediaKind;
  featured?: boolean;
  /** Explicit visual-category routing for curated Gallery catalogs. */
  lenses?: GalleryLens[];
  /** Preferred badge/filter identity when an item belongs to multiple lenses. */
  primaryLens?: GalleryLens;
  /** Read-only TypeScript / JavaScript samples */
  code?: GalleryCodeTabs;
  /** Long-form source can be split into terminal-style pages. */
  codePages?: GalleryCodePage[];
  /** A recipe may expose multiple real generated artifacts in the inspector. */
  outputs?: GalleryMediaAsset[];
  /** Optional provenance label for curated catalogs. */
  sourceKind?: 'peak-lab' | 'showcase' | 'verified-example';
  /** Peak Lab recipe number when applicable. */
  recipeId?: string;
  /** Canonical complete source when the inspector intentionally paginates/omits binary payloads. */
  sourceHref?: string;
  /**
   * Controls execution affordances for source shown in Gallery.
   * - gallery: editable + runnable in the lightweight Gallery runner
   * - studio: read-only in Gallery, but can be sent to Studio
   * - none: display/copy source only (for multi-file/project recipes)
   */
  executionMode?: 'gallery' | 'studio' | 'none';
}

/** Deck-style demos: charts, comparisons, multi-pass compose (`advance` filter in the gallery UI). */
export type AdvanceGalleryCard = GalleryCardBase & {
  category: 'advance';
  code: GalleryCodeTabs;
};
