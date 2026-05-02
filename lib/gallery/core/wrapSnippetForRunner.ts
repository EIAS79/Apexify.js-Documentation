const BLOCKLIST =
  /\bchild_process\b|\bnode:child_process\b|\bworker_threads\b|\bnode:vm\b|\beval\s*\(|\bnew\s+Function\s*\(/i;

export function assertSnippetAllowed(code: string): string | null {
  if (BLOCKLIST.test(code)) {
    return 'Snippet blocked: disallowed APIs.';
  }
  return null;
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
 * Apexify gallery snippets: `import { ApexPainter } from 'apexify.js'`, `async function main()` returning Buffer.
 * Strips trailing `return await main();` and writes PNG/GIF to `process.env.GALLERY_OUT`.
 */
export function wrapSnippetForRunner(
  code: string,
  { apexifyImportHref }: { apexifyImportHref: string }
): string {
  let body = code.replace(/^import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"]\s*;?\s*\r?\n/m, '').trim();
  body = body.replace(/\s*return\s+await\s+main\s*\(\)\s*;?\s*$/m, '').trim();

  // No top-level await: tsx/esbuild target CJS cannot transform it. Run inside an async IIFE instead.
  return `import fs from 'fs';

void (async () => {
  const __apexMod = await import(${JSON.stringify(apexifyImportHref)});
  const ApexPainter = __apexMod.ApexPainter ?? __apexMod.default?.ApexPainter ?? __apexMod.default;

${body}

  async function __run(): Promise<Buffer> {
    const buf = await main();
    if (!Buffer.isBuffer(buf)) {
      throw new Error('main() must return a Buffer');
    }
    return buf;
  }

  const __out = await __run();
  fs.writeFileSync(process.env.GALLERY_OUT!, __out);
})().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  try {
    if (process.env.GALLERY_ERR) fs.writeFileSync(process.env.GALLERY_ERR, msg);
  } catch {
    /* ignore */
  }
  console.error(msg);
  process.exit(1);
});
`;
}
