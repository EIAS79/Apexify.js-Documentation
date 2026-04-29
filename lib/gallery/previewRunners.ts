import type { GalleryPreviewId } from './constants';
import { runBackgroundPreview, type PreviewResult } from './backgroundPreviews';

export type { PreviewResult };

export async function runGalleryPreview(id: GalleryPreviewId): Promise<PreviewResult> {
  return runBackgroundPreview(id);
}
