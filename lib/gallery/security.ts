/** Max characters accepted for gallery sandbox run (DoS guard). */
export const MAX_GALLERY_CODE_LENGTH = 200_000;

/**
 * Blocks patterns that must never run in the server sandbox, even after import stripping.
 * Apexify canvas code should not need these.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /\brequire\s*\(/,
  /\bimport\s*\(\s*['"`]/, // dynamic import()
  /\bprocess\b/,
  /\bglobalThis\b/,
  /\b__proto__\b/,
  /\beval\s*\(/,
  /\bFunction\s*\(\s*['"`]/, // new Function("code")
  /\bchild_process\b/,
  /\bnode:\s*(fs|child_process|net|http|https|tls|worker_threads|vm)\b/,
  /\bfs\/promises\b/,
  /\bworker_threads\b/,
  /\bcluster\b/,
  /\bmodule\.exports\b/,
  /\bexports\.\w+/,
  /\b__dirname\b/,
  /\b__filename\b/,
  /\bWebSocket\b/,
  /\bSharedArrayBuffer\b/,
  /\bAtomics\b/,
];

/** `fs.` after stripping may still appear in strings — block obvious fs access */
const FS_ACCESS = /\bfs\s*\.\s*\w+\s*\(/;

export function assertSafeCode(code: string): void {
  if (code.length > MAX_GALLERY_CODE_LENGTH) {
    throw new Error(`Code exceeds maximum length (${MAX_GALLERY_CODE_LENGTH} characters).`);
  }

  for (const re of FORBIDDEN_PATTERNS) {
    if (re.test(code)) {
      throw new Error(
        'Code contains disallowed patterns (e.g. require, process, dynamic import, or Node APIs). Only Apexify.js canvas APIs are allowed.'
      );
    }
  }

  if (FS_ACCESS.test(code)) {
    throw new Error('File system access (fs) is not allowed. Return a Buffer from your code instead of writing files.');
  }
}
