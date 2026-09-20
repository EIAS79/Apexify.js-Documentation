/** Shared gallery card shape — previews are static files under `/public/gallery-outputs/` or verified DOC-5 output paths. */

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
