import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('PRE-4 installs the approved permanent product shell architecture', () => {
  const entry = read('components/studio/visual/VisualStudio.tsx');
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const modals = read('components/studio/visual/VisualStudioModals.tsx');
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

  for (const tab of ['Code', 'Diagnostics', 'History']) {
    assert.match(shell, new RegExp(tab));
  }
  assert.match(modals, /Generated Code/);
  assert.match(modals, /Canvas Preview/);

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


test('PRE-4 groups the Visual Studio feature rail into clear authoring families', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const css = read('styles/studio-calm.css');

  for (const label of ['Create', 'Structure', 'Motion & media', 'System']) {
    assert.match(shell, new RegExp(label));
  }

  assert.match(shell, /data-feature-group=\{group\.id\}/);
  assert.match(shell, /apx-pre4-feature-group-tools/);
  assert.match(shell, /apx-pre4-feature-label/);
  assert.match(shell, /Visual Studio workspace/);
  assert.match(css, /STUDIO LEFT RAIL NAVIGATION REFRESH/);
  assert.match(css, /--pre4-rail-size:176px/);
  assert.match(css, /apx-pre4-feature-group-title/);
  assert.match(css, /button\[data-feature-tool="canvas"\]/);
  assert.match(css, /button\[data-feature-tool="advanced"\]/);
});


test('PRE-4 keeps the Layers collapse control anchored to the panel seam', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const css = read('styles/studio-calm.css');

  assert.match(shell, /apx-pre4-layers-dock-toggle/);
  assert.match(shell, /data-phase17-layers-toggle/);
  assert.match(shell, /aria-controls="apx-pre4-layers-panel"/);
  assert.match(shell, /ChevronLeftIcon/);
  assert.match(shell, /ChevronRightIcon/);
  assert.doesNotMatch(shell, />Layers ›<\/button>/);
  assert.match(css, /STUDIO LAYERS DOCK HANDLE/);
  assert.match(css, /top:calc\(\(100% - var\(--pre4-dock-size\)\)\/2\)/);
  assert.match(css, /left:calc\(var\(--pre4-rail-size\) \+ var\(--pre4-layers-size,258px\)\)/);
  assert.match(css, /data-phase17-layers-collapsed="true".*apx-pre4-layers-dock-toggle/s);
});


