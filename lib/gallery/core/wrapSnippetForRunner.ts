const BLOCKLIST =
  /\bchild_process\b|\bnode:child_process\b|\bworker_threads\b|\bnode:vm\b|\beval\s*\(|\bnew\s+Function\s*\(/i;

export function assertSnippetAllowed(code: string): string | null {
  if (BLOCKLIST.test(code)) {
    return 'Snippet blocked: disallowed APIs.';
  }
  return null;
}

/** Strip comments so docs/examples mentioning `createVideo` do not false-positive. */
function stripCommentsForScan(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

const STUDIO_VIDEO_CHECKS: Array<{ re: RegExp; label: string }> = [
  { re: /\bcreateVideo\s*\(/, label: 'createVideo()' },
  { re: /\brenderSceneToVideoFrames\s*\(/, label: 'renderSceneToVideoFrames()' },
  { re: /\brenderSceneToVideo\b/, label: 'renderSceneToVideo' },
  { re: /\bvideoPipeline\s*\(/, label: 'videoPipeline()' },
  { re: /\bpainter\.video\b/, label: 'painter.video (FFmpeg router)' },
  { re: /\bgetVideoInfo\s*\(/, label: 'getVideoInfo()' },
  { re: /\bcreateFromFrames\s*\(/, label: 'createFromFrames()' },
  { re: /\bextractFrames?\s*\(/i, label: 'extractFrame(s)()' },
  { re: /\bmixAudio\s*\(/, label: 'mixAudio()' },
  { re: /\bnormalizeAudio\s*\(/, label: 'normalizeAudio()' },
  { re: /\bffprobe\b|\bffmpeg\b/i, label: 'FFmpeg / ffprobe' },
];

/**
 * Studio sandbox only accepts PNG/GIF buffers — video APIs need local FFmpeg.
 * Returns detected API names when the snippet should not run in Studio.
 */
export function detectStudioVideoUsage(code: string): string[] | null {
  const scanned = stripCommentsForScan(code);
  const detected: string[] = [];
  for (const { re, label } of STUDIO_VIDEO_CHECKS) {
    if (re.test(scanned)) detected.push(label);
  }
  return detected.length > 0 ? [...new Set(detected)] : null;
}

export function studioVideoBlockedMessage(detected: string[]): string {
  const list = detected.map((d) => `  • ${d}`).join('\n');
  return [
    'Video encoding is not available in Studio.',
    '',
    'Why:',
    '  Studio runs your snippet in a server sandbox. main() must return a PNG or GIF Buffer.',
    '  Apexify video APIs rely on FFmpeg/ffprobe on the host — that',
    '  toolchain is not installed in the Studio runner (and is unreliable on serverless).',
    '',
    'Detected in your code:',
    list,
    '',
    'What works in Studio:',
    '  • createCanvas, createImage, createText, renderScene, createGIF → Buffer output',
    '',
    'For MP4, videoPipeline, or renderSceneToVideoFrames:',
    '  • Run the same script with Node on your machine (FFmpeg on PATH)',
    '  • Or open pre-built video demos in the Gallery',
  ].join('\n');
}

export function detectImageMime(buf: Buffer): string {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png';
  }
  const sig = buf.subarray(0, 6).toString('ascii');
  if (sig === 'GIF87a' || sig === 'GIF89a') {
    return 'image/gif';
  }
  return 'application/octet-stream';
}

/**
 * Gallery snippets often include `import fs from 'fs'`, `import path from 'path'`, etc.
 * Those must stay at **module top level**. Previously they were injected inside the async IIFE,
 * which is invalid ESM and breaks esbuild/tsx (`Unexpected "fs"`).
 */
function hoistLeadingImports(src: string): { hoisted: string; rest: string } {
  let rest = src.trimStart();
  const blocks: string[] = [];
  const oneImport = /^import\s[\s\S]*?;\s*/;
  while (rest.length > 0) {
    const m = rest.match(oneImport);
    if (!m) break;
    blocks.push(m[0].trim());
    rest = rest.slice(m[0].length).trimStart();
  }
  return { hoisted: blocks.join('\n'), rest };
}

/**
 * Apexify gallery snippets: `import { ApexPainter } from 'apexify.js'`, `async function main()` returning Buffer.
 * Strips trailing `return await main();` and writes PNG/GIF to `process.env.GALLERY_OUT`.
 */
export function wrapSnippetForRunner(
  code: string,
  { apexifyImportHref }: { apexifyImportHref: string }
): string {
  let body = code
    .replace(/^import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"]\s*;?\s*\r?\n/m, '')
    /** Same as ESM strip — runner injects `ApexPainter`; duplicate binding breaks JS/CJS pastes. */
    .replace(/^const\s*\{\s*ApexPainter\s*\}\s*=\s*require\s*\(\s*['"]apexify\.js['"]\s*\)\s*;?\s*\r?\n/m, '')
    .replace(/^const\s+ApexPainter\s*=\s*require\s*\(\s*['"]apexify\.js['"]\s*\)\s*\.(?:default|ApexPainter)\s*;?\s*\r?\n/m, '')
    .trim();
  body = body.replace(/\s*return\s+await\s+main\s*\(\)\s*;?\s*$/m, '').trim();

  const { hoisted, rest: inner } = hoistLeadingImports(body);
  const hoistedBlock = hoisted ? `${hoisted}\n\n` : '';

  // Named import avoids clashing with user `import fs from 'fs'`. No top-level await: run inside an async IIFE.
  // Register DejaVu under common sans-serif names so charts/text render on Linux serverless (no Arial/Segoe).
  return `import { writeFileSync as __galleryWrite } from 'fs';
import * as __galleryPath from 'node:path';
import { GlobalFonts as __galleryGlobalFonts } from '@napi-rs/canvas';

${hoistedBlock}function __galleryRegisterFonts(): void {
  try {
    const ttf = __galleryPath.join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf', 'DejaVuSans.ttf');
    const families = [
      'DejaVu Sans',
      'Arial',
      'Helvetica',
      'sans-serif',
      'Segoe UI',
      'system-ui',
      'ui-sans-serif',
      'Verdana',
      'Tahoma',
    ];
    for (const family of families) {
      try {
        __galleryGlobalFonts.registerFromPath(ttf, family);
      } catch {
        /* ignore duplicate / platform quirks */
      }
    }
  } catch {
    /* package missing — dev without optional deps */
  }
}

void (async () => {
  __galleryRegisterFonts();
  const __apexMod = await import(${JSON.stringify(apexifyImportHref)});
  const ApexPainter = __apexMod.ApexPainter ?? __apexMod.default?.ApexPainter ?? __apexMod.default;

${inner}

  async function __run(): Promise<Buffer> {
    const buf = await main();
    if (!Buffer.isBuffer(buf)) {
      throw new Error('main() must return a Buffer');
    }
    return buf;
  }

  const __out = await __run();
  __galleryWrite(process.env.GALLERY_OUT!, __out);
})().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  try {
    if (process.env.GALLERY_ERR) __galleryWrite(process.env.GALLERY_ERR, msg);
  } catch {
    /* ignore */
  }
  console.error(msg);
  process.exit(1);
});
`;
}
