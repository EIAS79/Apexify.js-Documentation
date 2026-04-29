import { NextResponse } from 'next/server';
import { formatGalleryRunError } from '@/lib/gallery/runErrors';
import { getGallerySandboxTimeoutMs, runUserGalleryCode } from '@/lib/gallery/runSandboxed';
import { MAX_GALLERY_CODE_LENGTH } from '@/lib/gallery/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RunBody = { code?: unknown; language?: unknown };

function jsonRun(payload: Record<string, unknown>, status: number) {
  return NextResponse.json(payload, { status });
}

/**
 * Runs user-edited gallery code in a locked-down vm sandbox (ApexPainter + safe builtins only).
 */
export async function POST(req: Request) {
  const wallStarted = Date.now();
  const elapsed = () => Date.now() - wallStarted;

  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return jsonRun({ error: 'Invalid JSON body.', durationMs: elapsed(), sandboxTimeoutMs: getGallerySandboxTimeoutMs() }, 400);
  }

  const code = typeof body?.code === 'string' ? body.code : '';
  const language = body?.language === 'ts' ? 'ts' : 'js';

  if (!code.trim()) {
    return jsonRun({ error: 'No code provided.', durationMs: elapsed(), sandboxTimeoutMs: getGallerySandboxTimeoutMs() }, 400);
  }
  if (code.length > MAX_GALLERY_CODE_LENGTH) {
    return jsonRun({ error: 'Code too long.', durationMs: elapsed(), sandboxTimeoutMs: getGallerySandboxTimeoutMs() }, 400);
  }

  try {
    const { buffer, mime } = await runUserGalleryCode(code, language);
    return jsonRun(
      {
        mime,
        data: buffer.toString('base64'),
        durationMs: elapsed(),
        sandboxTimeoutMs: getGallerySandboxTimeoutMs(),
      },
      200
    );
  } catch (e) {
    const message = formatGalleryRunError(e);
    if (process.env.NODE_ENV === 'development') {
      console.warn('[gallery/run]', message);
    }
    return jsonRun(
      {
        error: message,
        durationMs: elapsed(),
        sandboxTimeoutMs: getGallerySandboxTimeoutMs(),
      },
      400
    );
  }
}
