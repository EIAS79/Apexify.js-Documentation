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

test('phase 1 Visual Studio shell contracts remain present as the editor evolves', () => {
  const entry = read('components/studio/visual/VisualStudio.tsx');
  const visual = entry + read('components/studio/visual/VisualStudioPhase3.tsx');

  assert.match(visual, /data-studio-visual-workspace/);
  assert.match(visual, /useStudioSharedSession/);
  assert.match(visual, /StudioModeSwitch/);
  assert.match(visual, /Assets/);
  assert.match(visual, /Output/);
  assert.match(visual, /Diagnostics/);
  assert.match(visual, /History/);
  assert.match(visual, /Visual workspace ready/);
  assert.match(visual, /data-visual-project-save/);
  assert.match(visual, /data-visual-project-load/);
  assert.match(visual, /data-visual-open-generated-code/);
  assert.match(visual, /setPan/);
  assert.doesNotMatch(visual, /createCanvas\(|createImage\(|createText\(|createChart\(/);
});

test('phase 1 deploys only main through Vercel Git integration', () => {
  const vercel = JSON.parse(read('vercel.json')) as {
    git?: { deploymentEnabled?: Record<string, boolean> };
  };
  assert.equal(vercel.git?.deploymentEnabled?.['*'], false);
  assert.equal(vercel.git?.deploymentEnabled?.main, true);
});
