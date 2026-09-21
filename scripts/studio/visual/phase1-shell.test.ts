import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('phase 1 mounts a top-level dual-mode shell without replacing Code Studio', () => {
  const page = read('app/studio/page.tsx');
  const shell = read('components/studio/StudioShell.tsx');
  const code = read('components/studio/CodeStudio.tsx');

  assert.match(page, /StudioShell/);
  assert.match(shell, /data-studio-mode-tab="code"/);
  assert.match(shell, /data-studio-mode-tab="visual"/);
  assert.match(shell, /<CodeStudio embedded/);
  assert.match(shell, /dynamic\(/);
  assert.match(code, /createApexifyWebRuntime/);
  assert.match(code, /planStudioExecution/);
  assert.match(code, /currentNodeServerExecutionAdapter/);
});

test('phase 1 Visual Studio remains an empty workspace with shared shell surfaces', () => {
  const visual = read('components/studio/visual/VisualStudio.tsx');

  assert.match(visual, /data-studio-visual-workspace/);
  assert.match(visual, /Shared Studio assets/);
  assert.match(visual, /title="Output"/);
  assert.match(visual, /title="Diagnostics"/);
  assert.match(visual, /title="History"/);
  assert.match(visual, /Drawing, selection and editing are intentionally not implemented/);
  assert.doesNotMatch(visual, /createCanvas\(|createImage\(|createText\(|createChart\(/);
});

test('phase 1 keeps Visual work branches Vercel-suppressed', () => {
  const vercel = JSON.parse(read('vercel.json')) as { ignoreCommand?: string };
  assert.match(vercel.ignoreCommand ?? '', /vercel-ignore-build/);
  const ignore = read('scripts/studio/visual/vercel-ignore-build.mjs');
  assert.match(ignore, /studio-visual\//);
});