test('PRE-4 mirrors the Inspector seam toggle and exposes one Assets workspace', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const css = read('styles/studio-calm.css');

  assert.match(shell, /apx-pre4-inspector-dock-toggle/);
  assert.match(shell, /data-phase17-inspector-toggle/);
  assert.match(shell, /data-phase17-collapse-inspector=\{!inspectorCollapsed/);
  assert.match(shell, /data-phase17-show-inspector=\{inspectorCollapsed/);
  assert.match(shell, /aria-controls="apx-pre4-inspector-panel"/);
  assert.doesNotMatch(shell, /className="apx-phase17-inspector-collapse"/);
  assert.doesNotMatch(shell, />‹ Inspector<\/button>/);

  const dockTabs = shell.match(/const dockTabs = \[([\s\S]*?)\] as const;/)?.[1] ?? '';
  assert.doesNotMatch(dockTabs, /'assets'/);
  assert.doesNotMatch(shell, /StudioAssetShelf/);
  assert.match(shell, /data-unified-assets-pane/);
  assert.match(shell, /addStudioAssetFiles/);
  assert.match(shell, /copyStudioAssetReference/);
  assert.match(shell, /removeStudioAsset/);
  assert.match(shell, /accept="image\/\*,audio\/\*,video\/\*,\.ttf,\.otf,\.woff,\.woff2"/);

  assert.match(css, /INSPECTOR SEAM TOGGLE \+ UNIFIED ASSETS WORKSPACE/);
  assert.match(css, /apx-pre4-inspector-dock-toggle/);
  assert.match(css, /apx-pre4-asset-card/);
});



test('PRE-4 exposes whole-session autosave and visible canvas undo redo controls', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const shared = read('components/studio/StudioSharedSession.tsx');
  const codeStudio = read('components/studio/CodeStudio.tsx');
  const studioShell = read('components/studio/StudioShell.tsx');
  const css = read('styles/studio-calm.css');

  assert.match(shell, /data-visual-undo/);
  assert.match(shell, /data-visual-redo/);
  assert.match(shell, /history\.current\.canUndo/);
  assert.match(shell, /history\.current\.canRedo/);
  assert.match(shell, /ArrowUturnLeftIcon/);
  assert.match(shell, /ArrowUturnRightIcon/);
  assert.match(shell, /Autosaving…/);
  assert.match(shell, /Autosave failed/);
  assert.match(shell, /lastAutosavedAt/);
  assert.match(shell, /persistPhase17Snapshot/);
  assert.match(shell, /PHASE17_PROJECT_AUTOSAVE_MS/);
  assert.match(shell, /beforeunload/);

  assert.match(shared, /loadPersistedStudioAssets/);
  assert.match(shared, /savePersistedStudioAssets/);
  assert.doesNotMatch(codeStudio, /loadPersistedStudioAssets/);
  assert.doesNotMatch(codeStudio, /savePersistedStudioAssets/);
  assert.match(codeStudio, /savePersistedStudio/);
  assert.match(studioShell, /MODE_STORAGE_KEY/);
  assert.match(studioShell, /localStorage\.setItem\(MODE_STORAGE_KEY/);

  assert.match(css, /STUDIO SESSION AUTOSAVE \+ CANVAS HISTORY CONTROLS/);
  assert.match(css, /apx-pre4-history-tools/);
  assert.match(css, /data-state="saving"/);
});

test('PRE-4 provides an undoable full-canvas reset and retries recoverable live code', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const css = read('styles/studio-calm.css');

  assert.match(shell, /data-visual-reset-canvas/);
  assert.match(shell, /Reset entire canvas/);
  assert.match(shell, /mutate\('Reset canvas'/);
  assert.match(shell, /createVisualProject\(\{/);
  assert.match(shell, /Undo restores the previous canvas/);
  assert.match(shell, /reconcileVisualProjectFromCode\(\s*recoveredProject/);
  assert.match(shell, /live code reconciled/);
  assert.match(css, /apx-pre4-reset-canvas/);
});


test('PRE-4 preserves Phase-3 editing and shared Studio behavior', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');

  assert.match(shell, /data-studio-visual-workspace/);
  assert.match(shell, /StudioModeSwitch/);
  assert.match(shell, /data-unified-assets-pane/);
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
  assert.match(shell, /InteractiveCodeEditor/);
  assert.match(shell, /reconcileVisualProjectFromCode/);
  assert.match(shell, /data-visual-preview-modal-trigger/);
  assert.doesNotMatch(shell, /new\s+ApexPainter\s*\(/);
  assert.doesNotMatch(shell, /painter\.create(?:Canvas|Image|Text|Chart)\s*\(/);
});

test('PRE-4 future feature surfaces do not pretend to be authoring-complete', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');

  assert.match(shell, /Owned by the selected feature phase/);
  assert.match(shell, /authoring controls arrive in the owning feature phase/);
  assert.match(shell, /authoring controls arrive in the owning feature phase/);
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


test('live Studio UX moves Preview and Generate Code into modals and keeps the dock editor-first', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const modals = read('components/studio/visual/VisualStudioModals.tsx');

  assert.doesNotMatch(shell, /\['preview', 'Preview'\]/);
  assert.doesNotMatch(shell, /Canvas Output/);
  assert.match(shell, /data-visual-live-code/);
  assert.match(shell, /Autosaved · canvas synced/);
  assert.match(shell, /renderVisualPreview\(true\)/);
  assert.match(shell, /setCodeModalOpen\(true\)/);
  assert.match(modals, /data-visual-preview-modal/);
  assert.match(modals, /data-visual-code-modal/);
  assert.match(modals, /Download/);
  assert.match(modals, /Canvas name/);
  assert.match(modals, /File name/);
});
