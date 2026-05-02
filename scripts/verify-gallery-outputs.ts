/**
 * Ensures every thumbnail URL under `lib/gallery` (see galleryTypes and card modules)
 * has a matching file in `public/gallery-outputs/`.
 * Run after `npm run gallery:build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const CWD = process.cwd();
const LIB_GALLERY = join(CWD, 'lib', 'gallery');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walkTsFiles(p));
    else if (name.isFile() && name.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

function collectExpectedPaths(): string[] {
  const set = new Set<string>();
  for (const file of walkTsFiles(LIB_GALLERY)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/thumbnail:\s*['"](\/gallery-outputs\/[^'"]+)['"]/g)) {
      set.add(m[1] as string);
    }
  }
  return [...set].sort();
}

function publicPathFromThumbnail(urlPath: string): string {
  const rel = urlPath.replace(/^\/+/, '');
  return join(CWD, 'public', rel);
}

function main(): void {
  const expected = collectExpectedPaths();
  const missing: string[] = [];
  const bad: string[] = [];

  for (const thumb of expected) {
    const abs = publicPathFromThumbnail(thumb);
    if (!existsSync(abs)) {
      missing.push(thumb);
      continue;
    }
    const st = statSync(abs);
    if (st.size === 0) bad.push(`${thumb} (empty file)`);
  }

  if (missing.length || bad.length) {
    console.error('\n[gallery verify] Missing or invalid preview files:\n');
    for (const x of missing) console.error(`  MISSING  ${x}`);
    for (const x of bad) console.error(`  INVALID  ${x}`);
    console.error(`\nExpected ${expected.length} thumbnails; ${missing.length} missing, ${bad.length} empty.\n`);
    process.exit(1);
  }

  console.log(`[gallery verify] OK — ${expected.length} thumbnails under public/gallery-outputs`);
}

main();
