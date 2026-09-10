import { createHash } from 'node:crypto';

export function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function stableSourceHash(files: Array<{ path: string; content: string }>): string {
  const hash = createHash('sha256');
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(file.path.replace(/\\/g, '/'));
    hash.update('\0');
    hash.update(file.content.replace(/\r\n/g, '\n'));
    hash.update('\0');
  }
  return hash.digest('hex');
}
