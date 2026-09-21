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
  const topBar = read('components/studio/StudioTopBar.tsx');
  const modeSwitch = read('components/studio/StudioModeSwitch.tsx');

  assert.match(page, /StudioShell/);
  assert.doesNotMatch(shell, /Apexify\.js[\s\S]*Studio authoring mode/);
  assert.match(modeSwitch, /data-studio-mode-tab="code"/);
  assert.match(modeSwitch, /data-studio-mode-tab="visual"/);
  assert.match(topBar, /StudioModeSwitch/);
  assert.match(shell, /StudioSharedSessionProvider/);
  assert.match(shell, /<CodeStudio embedded/);
  assert.match(shell, /dynamic\(/);
  assert.match(code, /createApexifyWebRuntime/);
  assert.match(code, /planStudioExecution/);
  assert.match(code, /currentNodeServerExecutionAdapter/);
  assert.match(code, /useStudioSharedSession/);
});

test('phase 1 Visual Studio preserves shared shell surfaces as later phases extend the workspace', () => {
  const visual = read('components/studio/visual/VisualStudio.tsx');

  assert.match(visual, /data-studio-visual-workspace/);
  assert.match(visual, /useStudioSharedSession/);
  assert.match(visual, /StudioModeSwitch/);
  assert.match(visual, /Shared Studio assets/);
  assert.match(visual, /Generated Code/);
  assert.match(visual, /Diagnostics/);
  assert.match(visual, /History/);
  assert.match(visual, /data-visual-layer-tree/);
  assert.match(visual, /Domain-specific properties arrive in their owning phases/);
  assert.match(visual, /fileToStudioAsset/);
  assert.match(visual, /assetFilter/);
  assert.match(visual, /setLayersCollapsed/);
  assert.match(visual, /setInspectorCollapsed/);
  assert.match(visual, /setDockCollapsed/);
  assert.match(visual, /setPan/);
  assert.match(visual, /setActiveArtifactId/);
  assert.doesNotMatch(visual, /createCanvas\(|createImage\(|createText\(|createChart\(/);
});

test('phase 1 keeps Visual work branches Vercel-suppressed', () => {
  const vercel = JSON.parse(read('vercel.json')) as { ignoreCommand?: string };
  assert.match(vercel.ignoreCommand ?? '', /vercel-ignore-build/);
  const ignore = read('scripts/studio/visual/vercel-ignore-build.mjs');
  assert.match(ignore, /studio-visual\//);
});
