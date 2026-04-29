/**
 * Remove static ESM imports (ApexPainter is injected in the sandbox).
 */
export function stripStaticImports(code: string): string {
  return code
    .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s*\{[\s\S]*?\}\s*;?/gm, '')
    .trim();
}

/**
 * Strip `require('apexify.js')` / `require('fs')` lines — ApexPainter is injected; fs is disallowed.
 */
export function stripGalleryRequires(code: string): string {
  return code
    .replace(/^\s*const\s*\{[^}]*\}\s*=\s*require\s*\(\s*['"]apexify\.js['"]\s*\)\s*;?\s*$/gm, '')
    .replace(/^\s*const\s+\w+\s*=\s*require\s*\(\s*['"]fs['"]\s*\)\s*;?\s*$/gm, '')
    .trim();
}

/**
 * Gallery snippets often end with `async function main(){...} main();` — capture the Buffer return.
 */
export function hoistAsyncMain(code: string): string {
  const t = code.trim();
  const m = t.match(/\basync\s+function\s+(\w+)\s*\(/);
  if (!m) return code;
  const name = m[1];
  const re = new RegExp(`\\b${name}\\s*\\(\\s*\\)\\s*;?\\s*$`);
  if (re.test(t)) {
    return t.replace(re, `return await ${name}();`);
  }
  return code;
}

/**
 * Remove typical file I/O from gallery snippets; runner expects a returned Buffer instead.
 */
export function stripNodeFileIo(code: string): string {
  return code
    .replace(/\bfs\s*\.\s*\w+\s*\([^)]*\)\s*;?/g, '')
    .replace(/\bawait\s+painter\.save\s*\([^)]*\)\s*;?/g, '')
    .trim();
}

/**
 * Turn common gallery endings into an explicit return so the sandbox can capture output.
 */
export function normalizeReturnValue(code: string): string {
  let c = code;

  c = c.replace(
    /fs\.writeFileSync\s*\(\s*['"][^'"]*['"]\s*,\s*canvas\.buffer\s*\)\s*;?/g,
    'return canvas.buffer;'
  );
  c = c.replace(
    /fs\.writeFileSync\s*\(\s*['"][^'"]*['"]\s*,\s*result\s*\)\s*;?/g,
    'return result;'
  );
  c = c.replace(/fs\.writeFileSync\s*\([^)]*\)\s*;?/g, '');

  // createBackground().catch(...) wrapper from some snippets
  c = c.replace(/createBackground\s*\(\s*\)\s*\.catch\s*\([^)]*\)\s*;?/g, '');
  c = c.replace(/createGradient\s*\(\s*\)\s*\.catch\s*\([^)]*\)\s*;?/g, '');
  c = c.replace(/generateShowcase\s*\(\s*\)\s*\.catch\s*\([^)]*\)\s*;?/g, '');
  c = c.replace(/createSpinningWheel\s*\(\s*\)\s*\.catch\s*\([^)]*\)\s*;?/g, '');
  c = c.replace(/createSlide\s*\(\s*\)\s*\.catch\s*\([^)]*\)\s*;?/g, '');
  c = c.replace(/applyImageEffects\s*\(\s*\)\s*\.catch\s*\([^)]*\)\s*;?/g, '');

  // Trailing `const x = await painter.toBuffer()` → return (sandbox captures async result)
  c = c.replace(
    /(?:^|\n)(\s*)const\s+\w+\s*=\s*await\s+(\w+)\.toBuffer\s*\(\s*\)\s*;?\s*$/m,
    '\n$1return await $2.toBuffer();'
  );

  return c.trim();
}

export const GALLERY_SNIPPET_FN = '__apexGallerySnippet';

/**
 * Users sometimes paste an extra `(async () => { ... })()` wrapper; unwrap so we only inject one async layer.
 */
export function unwrapOuterAsyncIIFE(code: string): string {
  const s = code.trim();
  if (!s.startsWith('(async () => {')) return code;
  if (!s.endsWith('})()')) return code;
  const openLen = '(async () => '.length;
  let i = openLen;
  if (s[i] !== '{') return code;
  let depth = 1;
  const bodyStart = i + 1;
  i++;
  while (i < s.length && depth > 0) {
    const c = s[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    i++;
  }
  if (depth !== 0) return code;
  const bodyEnd = i - 1;
  const tail = s.slice(i).trim();
  if (tail !== ')()') return code;
  return s.slice(bodyStart, bodyEnd).trim();
}

/**
 * Wrap snippet body in a single async function only (no top-level `return`).
 * Esbuild rejects top-level `return` when parsing as ESM — `return await …()` is appended after transpilation in `runSandboxed`.
 */
export function wrapGalleryAsyncSnippet(code: string): string {
  const trimmed = code.trim();
  const body = trimmed
    ? trimmed
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')
    : '';
  return [`async function ${GALLERY_SNIPPET_FN}() {`, body, `}`].join('\n');
}
