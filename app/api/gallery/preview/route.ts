import { NextResponse } from 'next/server';
import { isGalleryPreviewId } from '@/lib/gallery/constants';
import { runGalleryPreview } from '@/lib/gallery/previewRunners';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Whitelist-only server preview for gallery items (never executes client-supplied code).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = typeof body?.itemId === 'string' ? body.itemId : '';
    if (!id || !isGalleryPreviewId(id)) {
      return NextResponse.json({ error: 'Unsupported item' }, { status: 400 });
    }
    const { mime, data } = await runGalleryPreview(id);
    const base64 = data.toString('base64');
    return NextResponse.json({ mime, data: base64 });
  } catch (e) {
    console.error('[gallery/preview]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Preview failed' },
      { status: 500 }
    );
  }
}
