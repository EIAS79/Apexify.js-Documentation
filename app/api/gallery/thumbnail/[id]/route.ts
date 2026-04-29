import { NextResponse } from 'next/server';
import { isGalleryPreviewId } from '@/lib/gallery/constants';
import { runGalleryPreview } from '@/lib/gallery/previewRunners';

export const runtime = 'nodejs';

/**
 * GET a PNG (or other mime) thumbnail for a whitelisted gallery item — same pixels as preview runner.
 */
export async function GET(_req: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id || !isGalleryPreviewId(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const { mime, data } = await runGalleryPreview(id);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e) {
    console.error('[gallery/thumbnail]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Thumbnail failed' },
      { status: 500 }
    );
  }
}
