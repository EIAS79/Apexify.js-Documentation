import { NextRequest, NextResponse } from 'next/server';
import { sourceItems } from '@/lib/gallery/motion-field/server';

/** Only published catalog source is exposed. This endpoint never executes code. */
export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const item = sourceItems.find(entry => entry.id === id);
  if (!item) return NextResponse.json({ error: 'Example not found.' }, { status: 404 });
  const pages = item.codePages?.length ? item.codePages : Object.entries(item.code ?? {})
    .filter(([, code]) => Boolean(code)).map(([language, code]) => ({ label: language === 'ts' ? 'TypeScript' : 'JavaScript', language, code }));
  return NextResponse.json({ pages, outputs: item.outputs ?? [], sourceHref: item.sourceHref ?? null,
    studio: item.executionMode === 'studio' || item.executionMode === 'gallery' },
    { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
