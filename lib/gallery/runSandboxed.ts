import vm from 'vm';
import { randomInt as cryptoRandomInt } from 'crypto';
import { transformSync } from 'esbuild';
import { ApexPainter } from 'apexify.js';
import { assertSafeCode } from './security';
import { galleryPackageJsonPath, galleryTmpPath, readGalleryTemp } from './sandboxTemp';
import {
  GALLERY_SNIPPET_FN,
  hoistAsyncMain,
  normalizeReturnValue,
  stripGalleryRequires,
  stripNodeFileIo,
  stripStaticImports,
  unwrapOuterAsyncIIFE,
  wrapGalleryAsyncSnippet,
} from './stripForSandbox';

/** GIF signature */
function sniffMime(buf: Buffer): string {
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return 'image/gif';
  }
  // ISO BMFF (MP4 / similar)
  if (buf.length >= 12 && buf.slice(4, 8).toString('ascii') === 'ftyp') {
    return 'video/mp4';
  }
  return 'image/png';
}

export type GalleryRunMedia = { buffer: Buffer; mime: string };

function normalizeOutput(value: unknown): GalleryRunMedia {
  if (Buffer.isBuffer(value)) {
    return { buffer: value, mime: sniffMime(value) };
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.mime === 'string' && Buffer.isBuffer(o.buffer)) {
      return { buffer: o.buffer, mime: o.mime };
    }
    if (Buffer.isBuffer(o.buffer)) {
      return { buffer: o.buffer, mime: sniffMime(o.buffer) };
    }
    const inner = o.buffer as { buffer?: Buffer } | undefined;
    if (inner && Buffer.isBuffer(inner.buffer)) {
      return { buffer: inner.buffer, mime: sniffMime(inner.buffer) };
    }
  }
  throw new Error(
    'Return a PNG/GIF/MP4 Buffer, `{ mime, buffer }`, or a canvas result with a `.buffer` property.'
  );
}

function buildSandbox() {
  return {
    ApexPainter,
    Buffer,
    galleryTmpPath,
    readGalleryTemp,
    galleryPackageJsonPath,
    randomInt: (min: number, max: number) => cryptoRandomInt(min, max),
    console: {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
    },
    Math,
    JSON,
    Promise,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    ReferenceError,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Uint8Array,
    Int8Array,
    Uint16Array,
    Int16Array,
    Uint32Array,
    Int32Array,
    Float32Array,
    Float64Array,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Symbol,
    BigInt,
    encodeURIComponent,
    decodeURIComponent,
    TextEncoder,
    TextDecoder,
  };
}

/** Hard ceiling so env cannot ask for unbounded VM time (DoS). */
const SANDBOX_HARD_CAP_MS = 900_000;

/**
 * VM execution budget for user snippets (GIF/MP4 need more than quick PNG).
 * Override with `GALLERY_VM_TIMEOUT_MS` (milliseconds). Clamped to `SANDBOX_HARD_CAP_MS`.
 */
export function getGallerySandboxTimeoutMs(): number {
  const raw = process.env.GALLERY_VM_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(String(raw), 10) : NaN;
  const fallback = 180_000;
  const base = Number.isFinite(parsed) && parsed >= 1000 ? parsed : fallback;
  return Math.min(base, SANDBOX_HARD_CAP_MS);
}

/**
 * Transpile TS → JS (esbuild), strip imports/fs usage, validate, run in Node vm with only ApexPainter + safe builtins.
 */
export async function runUserGalleryCode(code: string, language: 'ts' | 'js'): Promise<GalleryRunMedia> {
  let js = stripStaticImports(code);
  js = stripGalleryRequires(js);
  js = unwrapOuterAsyncIIFE(js);
  js = normalizeReturnValue(js);
  js = stripNodeFileIo(js);
  js = hoistAsyncMain(js);
  js = wrapGalleryAsyncSnippet(js);

  if (language === 'ts') {
    const out = transformSync(js, {
      loader: 'ts',
      target: 'es2020',
    });
    js = out.code;
  }

  js = `${js.trim()}\nreturn await ${GALLERY_SNIPPET_FN}();\n`;

  assertSafeCode(js);

  const wrapped = `(async () => {\n${js}\n})()`;
  const script = new vm.Script(wrapped);
  const sandbox = buildSandbox();
  const context = vm.createContext(sandbox);
  const timeoutMs = getGallerySandboxTimeoutMs();

  let result: unknown;
  try {
    result = await script.runInContext(context, { timeout: timeoutMs });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/timed out|Script execution timed out|timeout/i.test(msg)) {
      const maxMin = SANDBOX_HARD_CAP_MS / 60_000;
      throw new Error(
        `Sandbox timed out after ${Math.round(timeoutMs / 1000)} s. Set env GALLERY_VM_TIMEOUT_MS (ms, max ${maxMin} min) on the server for heavier GIF/MP4 jobs.`
      );
    }
    throw e;
  }
  return normalizeOutput(result);
}
