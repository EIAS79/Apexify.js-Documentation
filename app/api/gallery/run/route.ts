import { randomUUID } from 'crypto';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { pathToFileURL } from 'url';
import {
  assertSnippetAllowed,
  detectImageMime,
  wrapSnippetForRunner,
} from '@/lib/gallery/core/wrapSnippetForRunner';

/**
 * Side-effect import so Next.js **output file tracing** copies `apexify.js` and most
 * transitive **JavaScript** dependencies into the serverless bundle. The gallery runner
 * spawns `tsx` + `apexify` by path; without this, Vercel’s `/var/task` can miss `node_modules`
 * that aren’t reachable from static analysis. **Native optional packages** (esbuild, canvas,
 * sharp) are still listed in `next.config.js` → `outputFileTracingIncludes` for `/api/gallery/run`.
 */
import 'apexify.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_SOURCE_CHARS = 280_000;
const MAX_OUTPUT_BYTES = 25 * 1024 * 1024;

/** Sandbox on by default (production, preview, CI). Set `DISABLE_GALLERY_CODE_RUN=true` to turn off. */
function isRunnerEnabled(): boolean {
  return process.env.DISABLE_GALLERY_CODE_RUN !== 'true';
}

export async function GET() {
  return NextResponse.json({ enabled: isRunnerEnabled() });
}

export async function POST(req: NextRequest) {
  if (!isRunnerEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Gallery runner is disabled (DISABLE_GALLERY_CODE_RUN is set). Remove it to enable sandbox runs.',
      },
      { status: 503 }
    );
  }

  const secret = process.env.GALLERY_RUNNER_SECRET;
  if (secret) {
    const h = req.headers.get('x-gallery-runner-secret');
    if (h !== secret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: { code?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code : '';
  const lang = body.lang === 'js' ? 'js' : 'ts';

  if (!code.trim()) {
    return NextResponse.json({ ok: false, error: 'Empty code' }, { status: 400 });
  }
  if (code.length > MAX_SOURCE_CHARS) {
    return NextResponse.json({ ok: false, error: 'Code too large' }, { status: 400 });
  }

  const blocked = assertSnippetAllowed(code);
  if (blocked) {
    return NextResponse.json({ ok: false, error: blocked }, { status: 400 });
  }

  const projectRoot = process.cwd();

  /** CLI path — package must be shipped via `outputFileTracingIncludes` in next.config (see comment there). */
  const tsxCli = join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  if (!existsSync(tsxCli)) {
    return NextResponse.json({ ok: false, error: 'tsx CLI missing on server (add dependency `tsx`).' }, { status: 500 });
  }

  const apexifyEsm = join(projectRoot, 'node_modules', 'apexify.js', 'dist', 'esm', 'index.js');
  if (!existsSync(apexifyEsm)) {
    return NextResponse.json(
      { ok: false, error: 'apexify.js is not installed under project node_modules.' },
      { status: 500 }
    );
  }
  const apexifyImportHref = pathToFileURL(apexifyEsm).href;

  const dir = join(tmpdir(), `apexify-gallery-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'out.bin');
  const errPath = join(dir, 'err.txt');
  const entry = join(dir, lang === 'ts' ? 'snippet.ts' : 'snippet.js');

  const wrapped = wrapSnippetForRunner(code, { apexifyImportHref });
  writeFileSync(entry, wrapped, 'utf8');

  const t0 = Date.now();
  const result = spawnSync(process.execPath, [tsxCli, entry], {
    encoding: 'utf8',
    cwd: projectRoot,
    timeout: 55_000,
    maxBuffer: 20 * 1024 * 1024,
    env: {
      ...process.env,
      GALLERY_OUT: outPath,
      GALLERY_ERR: errPath,
    },
  });
  const elapsedMs = Date.now() - t0;

  try {
    if (existsSync(errPath)) {
      const errTxt = readFileSync(errPath, 'utf8').trim();
      return NextResponse.json(
        {
          ok: false,
          error: errTxt || result.stderr?.trim() || 'Runner failed',
          elapsedMs,
          exitCode: result.status ?? undefined,
        },
        { status: 422 }
      );
    }

    if (!existsSync(outPath)) {
      const stderr = result.stderr?.trim() ?? '';
      const parts = [
        stderr || null,
        stderr ? null : 'No image file was written — `main()` must finish and return a PNG or GIF Buffer.',
        typeof result.status === 'number' ? `exit ${result.status}` : null,
        result.signal ? `signal ${String(result.signal)}` : null,
      ].filter(Boolean) as string[];
      return NextResponse.json(
        {
          ok: false,
          error: parts.join(' · ') || 'No output produced',
          elapsedMs,
          exitCode: result.status ?? undefined,
          stderr: stderr || undefined,
        },
        { status: 422 }
      );
    }

    const buf = readFileSync(outPath);
    if (buf.length > MAX_OUTPUT_BYTES) {
      return NextResponse.json({ ok: false, error: 'Output too large', elapsedMs }, { status: 413 });
    }

    const mime = detectImageMime(buf);
    if (mime === 'application/octet-stream') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Output is not a PNG or GIF buffer',
          elapsedMs,
        },
        { status: 422 }
      );
    }

    const base64 = buf.toString('base64');

    return NextResponse.json({
      ok: true,
      mime,
      base64,
      elapsedMs,
      exitCode: result.status ?? 0,
    });
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
