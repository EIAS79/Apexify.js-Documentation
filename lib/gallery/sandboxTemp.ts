import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomBytes } from 'crypto';

/**
 * Allowed prefix under OS temp dir for gallery video encode outputs (read back server-side only).
 */
const PREFIX = 'apexify-gallery-';

function ensureUnderTmp(resolved: string): void {
  const tmp = path.resolve(os.tmpdir());
  const file = path.resolve(resolved);
  const rel = path.relative(tmp, file);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('galleryTmpPath/readGalleryTemp: path must stay under the OS temp directory.');
  }
}

/** Safe temp path for FFmpeg/Apex video output (extension without dot is ok). */
export function galleryTmpPath(ext: string): string {
  const safe = ext.replace(/^\./, '').replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const id = randomBytes(8).toString('hex');
  return path.join(os.tmpdir(), `${PREFIX}${Date.now()}-${id}.${safe}`);
}

/** Read a file written under tmpdir only (used after createVideo → disk). */
export function readGalleryTemp(absPath: string): Buffer {
  ensureUnderTmp(absPath);
  return fs.readFileSync(absPath);
}

/** Stable dummy video `source` for createVideo (must exist; ffprobe may inspect it). */
export function galleryPackageJsonPath(): string {
  return path.join(process.cwd(), 'package.json');
}
