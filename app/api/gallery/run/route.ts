import { randomUUID } from 'crypto';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { pathToFileURL } from 'url';
import 'apexify.js';
import { galleryRunnerNodePath } from '@/lib/gallery/core/runnerNodePath';
import { assertSnippetAllowed, detectImageMime, detectStudioVideoUsage, studioVideoBlockedMessage, wrapSnippetForRunner } from '@/lib/gallery/core/wrapSnippetForRunner';
import { DOC8_RESOURCE_LIMITS } from '@/lib/docs/playground/contracts';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * DOC-8 security boundary: the historical route accepted arbitrary public source while
 * inheriting the deployment environment and therefore was not a defensible sandbox.
 * Public/deployed arbitrary execution is now disabled. A developer may explicitly opt in
 * on a non-production local process; that mode is trusted-local tooling, not isolation.
 */
function isRunnerEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_LOCAL_APEXIFY_CODE_RUN === 'true';
}

export async function GET() {
  return NextResponse.json({ enabled: isRunnerEnabled(), mode: isRunnerEnabled() ? 'trusted-local' : 'unavailable' });
}

export async function POST(req: NextRequest) {
  if (!isRunnerEnabled()) {
    return NextResponse.json({ ok: false, error: 'Interactive code execution is unavailable on this deployment. Current docs use DOC-5 verified output instead.' }, { status: 503 });
  }

  let body: { code?: string; lang?: string; context?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }); }
  const code = typeof body.code === 'string' ? body.code : '';
  const context = body.context === 'studio' ? 'studio' : 'gallery';
  if (!code.trim()) return NextResponse.json({ ok: false, error: 'Empty code' }, { status: 400 });
  if (code.length > DOC8_RESOURCE_LIMITS.sourceChars) return NextResponse.json({ ok: false, error: 'Source exceeds the DOC-8 limit.' }, { status: 413 });
  const blocked = assertSnippetAllowed(code);
  if (blocked) return NextResponse.json({ ok: false, error: blocked }, { status: 400 });
  if (context === 'studio') {
    const videoApis = detectStudioVideoUsage(code);
    if (videoApis) {
      const error = studioVideoBlockedMessage(videoApis);
      return NextResponse.json({ ok: false, error, stderr: error, elapsedMs: 0, exitCode: 1 }, { status: 422 });
    }
  }

  const projectRoot = process.cwd();
  const tsxCli = join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const apexifyEsm = join(projectRoot, 'node_modules', 'apexify.js', 'dist', 'esm', 'index.js');
  if (!existsSync(tsxCli) || !existsSync(apexifyEsm)) return NextResponse.json({ ok: false, error: 'Local runner dependencies are unavailable.' }, { status: 500 });

  const dir = join(tmpdir(), `apexify-local-run-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'out.bin');
  const errPath = join(dir, 'err.txt');
  const entry = join(dir, 'snippet.ts');
  writeFileSync(entry, wrapSnippetForRunner(code, { apexifyImportHref: pathToFileURL(apexifyEsm).href }), 'utf8');

  const t0 = Date.now();
  try {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      NODE_PATH: galleryRunnerNodePath(projectRoot),
      GALLERY_OUT: outPath,
      GALLERY_ERR: errPath,
    };
    if (process.env.PATH) env.PATH = process.env.PATH;
    if (process.platform === 'win32' && process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
    const result = spawnSync(process.execPath, [tsxCli, entry], {
      encoding: 'utf8', cwd: dir, timeout: DOC8_RESOURCE_LIMITS.executionMs,
      maxBuffer: DOC8_RESOURCE_LIMITS.processBufferBytes, env,
    });
    const elapsedMs = Date.now() - t0;
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message, elapsedMs }, { status: result.error.name === 'ETIMEDOUT' ? 408 : 422 });
    if (existsSync(errPath)) {
      const errTxt = readFileSync(errPath, 'utf8').trim();
      const stderr = result.stderr?.trim() ?? '';
      return NextResponse.json({ ok: false, error: errTxt || stderr || 'Runner failed', stderr: stderr || undefined, elapsedMs, exitCode: result.status ?? undefined }, { status: 422 });
    }
    if (!existsSync(outPath)) {
      const stderr = result.stderr?.trim() ?? '';
      return NextResponse.json({ ok: false, error: stderr || 'No output produced. main() must return a PNG or GIF Buffer.', stderr: stderr || undefined, elapsedMs, exitCode: result.status ?? undefined }, { status: 422 });
    }
    const buf = readFileSync(outPath);
    if (buf.length > DOC8_RESOURCE_LIMITS.outputBytes) return NextResponse.json({ ok: false, error: 'Output exceeds the DOC-8 limit.', elapsedMs }, { status: 413 });
    const mime = detectImageMime(buf);
    if (mime === 'application/octet-stream') return NextResponse.json({ ok: false, error: 'Output is not a PNG or GIF buffer', elapsedMs }, { status: 422 });
    return NextResponse.json({ ok: true, mime, base64: buf.toString('base64'), elapsedMs, exitCode: result.status ?? 0 });
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort temp cleanup */ }
  }
}
