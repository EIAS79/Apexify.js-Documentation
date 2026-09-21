import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('PRE-4 installs the approved permanent product shell architecture', () => {
  const entry = read('components/studio/visual/VisualStudio.tsx');
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const css = read('styles/studio-calm.css');

  assert.match(entry, /VisualStudioPre4/);
  assert.match(shell, /Apexify Studio/);
  assert.match(shell, /Design\. Visualize\. Generate\./);
  assert.match(shell, /Run/);
  assert.match(shell, /Preview/);
  assert.match(shell, /Generate Code/);
  assert.match(shell, /Export/);

  for (const label of [
    'Canvas',
    'Images',
    'Text',
    'Charts',
    'Shapes',
    'Paths',
    'Layers',
    'Components',
    'Assets',
    'GIF',
    'Audio',
    'Video',
  ]) {
    assert.match(shell, new RegExp(label));
  }

  for (const tab of ['Style', 'Transform', 'Effects', 'Data', 'Advanced']) {
    assert.match(shell, new RegExp(tab));
  }

  for (const tab of ['Generated Code', 'Diagnostics', 'History']) {
    assert.match(shell, new RegExp(tab));
  }

  assert.match(shell, /apx-pre4-topbar/);
  assert.match(shell, /apx-pre4-feature-rail/);
  assert.match(shell, /apx-pre4-layers/);
  assert.match(shell, /apx-pre4-stage/);
  assert.match(shell, /apx-pre4-inspector/);
  assert.match(shell, /apx-pre4-dock/);
  assert.match(css, /STUDIO-VISUAL-PRE-4/);
  assert.match(css, /--pre4-blue:#4c7cff/);
  assert.match(css, /grid-template-areas:[\s\S]*rail layers stage inspector/);
});

test('PRE-4 preserves Phase-3 editing and shared Studio behavior', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');

  assert.match(shell, /data-studio-visual-workspace/);
  assert.match(shell, /StudioModeSwitch/);
  assert.match(shell, /StudioArtifactPreview/);
  assert.match(shell, /StudioAssetShelf/);
  assert.match(shell, /useStudioSharedSession/);
  assert.match(shell, /VisualHistory/);
  assert.match(shell, /snapPosition/);
  assert.match(shell, /groupNodes/);
  assert.match(shell, /ungroupNodes/);
  assert.match(shell, /copyNodes/);
  assert.match(shell, /pasteNodes/);
  assert.match(shell, /alignNodes/);
  assert.match(shell, /resizeNode/);
  assert.match(shell, /rotateNode/);
  assert.match(shell, /data-visual-project-save/);
  assert.match(shell, /data-visual-project-load/);
  assert.match(shell, /data-visual-open-generated-code/);
  assert.doesNotMatch(shell, /createCanvas\(|createImage\(|createText\(|createChart\(/);
});

test('PRE-4 future feature surfaces do not pretend to be authoring-complete', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');

  assert.match(shell, /Owned by the selected feature phase/);
  assert.match(shell, /authoring controls arrive in the owning feature phase/);
  assert.match(shell, /Preview remains tied to real Apexify execution artifacts/);
  assert.match(shell, /disabled/);
});


test('PRE-4 polish keeps the shell calm and removes nonessential top-right chrome', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const css = read('styles/studio-calm.css');

  assert.doesNotMatch(shell, /className="apx-pre4-top-utility"/);
  assert.doesNotMatch(shell, /title="Notifications"/);
  assert.match(css, /PRE-4 POLISH/);
  assert.match(css, /scrollbar-color:#2a4059 transparent/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 330px/);
  assert.match(css, /background:#050b13!important/);
  assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});
