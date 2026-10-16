import fs from 'node:fs';
import path from 'node:path';

/** Expand the ordered stylesheet entry point for source-contract tests. */
export function readStudioCss(): string {
  const entry = fs.readFileSync(path.join(process.cwd(), 'styles/studio-calm.css'), 'utf8');
  const matches = [...entry.matchAll(/^@import '\.\/studio-calm\/([a-z0-9-]+\.css)';$/gm)];
  if (!matches.length || entry.trim().split(/\r?\n/).length !== matches.length) {
    throw new Error('Expected an ordered manifest of local Studio CSS imports.');
  }
  const names = matches.map((match) => match[1]!);
  if (new Set(names).size !== names.length) throw new Error('Duplicate Studio CSS import.');
  return names.map((name) => fs.readFileSync(path.join(process.cwd(), 'styles/studio-calm', name), 'utf8')).join('');
}
