/** Shared gallery card shape — previews are static files under `/public/gallery-outputs/`. */

export type GalleryMediaKind = 'image' | 'gif' | 'video';

export type GalleryCodeTabs = {
  ts?: string;
  js?: string;
};

export interface GalleryCardBase {
  id: string;
  title: string;
  description: string;
  /** Grid + modal hero — URL under `public/` e.g. `/gallery-outputs/...` */
  thumbnail: string;
  /** How to render `thumbnail` (inferred from extension when omitted). */
  thumbnailMedia?: GalleryMediaKind;
  featured?: boolean;
  /** Read-only TypeScript / JavaScript samples */
  code?: GalleryCodeTabs;
}

/** Deck-style demos: charts, comparisons, multi-pass compose (`advance` filter in the gallery UI). */
export type AdvanceGalleryCard = GalleryCardBase & {
  category: 'advance';
  code: { ts: string; js: string };
};
